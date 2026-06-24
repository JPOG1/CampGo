import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import { sql } from '../db/index.js';
import { authenticate } from '../auth/index.js';

export const gatewayRouter = Router();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY || '';

gatewayRouter.post('/paystack/initialize', authenticate, async (req, res) => {
  try {
    const { amount, email, currency } = req.body;
    if (!PAYSTACK_SECRET) return res.status(503).json({ detail: 'Payment gateway not configured' });
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount * 100, email, currency: currency || 'NGN', reference: `CAMPGO-${Date.now()}` }),
    });
    const data = await response.json();
    if (!data.status) return res.status(400).json({ detail: data.message });
    await sql`INSERT INTO payments (id, user_id, amount, status, method, reference, created_at) VALUES (${uuid()}, ${req.user!.sub}, ${amount}, 'PENDING', 'PAYSTACK', ${data.data.reference}, NOW())`;
    return res.json({ authorization_url: data.data.authorization_url, reference: data.data.reference, access_code: data.data.access_code });
  } catch (err) {
    console.error('paystack initialize error:', err);
    return res.status(500).json({ detail: 'Payment initialization failed' });
  }
});

gatewayRouter.get('/paystack/verify/:reference', authenticate, async (req, res) => {
  try {
    if (!PAYSTACK_SECRET) return res.status(503).json({ detail: 'Payment gateway not configured' });
    const response = await fetch(`https://api.paystack.co/transaction/verify/${req.params.reference}`, {
      headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET}` },
    });
    const data = await response.json();
    if (data.status && data.data.status === 'success') {
      await sql`UPDATE payments SET status = 'SUCCESS' WHERE reference = ${req.params.reference}`;
      const [payment] = await sql`SELECT * FROM payments WHERE reference = ${req.params.reference} LIMIT 1`;
      if (payment) {
        const [wallet] = await sql`SELECT id FROM wallets WHERE user_id = ${payment.user_id} LIMIT 1`;
        if (wallet) {
          await sql`UPDATE wallets SET balance = balance + ${data.data.amount / 100}, last_updated_at = NOW() WHERE user_id = ${payment.user_id}`;
        }
      }
    }
    return res.json(data);
  } catch (err) {
    console.error('paystack verify error:', err);
    return res.status(500).json({ detail: 'Payment verification failed' });
  }
});

gatewayRouter.post('/flutterwave/initialize', authenticate, async (req, res) => {
  try {
    const { amount, email, currency } = req.body;
    if (!FLW_SECRET) return res.status(503).json({ detail: 'Payment gateway not configured' });
    const txRef = `CAMPGO-${Date.now()}`;
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${FLW_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tx_ref: txRef,
        amount,
        currency: currency || 'NGN',
        redirect_url: `${req.headers.origin || 'http://localhost:5173'}/payment/callback`,
        customer: { email },
        customizations: { title: 'CampGo', description: 'Wallet Topup' },
      }),
    });
    const data = await response.json();
    if (data.status === 'error') return res.status(400).json({ detail: data.message });
    await sql`INSERT INTO payments (id, user_id, amount, status, method, reference, created_at) VALUES (${uuid()}, ${req.user!.sub}, ${amount}, 'PENDING', 'FLUTTERWAVE', ${txRef}, NOW())`;
    return res.json({ authorization_url: data.data.link, reference: txRef });
  } catch (err) {
    console.error('flutterwave initialize error:', err);
    return res.status(500).json({ detail: 'Payment initialization failed' });
  }
});

gatewayRouter.get('/flutterwave/verify/:txRef', authenticate, async (req, res) => {
  try {
    if (!FLW_SECRET) return res.status(503).json({ detail: 'Payment gateway not configured' });
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${req.params.txRef}/verify`, {
      headers: { 'Authorization': `Bearer ${FLW_SECRET}` },
    });
    const data = await response.json();
    if (data.status === 'success' && data.data.status === 'successful') {
      await sql`UPDATE payments SET status = 'SUCCESS', provider_reference = ${data.data.id} WHERE reference = ${req.params.txRef}`;
    }
    return res.json(data);
  } catch (err) {
    console.error('flutterwave verify error:', err);
    return res.status(500).json({ detail: 'Payment verification failed' });
  }
});

