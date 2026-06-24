import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/index.js';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken, verifyToken, hashPassword, comparePassword, authenticate, requireRole } from '../auth/index.js';
import type { AuthRequest } from '../auth/index.js';

export const authRouter = Router();

authRouter.post('/request-otp', async (req, res) => {
  try {
    const { phone_number } = req.body;
    if (!phone_number) {
      return res.status(400).json({ detail: 'Phone number is required' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await sql`INSERT INTO otp_records (phone, otp_code, expires_at) VALUES (${phone_number}, ${otp}, NOW() + INTERVAL '5 minutes')`;
    if (process.env.NODE_ENV === 'development') console.log(`[DEV] OTP for ${phone_number}: ${otp}`);
    return res.json({ status: 'success', message: 'OTP sent successfully' });
  } catch (err) {
    console.error('request-otp error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

authRouter.post('/verify-otp', async (req, res) => {
  try {
    const { phone_number, otp_code } = req.body;
    if (!phone_number || !otp_code) {
      return res.status(400).json({ detail: 'Phone and OTP are required' });
    }
    const rows = await sql`
      SELECT * FROM otp_records 
      WHERE phone = ${phone_number} AND otp_code = ${otp_code} AND is_used = false AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1
    `;
    if (rows.length === 0) {
      return res.status(400).json({ detail: 'Invalid or expired OTP' });
    }
    await sql`UPDATE otp_records SET is_used = true WHERE id = ${rows[0].id}`;
    const userRows = await sql`SELECT * FROM users WHERE phone = ${phone_number} LIMIT 1`;
    if (userRows.length === 0) {
      return res.json({ status: 'success', message: 'OTP verified', is_new_user: true });
    }
    const user = userRows[0];
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);
    await sql`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;
    return res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      expires_in: 900,
      user: serializeUser(user),
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

authRouter.post('/register-with-otp', async (req, res) => {
  try {
    const { phone_number, email, first_name, last_name, password, otp_code } = req.body;
    const otpRows = await sql`
      SELECT * FROM otp_records 
      WHERE phone = ${phone_number} AND otp_code = ${otp_code} AND is_used = false AND expires_at > NOW()
      LIMIT 1
    `;
    if (otpRows.length === 0) {
      return res.status(400).json({ detail: 'Invalid or expired OTP' });
    }
    await sql`UPDATE otp_records SET is_used = true WHERE id = ${otpRows[0].id}`;
    const existing = await sql`SELECT id FROM users WHERE phone = ${phone_number} LIMIT 1`;
    if (existing.length > 0) {
      return res.status(409).json({ detail: 'User already exists' });
    }
    const hashedPassword = await hashPassword(password);
    const id = uuid();
    await sql`
      INSERT INTO users (id, phone, email, first_name, last_name, password_hash, role, is_active, is_verified, created_at, updated_at)
      VALUES (${id}, ${phone_number}, ${email || null}, ${first_name}, ${last_name}, ${hashedPassword}, 'CUSTOMER', true, true, NOW(), NOW())
    `;
    const accessToken = generateAccessToken(id, 'CUSTOMER');
    const refreshToken = generateRefreshToken(id, 'CUSTOMER');
    const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
    return res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      expires_in: 900,
      user: serializeUser(rows[0]),
    });
  } catch (err) {
    console.error('register-with-otp error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

authRouter.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password, role } = req.body;
    if (!first_name || !last_name || !phone || !password) {
      return res.status(400).json({ detail: 'First name, last name, phone, and password are required' });
    }
    const allowedRoles = ['CUSTOMER', 'RIDER', 'VENDOR'];
    const userRole = allowedRoles.includes(role) ? role : 'CUSTOMER';
    const existing = await sql`SELECT id FROM users WHERE phone = ${phone} LIMIT 1`;
    if (existing.length > 0) {
      return res.status(409).json({ detail: 'User already exists' });
    }
    if (email) {
      const emailExisting = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
      if (emailExisting.length > 0) {
        return res.status(409).json({ detail: 'Email already in use' });
      }
    }
    const hashedPassword = await hashPassword(password);
    const id = uuid();
    await sql`
      INSERT INTO users (id, phone, email, first_name, last_name, password_hash, role, is_active, is_verified, created_at, updated_at)
      VALUES (${id}, ${phone}, ${email || null}, ${first_name}, ${last_name}, ${hashedPassword}, ${userRole}, true, true, NOW(), NOW())
    `;
    if (userRole === 'VENDOR') {
      const vendorId = uuid();
      await sql`
        INSERT INTO vendors (id, user_id, business_name, business_category, created_at)
        VALUES (${vendorId}, ${id}, ${first_name + ' ' + last_name}, 'General', NOW())
      `;
    }
    const accessToken = generateAccessToken(id, userRole);
    const refreshToken = generateRefreshToken(id, userRole);
    const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
    return res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      expires_in: 900,
      user: serializeUser(rows[0]),
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ detail: 'Phone and password are required' });
    }
    const rows = await sql`SELECT * FROM users WHERE phone = ${phone} LIMIT 1`;
    if (rows.length === 0) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }
    const user = rows[0];
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);
    await sql`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;
    return res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      expires_in: 900,
      user: serializeUser(user),
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

authRouter.post('/admin-login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const rows = await sql`SELECT * FROM users WHERE phone = ${phone} AND role = 'ADMIN' LIMIT 1`;
    if (rows.length === 0) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }
    const user = rows[0];
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);
    await sql`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;
    return res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      expires_in: 86400,
      user: serializeUser(user),
    });
  } catch (err) {
    console.error('admin-login error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

authRouter.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ detail: 'Refresh token is required' });
    }
    const payload = verifyToken(refresh_token);
    if (payload.type !== 'refresh') {
      return res.status(401).json({ detail: 'Invalid token type' });
    }
    const rows = await sql`SELECT * FROM users WHERE id = ${payload.sub} AND is_active = true LIMIT 1`;
    if (rows.length === 0) {
      return res.status(401).json({ detail: 'User not found or inactive' });
    }
    const accessToken = generateAccessToken(payload.sub, payload.role);
    return res.json({ access_token: accessToken, expires_in: 900 });
  } catch {
    return res.status(401).json({ detail: 'Invalid refresh token' });
  }
});

authRouter.post('/logout', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (user_id) {
      await sql`UPDATE users SET last_login_at = NULL WHERE id = ${user_id}`;
    }
    return res.json({ detail: 'Logged out successfully' });
  } catch (err) {
    console.error('logout error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

authRouter.post('/forgot-password', async (req, res) => {
  try {
    const { email, phone } = req.body;
    if (!email && !phone) {
      return res.status(400).json({ detail: 'Email or phone is required' });
    }
    let rows;
    if (email) {
      rows = await sql`SELECT id, email FROM users WHERE email = ${email} LIMIT 1`;
    } else {
      rows = await sql`SELECT id, phone FROM users WHERE phone = ${phone} LIMIT 1`;
    }
    if (rows.length > 0) {
      const user = rows[0];
      const resetToken = jwt.sign(
        { sub: user.id, type: 'password_reset' },
        process.env.JWT_SECRET || 'campgo-dev-secret-change-in-production',
        { expiresIn: '15m' }
      );
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await sql`
        UPDATE users SET password_reset_token = ${resetToken}, password_reset_expires_at = ${expiresAt} WHERE id = ${user.id}
      `;
      if (process.env.NODE_ENV === 'development') console.log(`[DEV] Password reset token for ${email || phone}: ${resetToken}`);
    }
    return res.json({ status: 'success', message: 'If the account exists, a reset link has been sent' });
  } catch (err) {
    console.error('forgot-password error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

authRouter.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ detail: 'Token and password are required' });
    }
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'campgo-dev-secret-change-in-production') as any;
    } catch {
      return res.status(400).json({ detail: 'Invalid or expired token' });
    }
    if (payload.type !== 'password_reset') {
      return res.status(400).json({ detail: 'Invalid token type' });
    }
    const rows = await sql`
      SELECT id FROM users WHERE id = ${payload.sub} AND password_reset_token = ${token} AND password_reset_expires_at > NOW() LIMIT 1
    `;
    if (rows.length === 0) {
      return res.status(400).json({ detail: 'Invalid or expired reset token' });
    }
    const hashedPassword = await hashPassword(password);
    await sql`
      UPDATE users SET password_hash = ${hashedPassword}, password_reset_token = NULL, password_reset_expires_at = NULL, updated_at = NOW() WHERE id = ${rows[0].id}
    `;
    return res.json({ status: 'success', message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('reset-password error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

authRouter.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ detail: 'Token is required' });
    }
    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'campgo-dev-secret-change-in-production');
    } catch {
      return res.status(400).json({ detail: 'Invalid or expired token' });
    }
    if (payload.type !== 'email_verification') {
      return res.status(400).json({ detail: 'Invalid token type' });
    }
    const rows = await sql`
      SELECT id FROM users WHERE id = ${payload.sub} AND email_verification_token = ${token} LIMIT 1
    `;
    if (rows.length === 0) {
      return res.status(400).json({ detail: 'Invalid verification token' });
    }
    await sql`
      UPDATE users SET is_verified = true, email_verification_token = NULL, verified_at = NOW(), updated_at = NOW() WHERE id = ${rows[0].id}
    `;
    return res.json({ status: 'success', message: 'Email verified successfully' });
  } catch (err) {
    console.error('verify-email error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

authRouter.post('/send-verification-email', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ detail: 'User ID is required' });
    }
    const rows = await sql`SELECT id, email FROM users WHERE id = ${user_id} AND email IS NOT NULL LIMIT 1`;
    if (rows.length === 0) {
      return res.status(400).json({ detail: 'User not found or no email on record' });
    }
    const verificationToken = jwt.sign(
      { sub: rows[0].id, type: 'email_verification' },
      process.env.JWT_SECRET || 'campgo-dev-secret-change-in-production',
      { expiresIn: '24h' }
    );
    await sql`
      UPDATE users SET email_verification_token = ${verificationToken}, updated_at = NOW() WHERE id = ${rows[0].id}
    `;
    if (process.env.NODE_ENV === 'development') console.log(`[DEV] Verification email for ${rows[0].email}: ${verificationToken}`);
    return res.json({ status: 'success', message: 'Verification email sent' });
  } catch (err) {
    console.error('send-verification-email error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

authRouter.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const rows = await sql`SELECT * FROM users WHERE id = ${req.user!.sub} AND is_active = true LIMIT 1`;
    if (rows.length === 0) {
      return res.status(404).json({ detail: 'User not found' });
    }
    return res.json({ user: serializeUser(rows[0]) });
  } catch (err) {
    console.error('/me error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

authRouter.put('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const { first_name, last_name, email, profile_image_url } = req.body;
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (first_name !== undefined) { fields.push(`first_name = $${idx++}`); values.push(first_name); }
    if (last_name !== undefined) { fields.push(`last_name = $${idx++}`); values.push(last_name); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (profile_image_url !== undefined) { fields.push(`profile_image_url = $${idx++}`); values.push(profile_image_url); }
    if (fields.length === 0) {
      return res.status(400).json({ detail: 'No fields to update' });
    }
    fields.push(`updated_at = NOW()`);
    values.push(req.user!.sub);
    await sql.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    const rows = await sql`SELECT * FROM users WHERE id = ${req.user!.sub} LIMIT 1`;
    return res.json({ user: serializeUser(rows[0]) });
  } catch (err) {
    console.error('/profile error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

authRouter.post('/change-password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ detail: 'Current and new password are required' });
    }
    const rows = await sql`SELECT password_hash FROM users WHERE id = ${req.user!.sub} LIMIT 1`;
    if (rows.length === 0) {
      return res.status(404).json({ detail: 'User not found' });
    }
    const valid = await comparePassword(current_password, rows[0].password_hash);
    if (!valid) {
      return res.status(400).json({ detail: 'Current password is incorrect' });
    }
    const hashedPassword = await hashPassword(new_password);
    await sql`UPDATE users SET password_hash = ${hashedPassword}, updated_at = NOW() WHERE id = ${req.user!.sub}`;
    return res.json({ status: 'success', message: 'Password changed successfully' });
  } catch (err) {
    console.error('change-password error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

function serializeUser(row: any) {
  return {
    id: row.id,
    phone: row.phone,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    role: row.role,
    is_active: row.is_active,
    is_verified: row.is_verified,
    profile_image_url: row.profile_image_url,
    region: row.region,
    timezone: row.timezone,
    preferred_language: row.preferred_language,
    last_login_at: row.last_login_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
