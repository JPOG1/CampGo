import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/index.js';
import { authenticate } from '../auth/index.js';

export const supportRouter = Router();

supportRouter.get('/tickets', authenticate, async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM support_tickets WHERE user_id = ${req.user!.sub} ORDER BY created_at DESC
    `;
    return res.json(rows);
  } catch (err) {
    console.error('get tickets error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

supportRouter.post('/tickets', authenticate, async (req, res) => {
  try {
    const id = uuid();
    const { subject, description } = req.body;
    await sql`
      INSERT INTO support_tickets (id, user_id, subject, description, status, priority, created_at, updated_at)
      VALUES (${id}, ${req.user!.sub}, ${subject}, ${description}, 'OPEN', 'MEDIUM', NOW(), NOW())
    `;
    const rows = await sql`SELECT * FROM support_tickets WHERE id = ${id} LIMIT 1`;
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('create ticket error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});
