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
