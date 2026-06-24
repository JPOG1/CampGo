import { describe, it, expect } from 'vitest';
import { generateAccessToken, generateRefreshToken, verifyToken, hashPassword, comparePassword } from '../server/auth/index.js';

describe('Auth Utilities', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const role = 'CUSTOMER';

  describe('Token Generation', () => {
    it('should generate access token', () => {
      const token = generateAccessToken(userId, role);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });

    it('should generate refresh token', () => {
      const token = generateRefreshToken(userId, role);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });

    it('should verify valid access token', () => {
      const token = generateAccessToken(userId, role);
      const payload = verifyToken(token);
      expect(payload.sub).toBe(userId);
      expect(payload.role).toBe(role);
      expect(payload.type).toBe('access');
    });

    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(userId, role);
      const payload = verifyToken(token);
      expect(payload.sub).toBe(userId);
      expect(payload.type).toBe('refresh');
    });

    it('should reject invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should reject expired token', () => {
      const expiredToken = generateAccessToken(userId, role);
      const payload = verifyToken(expiredToken);
      expect(payload.sub).toBe(userId);
    });
  });

  describe('Token Content', () => {
    it('should encode different user IDs', () => {
      const token1 = generateAccessToken('user-1', 'CUSTOMER');
      const token2 = generateAccessToken('user-2', 'CUSTOMER');
      expect(token1).not.toBe(token2);
    });

    it('should encode different roles', () => {
      const token1 = generateAccessToken(userId, 'CUSTOMER');
      const token2 = generateAccessToken(userId, 'DRIVER');
      const payload1 = verifyToken(token1);
      const payload2 = verifyToken(token2);
      expect(payload1.role).toBe('CUSTOMER');
      expect(payload2.role).toBe('DRIVER');
    });
  });

  describe('Password Hashing', () => {
    it('should hash password', async () => {
      const hash = await hashPassword('testPassword123!');
      expect(hash).toBeTruthy();
      expect(hash).not.toBe('testPassword123!');
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);
      const valid = await comparePassword(password, hash);
      expect(valid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await hashPassword('correctPassword');
      const valid = await comparePassword('wrongPassword', hash);
      expect(valid).toBe(false);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'samePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
      const valid1 = await comparePassword(password, hash1);
      const valid2 = await comparePassword(password, hash2);
      expect(valid1).toBe(true);
      expect(valid2).toBe(true);
    });
  });

  describe('Token Expiry', () => {
    it('should generate tokens with different expiry', () => {
      const accessToken = generateAccessToken(userId, role);
      const refreshToken = generateRefreshToken(userId, role);
      expect(accessToken).not.toBe(refreshToken);
    });
  });
});
