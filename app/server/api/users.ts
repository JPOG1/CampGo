import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/index.js';
import { authenticate, hashPassword } from '../auth/index.js';

export const usersRouter = Router();

usersRouter.get('/me', authenticate, async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM users WHERE id = ${req.user!.sub} LIMIT 1`;
    if (rows.length === 0) return res.status(404).json({ detail: 'User not found' });
    return res.json(serializeUser(rows[0]));
  } catch (err) {
    console.error('get me error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

usersRouter.get('/:id', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM users WHERE id = ${req.params.id} LIMIT 1`;
    if (rows.length === 0) {
      return res.status(404).json({ detail: 'User not found' });
    }
    return res.json(serializeUser(rows[0]));
  } catch (err) {
    console.error('get user error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

usersRouter.post('/', async (req, res) => {
  try {
    const { phone, email, first_name, last_name, password, role } = req.body;
    const existing = await sql`SELECT id FROM users WHERE phone = ${phone} LIMIT 1`;
    if (existing.length > 0) {
      return res.status(409).json({ detail: 'User already exists' });
    }
    const id = uuid();
    const hashedPassword = await hashPassword(password);
    await sql`
      INSERT INTO users (id, phone, email, first_name, last_name, password_hash, role, is_active, is_verified, created_at, updated_at)
      VALUES (${id}, ${phone}, ${email || null}, ${first_name}, ${last_name}, ${hashedPassword}, ${role || 'CUSTOMER'}, true, true, NOW(), NOW())
    `;
    return res.status(201).json({ id, phone });
  } catch (err) {
    console.error('create user error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

usersRouter.patch('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user!.sub;
    const { first_name, last_name, email } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    if (first_name !== undefined) { updates.push('first_name'); values.push(first_name); }
    if (last_name !== undefined) { updates.push('last_name'); values.push(last_name); }
    if (email !== undefined) { updates.push('email'); values.push(email); }
    if (updates.length === 0) {
      return res.status(400).json({ detail: 'No fields to update' });
    }
    updates.push('updated_at'); values.push(new Date());
    const setClauseUsers = updates.map((c, i) => `${c} = $${i + 1}`).join(', ');
    await sql.unsafe(`UPDATE users SET ${setClauseUsers} WHERE id = $${updates.length + 1}`, [...values, userId]);
    const rows = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
    return res.json(serializeUser(rows[0]));
  } catch (err) {
    console.error('update profile error:', err);
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
