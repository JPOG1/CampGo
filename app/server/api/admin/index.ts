import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../../db/index.js';
import { authenticate, requireRole } from '../../auth/index.js';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole('ADMIN'));

adminRouter.get('/dashboard', async (_req, res) => {
  try {
    const [users, riders, active, completed, revenue] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM users`,
      sql`SELECT COUNT(*) as count FROM users WHERE role = 'RIDER'`,
      sql`SELECT COUNT(*) as count FROM rides WHERE status IN ('REQUESTED','ACCEPTED','RIDER_ARRIVING','RIDER_ARRIVED','IN_PROGRESS')`,
      sql`SELECT COUNT(*) as count FROM rides WHERE status = 'COMPLETED'`,
      sql`SELECT COALESCE(SUM(fare_amount), 0) as total FROM rides WHERE status = 'COMPLETED'`,
    ]);
    return res.json({
      total_users: Number(users[0].count),
      total_riders: Number(riders[0].count),
      active_rides: Number(active[0].count),
      completed_rides: Number(completed[0].count),
      total_revenue: Number(revenue[0].total),
      avg_rating: 0,
    });
  } catch (err) {
    console.error('admin dashboard error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.get('/metrics', async (_req, res) => {
  try {
    const [users, riders, active, completed, revenue] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM users`,
      sql`SELECT COUNT(*) as count FROM users WHERE role = 'RIDER'`,
      sql`SELECT COUNT(*) as count FROM rides WHERE status IN ('REQUESTED','ACCEPTED','RIDER_ARRIVING','RIDER_ARRIVED','IN_PROGRESS')`,
      sql`SELECT COUNT(*) as count FROM rides WHERE status = 'COMPLETED'`,
      sql`SELECT COALESCE(SUM(fare_amount), 0) as total FROM rides WHERE status = 'COMPLETED'`,
    ]);
    return res.json({
      total_users: Number(users[0].count),
      total_riders: Number(riders[0].count),
      active_rides: Number(active[0].count),
      completed_rides: Number(completed[0].count),
      total_revenue: Number(revenue[0].total),
      avg_rating: 0,
    });
  } catch (err) {
    console.error('admin metrics error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const rows = await sql`SELECT id, phone, email, first_name, last_name, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    return res.json(rows);
  } catch (err) {
    console.error('admin users error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.get('/rides', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const rows = await sql`SELECT id, user_id, rider_id, status, pickup_address, dropoff_address, fare_amount, distance_km, payment_method, rating_by_user, created_at FROM rides ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    return res.json(rows);
  } catch (err) {
    console.error('admin rides error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.get('/payments', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const rows = await sql`SELECT * FROM payments ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    return res.json(rows);
  } catch (err) {
    console.error('admin payments error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.get('/analytics', async (_req, res) => {
  try {
    const [totalRevenue, totalRides, totalUsers] = await Promise.all([
      sql`SELECT COALESCE(SUM(fare_amount), 0) as total FROM rides WHERE status = 'COMPLETED'`,
      sql`SELECT COUNT(*) as count FROM rides`,
      sql`SELECT COUNT(*) as count FROM users`,
    ]);
    return res.json({
      total_revenue: Number(totalRevenue[0].total),
      total_rides: Number(totalRides[0].count),
      total_users: Number(totalUsers[0].count),
      growth_rate: 0,
    });
  } catch (err) {
    console.error('admin analytics error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.get('/reports', async (_req, res) => {
  try {
    return res.json([]);
  } catch (err) {
    console.error('admin reports error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.post('/reports/generate', async (_req, res) => {
  try {
    return res.json({ status: 'success', message: 'Report generation started' });
  } catch (err) {
    console.error('admin generate report error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.post('/reports/export', async (_req, res) => {
  try {
    return res.json({ status: 'success', message: 'Export started' });
  } catch (err) {
    console.error('admin export error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.get('/fraud/alerts', async (_req, res) => {
  try {
    const rows = await sql`SELECT * FROM fraud_alerts ORDER BY created_at DESC LIMIT 50`;
    return res.json(rows);
  } catch (err) {
    console.error('admin fraud alerts error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.patch('/fraud/alerts/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const resolvedAt = status === 'RESOLVED' || status === 'FALSE_ALARM' ? new Date().toISOString() : null;
    await sql`UPDATE fraud_alerts SET status = ${status}, resolved_at = ${resolvedAt} WHERE id = ${req.params.id}`;
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('admin update fraud alert error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.get('/settings', async (_req, res) => {
  try {
    const rows = await sql`SELECT * FROM region_settings LIMIT 1`;
    return res.json(rows[0] || null);
  } catch (err) {
    console.error('admin settings error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.put('/settings', async (req, res) => {
  try {
    const { region, currency, timezone, min_fare, per_km_rate, per_minute_rate, delivery_base_fee, delivery_per_km, commission_percentage, is_active } = req.body;
    const [existing] = await sql`SELECT id FROM region_settings LIMIT 1`;
    if (existing) {
      const updates: string[] = [];
      const values: any[] = [];
      if (region !== undefined) { updates.push('region'); values.push(region); }
      if (currency !== undefined) { updates.push('currency'); values.push(currency); }
      if (timezone !== undefined) { updates.push('timezone'); values.push(timezone); }
      if (min_fare !== undefined) { updates.push('min_fare'); values.push(min_fare); }
      if (per_km_rate !== undefined) { updates.push('per_km_rate'); values.push(per_km_rate); }
      if (per_minute_rate !== undefined) { updates.push('per_minute_rate'); values.push(per_minute_rate); }
      if (delivery_base_fee !== undefined) { updates.push('delivery_base_fee'); values.push(delivery_base_fee); }
      if (delivery_per_km !== undefined) { updates.push('delivery_per_km'); values.push(delivery_per_km); }
      if (commission_percentage !== undefined) { updates.push('commission_percentage'); values.push(commission_percentage); }
      if (is_active !== undefined) { updates.push('is_active'); values.push(is_active); }
      updates.push('updated_at'); values.push(new Date());
      const setClause = updates.map((c, i) => `${c} = $${i + 1}`).join(', ');
      await sql.unsafe(`UPDATE region_settings SET ${setClause} WHERE id = $${updates.length + 1}`, [...values, existing.id]);
    } else {
      await sql`
        INSERT INTO region_settings (id, region, currency, timezone, min_fare, per_km_rate, per_minute_rate, delivery_base_fee, delivery_per_km, commission_percentage, is_active, created_at)
        VALUES (${uuid()}, ${region || 'Lagos'}, ${currency || 'NGN'}, ${timezone || 'Africa/Lagos'}, ${min_fare || 500}, ${per_km_rate || 200}, ${per_minute_rate || 50}, ${delivery_base_fee || 300}, ${delivery_per_km || 150}, ${commission_percentage || 15}, ${is_active ?? true}, NOW())
      `;
    }
    const [row] = await sql`SELECT * FROM region_settings LIMIT 1`;
    return res.json(row);
  } catch (err) {
    console.error('admin save settings error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.get('/analytics/revenue', async (_req, res) => {
  try {
    const daily = await sql`
      SELECT DATE(created_at) as date, COALESCE(SUM(fare_amount), 0) as revenue, COUNT(*) as rides
      FROM rides WHERE status = 'COMPLETED' AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at) ORDER BY date DESC
    `;
    const revenue = await sql`SELECT COALESCE(SUM(fare_amount), 0) as total FROM rides WHERE status = 'COMPLETED'`;
    const foodRevenue = await sql`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'DELIVERED'`;
    return res.json({
      total_revenue: Number(revenue[0].total) + Number(foodRevenue[0].total),
      ride_revenue: Number(revenue[0].total),
      food_revenue: Number(foodRevenue[0].total),
      daily_breakdown: daily,
    });
  } catch (err) {
    console.error('admin revenue analytics error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.get('/analytics/users', async (_req, res) => {
  try {
    const total = await sql`SELECT COUNT(*) as count FROM users`;
    const byRole = await sql`SELECT role, COUNT(*) as count FROM users GROUP BY role`;
    const daily = await sql`
      SELECT DATE(created_at) as date, COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at) ORDER BY date DESC
    `;
    return res.json({ total_users: Number(total[0].count), by_role: byRole, daily_signups: daily });
  } catch (err) {
    console.error('admin user analytics error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.get('/analytics/rides', async (_req, res) => {
  try {
    const byStatus = await sql`SELECT status, COUNT(*) as count FROM rides GROUP BY status`;
    const daily = await sql`
      SELECT DATE(created_at) as date, COUNT(*) as count FROM rides WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at) ORDER BY date DESC
    `;
    return res.json({ by_status: byStatus, daily_rides: daily });
  } catch (err) {
    console.error('admin ride analytics error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.get('/food/orders', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const rows = await sql`
      SELECT o.*, u.first_name, u.last_name, r.name as restaurant_name
      FROM orders o JOIN users u ON u.id = o.user_id JOIN restaurants r ON r.id = o.restaurant_id
      ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
    return res.json(rows);
  } catch (err) {
    console.error('admin food orders error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.get('/food/analytics', async (_req, res) => {
  try {
    const total = await sql`SELECT COUNT(*) as count FROM orders`;
    const revenue = await sql`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'DELIVERED'`;
    const byStatus = await sql`SELECT status, COUNT(*) as count FROM orders GROUP BY status`;
    return res.json({ total_orders: Number(total[0].count), total_revenue: Number(revenue[0].total), by_status: byStatus });
  } catch (err) {
    console.error('admin food analytics error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

adminRouter.put('/users/:id/status', async (req, res) => {
  try {
    const { is_active, account_status, suspend_reason } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    if (is_active !== undefined) { updates.push('is_active'); values.push(is_active); }
    if (account_status !== undefined) { updates.push('account_status'); values.push(account_status); }
    if (suspend_reason !== undefined) { updates.push('suspend_reason'); values.push(suspend_reason); }
    if (account_status === 'SUSPENDED') { updates.push('suspended_at'); values.push(new Date()); }
    updates.push('updated_at'); values.push(new Date());
    const setClause = updates.map((c, i) => `${c} = $${i + 1}`).join(', ');
    await sql.unsafe(`UPDATE users SET ${setClause} WHERE id = $${updates.length + 1}`, [...values, req.params.id]);
    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('admin update user status error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});
