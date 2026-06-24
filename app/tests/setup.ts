import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_secret';
  process.env.DATABASE_URL = 'postgres://campgo:campgo_secret@localhost:5432/campgo_test';
});

afterAll(() => {});
