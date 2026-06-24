import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/index.js';
import { authenticate } from '../auth/index.js';

export const deliveryProofRouter = Router();

deliveryProofRouter.post('/:id/proof', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { photo_url, signature_url, notes } = req.body;

    const existing = await sql`SELECT id FROM delivery_proof WHERE delivery_id = ${id} LIMIT 1`;
    if (existing.length > 0) {
      const proofId = existing[0].id;
      const updates: string[] = [];
      const values: any[] = [];
      if (photo_url !== undefined) { updates.push('photo_url'); values.push(photo_url); }
      if (signature_url !== undefined) { updates.push('signature_url'); values.push(signature_url); }
      if (notes !== undefined) { updates.push('notes'); values.push(notes); }
      if (updates.length > 0) {
        const setClause = updates.map((c, i) => `${c} = $${i + 1}`).join(', ');
        await sql.unsafe(`UPDATE delivery_proof SET ${setClause} WHERE id = $${updates.length + 1}`, [...values, proofId]);
      }
      const rows = await sql`SELECT * FROM delivery_proof WHERE id = ${proofId} LIMIT 1`;
      return res.json(rows[0]);
    }

    const proofId = uuid();
    await sql`
      INSERT INTO delivery_proof (id, delivery_id, photo_url, signature_url, notes, created_at)
      VALUES (${proofId}, ${id}, ${photo_url || null}, ${signature_url || null}, ${notes || null}, NOW())
    `;
    const rows = await sql`SELECT * FROM delivery_proof WHERE id = ${proofId} LIMIT 1`;
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('create delivery proof error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

deliveryProofRouter.get('/:id/proof', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await sql`SELECT * FROM delivery_proof WHERE delivery_id = ${id} LIMIT 1`;
    if (rows.length === 0) {
      return res.status(404).json({ detail: 'Proof not found' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('get delivery proof error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});
