import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/index.js';
import { authenticate, requireRole } from '../auth/index.js';

export const riderRouter = Router();

riderRouter.get('/profile', authenticate, async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM riders WHERE user_id = ${req.user!.sub} LIMIT 1`;
    return res.json(rows[0] || null);
  } catch (err) {
    console.error('rider profile error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

riderRouter.get('/earnings', authenticate, async (req, res) => {
  try {
    const period = (req.query.period as string) || 'WEEK';
    let days: number;
    switch (period) {
      case 'MONTH': days = 30; break;
      case 'YEAR': days = 365; break;
      default: days = 7;
    }
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const [rider] = await sql`SELECT id FROM riders WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (!rider) return res.json({ total_earnings: 0, total_rides: 0, avg_rating: 0 });
    const rows = await sql`
      SELECT COALESCE(SUM(fare_amount), 0) as total_earnings, COUNT(*) as total_rides, COALESCE(AVG(rating_by_user), 0) as avg_rating
      FROM rides WHERE rider_id = ${rider.id} AND status = 'COMPLETED' AND completed_at > ${since}
    `;
    return res.json(rows[0] || { total_earnings: 0, total_rides: 0, avg_rating: 0 });
  } catch (err) {
    console.error('rider earnings error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

riderRouter.get('/bank-account', authenticate, async (req, res) => {
  try {
    const rows = await sql`
      SELECT bank_account_name, bank_account_number, bank_name, bank_code FROM riders WHERE user_id = ${req.user!.sub} LIMIT 1
    `;
    return res.json(rows[0] || null);
  } catch (err) {
    console.error('bank account error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

riderRouter.post('/bank-account', authenticate, async (req, res) => {
  try {
    const { bank_account_number, bank_name } = req.body;
    if (!bank_account_number || !bank_name) {
      return res.status(400).json({ detail: 'Bank account number and bank name are required' });
    }
    await sql`
      UPDATE riders SET bank_account_number = ${bank_account_number}, bank_name = ${bank_name} WHERE user_id = ${req.user!.sub}
    `;
    const rows = await sql`
      SELECT bank_account_name, bank_account_number, bank_name, bank_code FROM riders WHERE user_id = ${req.user!.sub} LIMIT 1
    `;
    return res.json({ ...rows[0], verified: true });
  } catch (err) {
    console.error('save bank account error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

riderRouter.get('/available-rides', authenticate, requireRole('RIDER'), async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    const rows = await sql`
      SELECT r.*, u.first_name, u.last_name, u.phone
      FROM rides r JOIN users u ON u.id = r.user_id
      WHERE r.status = 'REQUESTED'
      ORDER BY r.created_at DESC LIMIT 20
    `;
    return res.json(rows);
  } catch (err) {
    console.error('available rides error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

riderRouter.get('/active-rides', authenticate, requireRole('RIDER'), async (req, res) => {
  try {
    const [rider] = await sql`SELECT id FROM riders WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (!rider) return res.json([]);
    const rows = await sql`
      SELECT r.*, u.first_name, u.last_name, u.phone
      FROM rides r JOIN users u ON u.id = r.user_id
      WHERE r.rider_id = ${rider.id} AND r.status IN ('ACCEPTED', 'RIDER_ARRIVING', 'RIDER_ARRIVED', 'IN_PROGRESS')
      ORDER BY r.created_at DESC
    `;
    return res.json(rows);
  } catch (err) {
    console.error('active rides error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

riderRouter.post('/accept-ride/:id', authenticate, requireRole('RIDER'), async (req, res) => {
  try {
    const [rider] = await sql`SELECT id FROM riders WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (!rider) return res.status(400).json({ detail: 'Rider profile not found' });
    const [ride] = await sql`SELECT id, status FROM rides WHERE id = ${req.params.id} LIMIT 1`;
    if (!ride) return res.status(404).json({ detail: 'Ride not found' });
    if (ride.status !== 'REQUESTED') return res.status(400).json({ detail: 'Ride is no longer available' });
    await sql`
      UPDATE rides SET rider_id = ${rider.id}, status = 'ACCEPTED', accepted_at = NOW(), updated_at = NOW() WHERE id = ${req.params.id}
    `;
    const [updated] = await sql`SELECT * FROM rides WHERE id = ${req.params.id} LIMIT 1`;
    return res.json(updated);
  } catch (err) {
    console.error('accept ride error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

riderRouter.post('/start-ride/:id', authenticate, requireRole('RIDER'), async (req, res) => {
  try {
    const [rider] = await sql`SELECT id FROM riders WHERE user_id = ${req.user!.sub} LIMIT 1`;
    const [ride] = await sql`SELECT id, status FROM rides WHERE id = ${req.params.id} AND rider_id = ${rider?.id} LIMIT 1`;
    if (!ride) return res.status(404).json({ detail: 'Ride not found or not assigned to you' });
    if (!['ACCEPTED', 'RIDER_ARRIVING', 'RIDER_ARRIVED'].includes(ride.status)) {
      return res.status(400).json({ detail: `Cannot start ride with status ${ride.status}` });
    }
    await sql`UPDATE rides SET status = 'IN_PROGRESS', started_at = NOW(), updated_at = NOW() WHERE id = ${req.params.id}`;
    const [updated] = await sql`SELECT * FROM rides WHERE id = ${req.params.id} LIMIT 1`;
    return res.json(updated);
  } catch (err) {
    console.error('start ride error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

riderRouter.post('/complete-ride/:id', authenticate, requireRole('RIDER'), async (req, res) => {
  try {
    const { fare_amount, distance_km, duration_minutes } = req.body;
    const [rider] = await sql`SELECT id FROM riders WHERE user_id = ${req.user!.sub} LIMIT 1`;
    const [ride] = await sql`SELECT id, status FROM rides WHERE id = ${req.params.id} AND rider_id = ${rider?.id} LIMIT 1`;
    if (!ride) return res.status(404).json({ detail: 'Ride not found or not assigned to you' });
    if (ride.status !== 'IN_PROGRESS') return res.status(400).json({ detail: 'Ride is not in progress' });
    await sql`
      UPDATE rides SET status = 'COMPLETED', fare_amount = ${fare_amount || 0}, distance_km = ${distance_km || 0}, duration_minutes = ${duration_minutes || null}, completed_at = NOW(), updated_at = NOW() WHERE id = ${req.params.id}
    `;
    const [updated] = await sql`SELECT * FROM rides WHERE id = ${req.params.id} LIMIT 1`;
    return res.json(updated);
  } catch (err) {
    console.error('complete ride error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

riderRouter.post('/cancel-ride/:id', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    const [rider] = await sql`SELECT id FROM riders WHERE user_id = ${req.user!.sub} LIMIT 1`;
    const [ride] = await sql`
      SELECT id, status FROM rides WHERE id = ${req.params.id} AND (user_id = ${req.user!.sub} OR rider_id = ${rider?.id}) LIMIT 1
    `;
    if (!ride) return res.status(404).json({ detail: 'Ride not found' });
    if (['COMPLETED', 'CANCELLED'].includes(ride.status)) return res.status(400).json({ detail: 'Ride already finished' });
    await sql`
      UPDATE rides SET status = 'CANCELLED', cancelled_at = NOW(), updated_at = NOW(), ride_notes = ${reason || null} WHERE id = ${req.params.id}
    `;
    const [updated] = await sql`SELECT * FROM rides WHERE id = ${req.params.id} LIMIT 1`;
    return res.json(updated);
  } catch (err) {
    console.error('cancel ride error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

riderRouter.get('/deliveries', authenticate, async (req, res) => {
  try {
    const [rider] = await sql`SELECT id FROM riders WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (!rider) return res.json([]);
    const { status } = req.query;
    let query = sql`SELECT * FROM deliveries WHERE rider_id = ${rider.id}`;
    if (status) query = sql`${query} AND status = ${status}`;
    query = sql`${query} ORDER BY created_at DESC`;
    const rows = await query;
    return res.json(rows);
  } catch (err) {
    console.error('rider deliveries error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});
