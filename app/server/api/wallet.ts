import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/index.js';
import { authenticate } from '../auth/index.js';

export const walletRouter = Router();

walletRouter.get('/transactions', authenticate, async (req, res) => {
  try {
    const walletRows = await sql`SELECT id FROM wallets WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (walletRows.length === 0) {
      return res.json([]);
    }
    const rows = await sql`
      SELECT id, type, amount, description, reference, created_at
      FROM wallet_transactions
      WHERE wallet_id = ${walletRows[0].id}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return res.json(rows);
  } catch (err) {
    console.error('wallet transactions error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

walletRouter.get('/balance', authenticate, async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM wallets WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (rows.length === 0) {
      const id = uuid();
      await sql`
        INSERT INTO wallets (id, user_id, balance, currency, created_at, last_updated_at)
        VALUES (${id}, ${req.user!.sub}, 0, 'NGN', NOW(), NOW())
      `;
      return res.json({ id, user_id: req.user!.sub, balance: 0, currency: 'NGN' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('wallet balance error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

walletRouter.post('/topup', authenticate, async (req, res) => {
  try {
    const { amount, method } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ detail: 'Invalid amount' });
    }
    const walletRows = await sql`SELECT * FROM wallets WHERE user_id = ${req.user!.sub} LIMIT 1`;
    let walletId: string;
    if (walletRows.length === 0) {
      walletId = uuid();
      await sql`
        INSERT INTO wallets (id, user_id, balance, currency, created_at, updated_at)
        VALUES (${walletId}, ${req.user!.sub}, 0, 'NGN', NOW(), NOW())
      `;
    } else {
      walletId = walletRows[0].id;
    }
    await sql`UPDATE wallets SET balance = balance + ${amount}, last_updated_at = NOW() WHERE id = ${walletId}`;
    const txnId = uuid();
    await sql`
      INSERT INTO wallet_transactions (id, wallet_id, type, amount, description, reference, created_at)
      VALUES (${txnId}, ${walletId}, 'CREDIT', ${amount}, ${`Wallet topup via ${method || 'manual'}`}, ${`TOPUP-${Date.now()}`}, NOW())
    `;
    const rows = await sql`SELECT * FROM wallets WHERE id = ${walletId} LIMIT 1`;
    return res.json(rows[0]);
  } catch (err) {
    console.error('wallet topup error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});
