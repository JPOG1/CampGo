import { describe, it, expect } from 'vitest';
import { validators, validate } from '../server/middleware/validate.js';

describe('Validators', () => {
  describe('required', () => {
    it('should reject undefined', () => {
      expect(validators.required()(undefined)).toBe('Field is required');
    });

    it('should reject null', () => {
      expect(validators.required()(null)).toBe('Field is required');
    });

    it('should reject empty string', () => {
      expect(validators.required()('')).toBe('Field is required');
    });

    it('should accept valid value', () => {
      expect(validators.required()('hello')).toBeNull();
    });

    it('should accept zero', () => {
      expect(validators.required()(0)).toBeNull();
    });

    it('should reject false (falsy value)', () => {
      expect(validators.required()(false)).toBe('Field is required');
    });

    it('should use custom message', () => {
      expect(validators.required('Custom message')(undefined)).toBe('Custom message');
    });
  });

  describe('email', () => {
    it('should validate correct email', () => {
      expect(validators.email()('test@example.com')).toBeNull();
    });

    it('should validate email with subdomain', () => {
      expect(validators.email()('user@sub.example.co.uk')).toBeNull();
    });

    it('should reject invalid email', () => {
      expect(validators.email()('not-an-email')).toBe('Invalid email');
    });

    it('should reject email without domain', () => {
      expect(validators.email()('user@')).toBe('Invalid email');
    });

    it('should accept undefined (optional)', () => {
      expect(validators.email()(undefined)).toBeNull();
    });

    it('should accept null (optional)', () => {
      expect(validators.email()(null)).toBeNull();
    });

    it('should accept empty string (optional)', () => {
      expect(validators.email()('')).toBeNull();
    });

    it('should use custom message', () => {
      expect(validators.email('Bad email format')('bad')).toBe('Bad email format');
    });
  });

  describe('phone', () => {
    it('should validate international phone', () => {
      expect(validators.phone()('+2348012345678')).toBeNull();
    });

    it('should validate local phone with dashes', () => {
      expect(validators.phone()('080-1234-5678')).toBeNull();
    });

    it('should validate phone with spaces', () => {
      expect(validators.phone()('+1 234 567 8900')).toBeNull();
    });

    it('should reject invalid phone', () => {
      expect(validators.phone()('abc')).toBe('Invalid phone');
    });

    it('should accept undefined (optional)', () => {
      expect(validators.phone()(undefined)).toBeNull();
    });
  });

  describe('min', () => {
    it('should reject value below minimum', () => {
      expect(validators.min(5)(3)).toBe('Minimum is 5');
    });

    it('should accept value at minimum', () => {
      expect(validators.min(5)(5)).toBeNull();
    });

    it('should accept value above minimum', () => {
      expect(validators.min(5)(10)).toBeNull();
    });

    it('should accept undefined', () => {
      expect(validators.min(5)(undefined)).toBeNull();
    });
  });

  describe('max', () => {
    it('should reject value above maximum', () => {
      expect(validators.max(10)(15)).toBe('Maximum is 10');
    });

    it('should accept value at maximum', () => {
      expect(validators.max(10)(10)).toBeNull();
    });

    it('should accept value below maximum', () => {
      expect(validators.max(10)(8)).toBeNull();
    });

    it('should accept undefined', () => {
      expect(validators.max(10)(undefined)).toBeNull();
    });
  });

  describe('oneOf', () => {
    it('should accept valid option', () => {
      expect(validators.oneOf(['A', 'B', 'C'])('A')).toBeNull();
    });

    it('should reject invalid option', () => {
      expect(validators.oneOf(['A', 'B', 'C'])('D')).toBe('Must be one of: A, B, C');
    });

    it('should accept undefined', () => {
      expect(validators.oneOf(['A', 'B', 'C'])(undefined)).toBeNull();
    });

    it('should handle numeric options', () => {
      expect(validators.oneOf([1, 2, 3])(1)).toBeNull();
      expect(validators.oneOf([1, 2, 3])(4)).toBe('Must be one of: 1, 2, 3');
    });
  });

  describe('string', () => {
    it('should accept string value', () => {
      expect(validators.string()('hello')).toBeNull();
    });

    it('should reject number', () => {
      expect(validators.string()(123)).toBe('Must be a string');
    });

    it('should reject object', () => {
      expect(validators.string()({})).toBe('Must be a string');
    });

    it('should accept undefined', () => {
      expect(validators.string()(undefined)).toBeNull();
    });

    it('should reject boolean', () => {
      expect(validators.string()(true)).toBe('Must be a string');
    });
  });

  describe('number', () => {
    it('should accept numeric string', () => {
      expect(validators.number()('123')).toBeNull();
    });

    it('should reject non-numeric string', () => {
      expect(validators.number()('abc')).toBe('Must be a number');
    });

    it('should accept actual number', () => {
      expect(validators.number()(42)).toBeNull();
    });

    it('should accept undefined', () => {
      expect(validators.number()(undefined)).toBeNull();
    });

    it('should accept null (Number(null) is 0)', () => {
      expect(validators.number()(null)).toBeNull();
    });
  });

  describe('validate middleware', () => {
    it('should be a function', () => {
      expect(typeof validate).toBe('function');
    });

    it('should return a middleware function', () => {
      const middleware = validate({ name: validators.required() });
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3);
    });
  });
});
