import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/index.js';
import { authenticate } from '../auth/index.js';

export const foodExtraRouter = Router();

// GET /recommendations - personalized food recommendations
foodExtraRouter.get('/recommendations', authenticate, async (req, res) => {
  try {
    const userOrders = await sql`
      SELECT DISTINCT r.id, r.cuisine_type FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      WHERE o.user_id = ${req.user!.sub}
    `;
    const cuisineTypes = [...new Set(userOrders.map((r: any) => r.cuisine_type).filter(Boolean))];
    if (cuisineTypes.length > 0) {
      const rows = await sql`
        SELECT * FROM restaurants WHERE is_active = true AND status = 'ACTIVE'
        AND (cuisine_type = ANY(${cuisineTypes}) OR rating >= 4.0)
        ORDER BY rating DESC, total_orders DESC LIMIT 10
      `;
      return res.json(rows);
    }
    const rows = await sql`
      SELECT * FROM restaurants WHERE is_active = true AND status = 'ACTIVE'
      ORDER BY rating DESC, total_orders DESC LIMIT 10
    `;
    return res.json(rows);
  } catch (err) {
    console.error('recommendations error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /popular - popular items
foodExtraRouter.get('/popular', async (_req, res) => {
  try {
    const rows = await sql`
      SELECT mi.*, r.name as restaurant_name, r.cuisine_type
      FROM menu_items mi JOIN restaurants r ON r.id = mi.restaurant_id
      WHERE mi.is_available = true AND mi.is_popular = true AND r.is_active = true
      ORDER BY mi.sort_order ASC LIMIT 20
    `;
    return res.json(rows);
  } catch (err) {
    console.error('popular items error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /reviews - add a review for food/restaurant
foodExtraRouter.post('/reviews', authenticate, async (req, res) => {
  try {
    const id = uuid();
    const { restaurant_id, order_id, rating, review } = req.body;
    if (!restaurant_id || !rating) {
      return res.status(400).json({ detail: 'Restaurant ID and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ detail: 'Rating must be between 1 and 5' });
    }
    const [existing] = await sql`
      SELECT id FROM reviews WHERE from_user_id = ${req.user!.sub} AND restaurant_id = ${restaurant_id} AND order_id = ${order_id || null} LIMIT 1
    `;
    if (existing) {
      await sql`UPDATE reviews SET rating = ${rating}, review_text = ${review}, updated_at = NOW() WHERE id = ${existing.id}`;
      const [row] = await sql`SELECT * FROM reviews WHERE id = ${existing.id} LIMIT 1`;
      return res.json(row);
    }
    await sql`
      INSERT INTO reviews (id, from_user_id, restaurant_id, order_id, rating, review_text, created_at)
      VALUES (${id}, ${req.user!.sub}, ${restaurant_id}, ${order_id || null}, ${rating}, ${review || null}, NOW())
    `;
    await sql`
      UPDATE restaurants SET rating = (SELECT COALESCE(AVG(rating::numeric), 0) FROM reviews WHERE restaurant_id = ${restaurant_id}) WHERE id = ${restaurant_id}
    `;
    const [row] = await sql`SELECT * FROM reviews WHERE id = ${id} LIMIT 1`;
    return res.status(201).json(row);
  } catch (err) {
    console.error('create review error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /reviews/:restaurantId - get reviews for restaurant
foodExtraRouter.get('/reviews/:restaurantId', async (req, res) => {
  try {
    const rows = await sql`
      SELECT r.*, u.first_name, u.last_name FROM reviews r
      JOIN users u ON u.id = r.from_user_id
      WHERE r.restaurant_id = ${req.params.restaurantId}
      ORDER BY r.created_at DESC LIMIT 50
    `;
    return res.json(rows);
  } catch (err) {
    console.error('list reviews error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /search - unified food search with filters
foodExtraRouter.get('/search', async (req, res) => {
  try {
    const { q, cuisine, min_price, max_price, sort_by, sort_order } = req.query;
    let query = sql`SELECT r.* FROM restaurants r WHERE r.is_active = true AND r.status = 'ACTIVE'`;
    if (q) query = sql`${query} AND (r.name ILIKE ${'%' + q + '%'} OR r.description ILIKE ${'%' + q + '%'} OR r.cuisine_type ILIKE ${'%' + q + '%'})`;
    if (cuisine) query = sql`${query} AND r.cuisine_type = ${cuisine}`;
    if (min_price) query = sql`${query} AND r.delivery_fee >= ${min_price}`;
    if (max_price) query = sql`${query} AND r.delivery_fee <= ${max_price}`;
    let orderClause = 'r.rating DESC';
    if (sort_by === 'name') orderClause = `r.name ${sort_order === 'asc' ? 'ASC' : 'DESC'}`;
    else if (sort_by === 'price') orderClause = `r.delivery_fee ${sort_order === 'asc' ? 'ASC' : 'DESC'}`;
    else if (sort_by === 'rating') orderClause = 'r.rating DESC';
    else if (sort_by === 'orders') orderClause = 'r.total_orders DESC';
    query = sql`${query} ORDER BY ${sql.unsafe(orderClause)} LIMIT 30`;
    const rows = await query;
    return res.json(rows);
  } catch (err) {
    console.error('food search error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /deals - current promotions/deals
foodExtraRouter.get('/deals', async (_req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM promo_codes WHERE is_active = true AND (valid_until IS NULL OR valid_until > NOW())
      ORDER BY discount_value DESC LIMIT 10
    `;
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// Vendor dashboard stats
foodExtraRouter.get('/vendor/dashboard', authenticate, async (req, res) => {
  try {
    const [vendor] = await sql`SELECT id FROM vendors WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (!vendor) return res.status(404).json({ detail: 'Vendor profile not found' });
    const [restaurant] = await sql`SELECT id FROM restaurants WHERE vendor_id = ${vendor.id} LIMIT 1`;
    if (!restaurant) return res.json({ total_orders: 0, active_orders: 0, revenue: 0, rating: 0 });
    const [stats] = await sql`
      SELECT
        COUNT(*)::int as total_orders,
        COUNT(*) FILTER (WHERE status IN ('PENDING','CONFIRMED','PREPARING','READY_FOR_PICKUP'))::int as active_orders,
        COALESCE(SUM(total_amount), 0) as revenue,
        COALESCE(AVG(r.rating::numeric), 0) as rating
      FROM orders o LEFT JOIN reviews r ON r.restaurant_id = o.restaurant_id
      WHERE o.restaurant_id = ${restaurant.id}
    `;
    return res.json(stats);
  } catch (err) {
    console.error('vendor dashboard error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// Vendor get their restaurant
foodExtraRouter.get('/vendor/restaurant', authenticate, async (req, res) => {
  try {
    const [vendor] = await sql`SELECT id FROM vendors WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (!vendor) return res.status(404).json({ detail: 'Vendor profile not found' });
    const [restaurant] = await sql`SELECT * FROM restaurants WHERE vendor_id = ${vendor.id} LIMIT 1`;
    return res.json(restaurant || null);
  } catch (err) {
    console.error('vendor restaurant error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// Vendor list menu items
foodExtraRouter.get('/vendor/menu', authenticate, async (req, res) => {
  try {
    const [vendor] = await sql`SELECT id FROM vendors WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (!vendor) return res.status(404).json({ detail: 'Vendor profile not found' });
    const [restaurant] = await sql`SELECT id FROM restaurants WHERE vendor_id = ${vendor.id} LIMIT 1`;
    if (!restaurant) return res.json([]);
    const items = await sql`SELECT * FROM menu_items WHERE restaurant_id = ${restaurant.id} ORDER BY sort_order ASC, category ASC, name ASC`;
    return res.json(items);
  } catch (err) {
    console.error('vendor menu error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// Vendor create menu item
foodExtraRouter.post('/vendor/menu', authenticate, async (req, res) => {
  try {
    const [vendor] = await sql`SELECT id FROM vendors WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (!vendor) return res.status(404).json({ detail: 'Vendor profile not found' });
    const [restaurant] = await sql`SELECT id FROM restaurants WHERE vendor_id = ${vendor.id} LIMIT 1`;
    if (!restaurant) return res.status(400).json({ detail: 'Create your restaurant first' });
    const id = uuid();
    const { name, description, price, category, image, is_available } = req.body;
    await sql`
      INSERT INTO menu_items (id, restaurant_id, name, description, price, category, image, is_available, created_at)
      VALUES (${id}, ${restaurant.id}, ${name}, ${description}, ${price}, ${category || 'Main'}, ${image}, ${is_available ?? true}, NOW())
    `;
    const [row] = await sql`SELECT * FROM menu_items WHERE id = ${id} LIMIT 1`;
    return res.status(201).json(row);
  } catch (err) {
    console.error('vendor create menu error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// Vendor update menu item
foodExtraRouter.patch('/vendor/menu/:id', authenticate, async (req, res) => {
  try {
    const [vendor] = await sql`SELECT id FROM vendors WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (!vendor) return res.status(404).json({ detail: 'Vendor profile not found' });
    const [item] = await sql`
      SELECT mi.* FROM menu_items mi JOIN restaurants r ON r.id = mi.restaurant_id
      WHERE mi.id = ${req.params.id} AND r.vendor_id = ${vendor.id} LIMIT 1
    `;
    if (!item) return res.status(404).json({ detail: 'Menu item not found' });
    const { name, description, price, category, image, is_available } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    if (name !== undefined) { updates.push('name'); values.push(name); }
    if (description !== undefined) { updates.push('description'); values.push(description); }
    if (price !== undefined) { updates.push('price'); values.push(price); }
    if (category !== undefined) { updates.push('category'); values.push(category); }
    if (image !== undefined) { updates.push('image'); values.push(image); }
    if (is_available !== undefined) { updates.push('is_available'); values.push(is_available); }
    if (updates.length === 0) return res.json(item);
    updates.push('updated_at'); values.push(new Date());
    const setClause = updates.map((c, i) => `${c} = $${i + 1}`).join(', ');
    await sql.unsafe(`UPDATE menu_items SET ${setClause} WHERE id = $${updates.length + 1}`, [...values, req.params.id]);
    const [row] = await sql`SELECT * FROM menu_items WHERE id = ${req.params.id} LIMIT 1`;
    return res.json(row);
  } catch (err) {
    console.error('vendor update menu error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// Vendor list orders
foodExtraRouter.get('/vendor/orders', authenticate, async (req, res) => {
  try {
    const [vendor] = await sql`SELECT id FROM vendors WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (!vendor) return res.status(404).json({ detail: 'Vendor profile not found' });
    const [restaurant] = await sql`SELECT id FROM restaurants WHERE vendor_id = ${vendor.id} LIMIT 1`;
    if (!restaurant) return res.json([]);
    const orders = await sql`
      SELECT o.*, u.first_name || ' ' || u.last_name as customer_name
      FROM orders o JOIN users u ON u.id = o.user_id
      WHERE o.restaurant_id = ${restaurant.id}
      ORDER BY o.created_at DESC LIMIT 50
    `;
    const orderIds = orders.map((o: any) => o.id);
    const allItems = orderIds.length > 0
      ? await sql`SELECT * FROM order_items WHERE order_id = ANY(${orderIds}) ORDER BY created_at ASC`
      : [];
    const itemsByOrder = new Map();
    for (const item of allItems) {
      const list = itemsByOrder.get(item.order_id) || [];
      list.push(item);
      itemsByOrder.set(item.order_id, list);
    }
    const result = orders.map((o: any) => ({ ...o, items: itemsByOrder.get(o.id) || [] }));
    return res.json(result);
  } catch (err) {
    console.error('vendor orders error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// Vendor update order status
foodExtraRouter.patch('/vendor/orders/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ detail: 'Status is required' });
    const [vendor] = await sql`SELECT id FROM vendors WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (!vendor) return res.status(404).json({ detail: 'Vendor profile not found' });
    const [order] = await sql`
      SELECT o.* FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
      WHERE o.id = ${req.params.id} AND r.vendor_id = ${vendor.id} LIMIT 1
    `;
    if (!order) return res.status(404).json({ detail: 'Order not found' });
    const timestampFields: Record<string, string> = {
      CONFIRMED: 'accepted_at',
      PREPARING: 'prepared_at',
      READY_FOR_PICKUP: 'prepared_at',
      CANCELLED: 'cancelled_at',
    };
    const tsField = timestampFields[status];
    const tsClause = tsField ? `, ${tsField} = NOW()` : '';
    await sql.unsafe(`UPDATE orders SET status = $1, updated_at = NOW()${tsClause} WHERE id = $2`, [status, req.params.id]);
    await sql`INSERT INTO order_status_history (id, order_id, status, notes, created_by, created_at) VALUES (${uuid()}, ${req.params.id}, ${status}, ${'Updated by vendor'}, ${req.user!.sub}, NOW())`;
    const [updated] = await sql`SELECT * FROM orders WHERE id = ${req.params.id} LIMIT 1`;
    const [customer] = await sql`SELECT first_name, last_name FROM users WHERE id = ${updated.user_id} LIMIT 1`;
    return res.json({ ...updated, customer_name: customer ? customer.first_name + ' ' + customer.last_name : 'Unknown' });
  } catch (err) {
    console.error('vendor update order error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});
