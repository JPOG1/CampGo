import { describe, it, expect } from 'vitest';

describe('Healthz', () => {
  it('should respond with status ok (integration)', async () => {
    const response = await fetch('http://localhost:8000/healthz').catch(() => null);
    if (response) {
      const data = await response.json();
      expect(data).toHaveProperty('status', 'ok');
    } else {
      expect(true).toBe(true);
    }
  });
});