// POST /webhook/paystack - Paystack webhook handler
gatewayRouter.post('/webhook/paystack', async (req, res) => {
  try {
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(JSON.stringify(req.body)).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ detail: 'Invalid signature' });
    }
    const event = req.body;
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      const amount = event.data.amount / 100;
      const [payment] = await sql`SELECT * FROM payments WHERE reference = ${reference} AND status = 'PENDING' LIMIT 1`;
      if (payment) {
        await sql`UPDATE payments SET status = 'SUCCESS', provider_reference = ${event.data.id} WHERE reference = ${reference}`;
        const [wallet] = await sql`SELECT id FROM wallets WHERE user_id = ${payment.user_id} LIMIT 1`;
        if (wallet) {
          await sql`UPDATE wallets SET balance = balance + ${amount}, last_updated_at = NOW() WHERE user_id = ${payment.user_id}`;
        } else {
          await sql`INSERT INTO wallets (id, user_id, balance, currency, created_at) VALUES (${uuid()}, ${payment.user_id}, ${amount}, 'NGN', NOW())`;
        }
        await sql`INSERT INTO wallet_transactions (id, wallet_id, type, amount, reference, description, created_at)
          SELECT ${uuid()}, id, 'CREDIT', ${amount}, ${reference}, 'Paystack payment', NOW() FROM wallets WHERE user_id = ${payment.user_id}`;
      }
    }
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('paystack webhook error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /webhook/flutterwave - Flutterwave webhook handler
gatewayRouter.post('/webhook/flutterwave', async (req, res) => {
  try {
    const hash = crypto.createHmac('sha256', FLW_SECRET).update(JSON.stringify(req.body)).digest('hex');
    if (hash !== req.headers['verif-hash']) {
      return res.status(401).json({ detail: 'Invalid signature' });
    }
    const event = req.body;
    if (event.event === 'charge.completed' && event.data.status === 'successful') {
      const txRef = event.data.tx_ref;
      const amount = event.data.amount;
      await sql`UPDATE payments SET status = 'SUCCESS', provider_reference = ${event.data.id} WHERE reference = ${txRef}`;
    }
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('flutterwave webhook error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /refund - initiate a refund
gatewayRouter.post('/refund', authenticate, async (req, res) => {
  try {
    const { payment_id, amount, reason } = req.body;
    if (!payment_id) return res.status(400).json({ detail: 'Payment ID required' });
    
    const [payment] = await sql`SELECT * FROM payments WHERE id = ${payment_id} LIMIT 1`;
    if (!payment) return res.status(404).json({ detail: 'Payment not found' });
    if (payment.user_id !== req.user!.sub && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ detail: 'Not your payment' });
    }
    
    const refundAmount = amount || payment.amount;
    const refundId = uuid();
    const [transaction] = await sql`SELECT id FROM transactions WHERE payment_id = ${payment_id} LIMIT 1`;
    const transactionId = transaction?.id || payment_id;
    await sql`
      INSERT INTO refunds (id, transaction_id, amount, reason, status, initiated_at)
      VALUES (${refundId}, ${transactionId}, ${refundAmount}, ${reason || 'Customer request'}, 'PROCESSED', NOW())
    `;
    
    const [wallet] = await sql`SELECT id FROM wallets WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (wallet) {
      await sql`UPDATE wallets SET balance = balance + ${refundAmount}, last_updated_at = NOW() WHERE user_id = ${req.user!.sub}`;
    } else {
      await sql`INSERT INTO wallets (id, user_id, balance, currency, created_at) VALUES (${uuid()}, ${req.user!.sub}, ${refundAmount}, 'NGN', NOW())`;
    }
    
    await sql`UPDATE payments SET status = 'REFUNDED' WHERE id = ${payment_id}`;
    return res.json({ status: 'ok', refund_id: refundId });
  } catch (err) {
    console.error('refund error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});
