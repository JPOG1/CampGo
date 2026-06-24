import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/index.js';
import { authenticate } from '../auth/index.js';

export const paymentsRouter = Router();

paymentsRouter.post('/initiate', authenticate, async (req, res) => {
  try {
    const id = uuid();
    const { amount, method } = req.body;
    if (!amount || !method) {
      return res.status(400).json({ status: 'error', message: 'Amount and method are required' });
    }
    const reference = `CAMPGO-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await sql`
      INSERT INTO payments (id, user_id, amount, status, method, reference, created_at)
      VALUES (${id}, ${req.user!.sub}, ${amount}, 'PENDING', ${method}, ${reference}, NOW())
    `;
    return res.json({ payment_id: id, reference, amount, status: 'PENDING' });
  } catch (err) {
    console.error('initiate payment error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

paymentsRouter.get('/verify/:reference', authenticate, async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM payments WHERE reference = ${req.params.reference} LIMIT 1`;
    if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Payment not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('verify payment error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

paymentsRouter.post('/webhook', async (req, res) => {
  try {
    const { event, data } = req.body;
    if (event === 'charge.success') {
      const { reference, status, amount } = data;
      await sql`UPDATE payments SET status = 'SUCCESS' WHERE reference = ${reference}`;
      const [payment] = await sql`SELECT * FROM payments WHERE reference = ${reference} LIMIT 1`;
      if (payment) {
        const existing = await sql`SELECT id FROM wallets WHERE user_id = ${payment.user_id} LIMIT 1`;
        if (existing.length > 0) {
          await sql`UPDATE wallets SET balance = balance + ${amount}, last_updated_at = NOW() WHERE user_id = ${payment.user_id}`;
        } else {
          await sql`INSERT INTO wallets (id, user_id, balance, currency, created_at, last_updated_at) VALUES (${uuid()}, ${payment.user_id}, ${amount}, 'NGN', NOW(), NOW())`;
        }
        await sql`INSERT INTO wallet_transactions (id, wallet_id, type, amount, description, reference, created_at) VALUES (${uuid()}, (SELECT id FROM wallets WHERE user_id = ${payment.user_id} LIMIT 1), 'CREDIT', ${amount}, 'Payment via gateway', ${reference}, NOW())`;
      }
    }
    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('webhook error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

paymentsRouter.post('/refund', authenticate, async (req, res) => {
  try {
    const { payment_id } = req.body;
    await sql`UPDATE payments SET status = 'REFUNDED' WHERE id = ${payment_id}`;
    return res.json({ status: 'success', message: 'Payment refunded' });
  } catch (err) {
    console.error('refund error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

paymentsRouter.post('/payout', authenticate, async (req, res) => {
  try {
    const { amount, bank_account } = req.body;
    const id = uuid();
    const riderRows = await sql`SELECT id FROM riders WHERE user_id = ${req.user!.sub} LIMIT 1`;
    const riderId = riderRows.length > 0 ? riderRows[0].id : null;
    await sql`
      INSERT INTO payouts (id, rider_id, amount, bank_account, status, created_at)
      VALUES (${id}, ${riderId}, ${amount}, ${bank_account}, 'PENDING', NOW())
    `;
    return res.json({ payout_id: id, status: 'PENDING' });
  } catch (err) {
    console.error('payout error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

paymentsRouter.get('/wallet/balance', authenticate, async (req, res) => {
  try {
    const rows = await sql`SELECT balance, currency FROM wallets WHERE user_id = ${req.user!.sub} LIMIT 1`;
    return res.json(rows[0] || { balance: 0, currency: 'NGN' });
  } catch (err) {
    console.error('wallet balance error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

paymentsRouter.post('/wallet/topup', authenticate, async (req, res) => {
  try {
    const { amount, method } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ detail: 'Invalid amount' });
    let wallet = await sql`SELECT id FROM wallets WHERE user_id = ${req.user!.sub} LIMIT 1`;
    let walletId: string;
    if (wallet.length === 0) {
      walletId = uuid();
      await sql`INSERT INTO wallets (id, user_id, balance, currency, created_at, last_updated_at) VALUES (${walletId}, ${req.user!.sub}, 0, 'NGN', NOW(), NOW())`;
    } else {
      walletId = wallet[0].id;
    }
    await sql`UPDATE wallets SET balance = balance + ${amount}, last_updated_at = NOW() WHERE id = ${walletId}`;
    await sql`INSERT INTO wallet_transactions (id, wallet_id, type, amount, description, reference, created_at) VALUES (${uuid()}, ${walletId}, 'CREDIT', ${amount}, 'Wallet topup', ${`TOPUP-${Date.now()}`}, NOW())`;
    const [updated] = await sql`SELECT * FROM wallets WHERE id = ${walletId} LIMIT 1`;
    return res.json(updated);
  } catch (err) {
    console.error('wallet topup error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});
