import type { Request, Response, NextFunction } from 'express';

export function validate(schema: Record<string, (v: any) => string | null>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string> = {};
    for (const [field, validator] of Object.entries(schema)) {
      const value = req.body[field] ?? req.query[field] ?? req.params[field];
      const error = validator(value);
      if (error) errors[field] = error;
    }
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ detail: 'Validation failed', errors });
    }
    next();
  };
}

export const validators = {
  required: (msg?: string) => (v: any) => (!v && v !== 0 ? msg || 'Field is required' : null),
  string: (msg?: string) => (v: any) => (v !== undefined && typeof v !== 'string' ? msg || 'Must be a string' : null),
  number: (msg?: string) => (v: any) => (v !== undefined && isNaN(Number(v)) ? msg || 'Must be a number' : null),
  email: (msg?: string) => (v: any) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? msg || 'Invalid email' : null),
  phone: (msg?: string) => (v: any) => (v && !/^\+?[\d\s-]{7,15}$/.test(v) ? msg || 'Invalid phone' : null),
  min: (min: number, msg?: string) => (v: any) => (v !== undefined && Number(v) < min ? msg || `Minimum is ${min}` : null),
  max: (max: number, msg?: string) => (v: any) => (v !== undefined && Number(v) > max ? msg || `Maximum is ${max}` : null),
  oneOf: (options: any[], msg?: string) => (v: any) => (v !== undefined && !options.includes(v) ? msg || `Must be one of: ${options.join(', ')}` : null),
};
