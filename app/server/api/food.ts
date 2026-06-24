import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/index.js';
import { authenticate, requireRole } from '../auth/index.js';

export const foodRouter = Router();

foodRouter.get('/restaurants', async (req, res) => {
  try {
    const { cuisine, search, lat, lng, radius } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const offset = (page - 1) * limit;
    let query = sql`SELECT * FROM restaurants WHERE is_active = true AND status = 'ACTIVE'`;
    if (cuisine) query = sql`${query} AND cuisine_type = ${cuisine}`;
    if (search) query = sql`${query} AND (name ILIKE ${'%' + search + '%'} OR description ILIKE ${'%' + search + '%'})`;
    query = sql`${query} ORDER BY rating DESC, total_orders DESC LIMIT ${limit} OFFSET ${offset}`;
    const rows = await query;
    return res.json(rows);
  } catch (err) {
    console.error('list restaurants error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

foodRouter.get('/restaurants/:id', async (req, res) => {
  try {
    const [restaurant] = await sql`SELECT * FROM restaurants WHERE id = ${req.params.id} LIMIT 1`;
    if (!restaurant) return res.status(404).json({ detail: 'Restaurant not found' });
    const menu = await sql`SELECT * FROM menu_items WHERE restaurant_id = ${req.params.id} AND is_available = true ORDER BY sort_order ASC, category ASC, name ASC`;
    return res.json({ ...restaurant, menu });
  } catch (err) {
    console.error('get restaurant error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

foodRouter.post('/restaurants', authenticate, requireRole('VENDOR'), async (req, res) => {
  try {
    const id = uuid();
    const { name, description, cuisine_type, address, latitude, longitude, cover_image, opening_hours, estimated_delivery_time, delivery_fee, min_order_amount } = req.body;
    const [vendor] = await sql`SELECT id FROM vendors WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (!vendor) return res.status(400).json({ detail: 'Vendor profile not found. Register as a vendor first.' });
    const coords = latitude && longitude ? `(${longitude},${latitude})` : null;
    await sql`
      INSERT INTO restaurants (id, vendor_id, name, description, cuisine_type, address, coordinates, cover_image, opening_hours, estimated_delivery_time, delivery_fee, min_order_amount, created_at)
      VALUES (${id}, ${vendor.id}, ${name}, ${description}, ${cuisine_type}, ${address}, ${coords}, ${cover_image}, ${opening_hours ? JSON.stringify(opening_hours) : null}, ${estimated_delivery_time}, ${delivery_fee}, ${min_order_amount}, NOW())
    `;
    const [row] = await sql`SELECT * FROM restaurants WHERE id = ${id} LIMIT 1`;
    return res.status(201).json(row);
  } catch (err) {
    console.error('create restaurant error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

foodRouter.put('/restaurants/:id', authenticate, requireRole('VENDOR'), async (req, res) => {
  try {
    const [restaurant] = await sql`SELECT id, vendor_id FROM restaurants WHERE id = ${req.params.id} LIMIT 1`;
    if (!restaurant) return res.status(404).json({ detail: 'Restaurant not found' });
    const [vendor] = await sql`SELECT id FROM vendors WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (restaurant.vendor_id !== vendor?.id) return res.status(403).json({ detail: 'Not your restaurant' });
    const { name, description, cuisine_type, address, latitude, longitude, cover_image, opening_hours, is_active, status, estimated_delivery_time, delivery_fee, min_order_amount } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    if (name !== undefined) { updates.push('name'); values.push(name); }
    if (description !== undefined) { updates.push('description'); values.push(description); }
    if (cuisine_type !== undefined) { updates.push('cuisine_type'); values.push(cuisine_type); }
    if (address !== undefined) { updates.push('address'); values.push(address); }
    if (latitude && longitude) { updates.push('coordinates'); values.push(`(${longitude},${latitude})`); }
    if (cover_image !== undefined) { updates.push('cover_image'); values.push(cover_image); }
    if (opening_hours !== undefined) { updates.push('opening_hours'); values.push(JSON.stringify(opening_hours)); }
    if (is_active !== undefined) { updates.push('is_active'); values.push(is_active); }
    if (status !== undefined) { updates.push('status'); values.push(status); }
    if (estimated_delivery_time !== undefined) { updates.push('estimated_delivery_time'); values.push(estimated_delivery_time); }
    if (delivery_fee !== undefined) { updates.push('delivery_fee'); values.push(delivery_fee); }
    if (min_order_amount !== undefined) { updates.push('min_order_amount'); values.push(min_order_amount); }
    updates.push('updated_at'); values.push(new Date());
    const setClause = updates.map((c, i) => `${c} = $${i + 1}`).join(', ');
    await sql.unsafe(`UPDATE restaurants SET ${setClause} WHERE id = $${updates.length + 1}`, [...values, req.params.id]);
    const [row] = await sql`SELECT * FROM restaurants WHERE id = ${req.params.id} LIMIT 1`;
    return res.json(row);
  } catch (err) {
    console.error('update restaurant error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

foodRouter.post('/restaurants/:id/menu', authenticate, requireRole('VENDOR'), async (req, res) => {
  try {
    const [restaurant] = await sql`SELECT id, vendor_id FROM restaurants WHERE id = ${req.params.id} LIMIT 1`;
    if (!restaurant) return res.status(404).json({ detail: 'Restaurant not found' });
    const [vendor] = await sql`SELECT id FROM vendors WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (restaurant.vendor_id !== vendor?.id) return res.status(403).json({ detail: 'Not your restaurant' });
    const id = uuid();
    const { name, description, price, currency, image, category, is_available, is_popular, preparation_time, sort_order } = req.body;
    await sql`
      INSERT INTO menu_items (id, restaurant_id, name, description, price, currency, image, category, is_available, is_popular, preparation_time, sort_order, created_at)
      VALUES (${id}, ${req.params.id}, ${name}, ${description}, ${price}, ${currency || 'NGN'}, ${image}, ${category}, ${is_available ?? true}, ${is_popular ?? false}, ${preparation_time}, ${sort_order ?? 0}, NOW())
    `;
    const [row] = await sql`SELECT * FROM menu_items WHERE id = ${id} LIMIT 1`;
    return res.status(201).json(row);
  } catch (err) {
    console.error('create menu item error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

foodRouter.put('/menu/:id', authenticate, requireRole('VENDOR'), async (req, res) => {
  try {
    const [item] = await sql`
      SELECT mi.*, r.vendor_id FROM menu_items mi JOIN restaurants r ON r.id = mi.restaurant_id WHERE mi.id = ${req.params.id} LIMIT 1
    `;
    if (!item) return res.status(404).json({ detail: 'Menu item not found' });
    const [vendor] = await sql`SELECT id FROM vendors WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (item.vendor_id !== vendor?.id) return res.status(403).json({ detail: 'Not your restaurant' });
    const { name, description, price, currency, image, category, is_available, is_popular, preparation_time, sort_order } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    if (name !== undefined) { updates.push('name'); values.push(name); }
    if (description !== undefined) { updates.push('description'); values.push(description); }
    if (price !== undefined) { updates.push('price'); values.push(price); }
    if (currency !== undefined) { updates.push('currency'); values.push(currency); }
    if (image !== undefined) { updates.push('image'); values.push(image); }
    if (category !== undefined) { updates.push('category'); values.push(category); }
    if (is_available !== undefined) { updates.push('is_available'); values.push(is_available); }
    if (is_popular !== undefined) { updates.push('is_popular'); values.push(is_popular); }
    if (preparation_time !== undefined) { updates.push('preparation_time'); values.push(preparation_time); }
    if (sort_order !== undefined) { updates.push('sort_order'); values.push(sort_order); }
    updates.push('updated_at'); values.push(new Date());
    const setClause = updates.map((c, i) => `${c} = $${i + 1}`).join(', ');
    await sql.unsafe(`UPDATE menu_items SET ${setClause} WHERE id = $${updates.length + 1}`, [...values, req.params.id]);
    const [row] = await sql`SELECT * FROM menu_items WHERE id = ${req.params.id} LIMIT 1`;
    return res.json(row);
  } catch (err) {
    console.error('update menu item error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

foodRouter.delete('/menu/:id', authenticate, requireRole('VENDOR'), async (req, res) => {
  try {
    const [item] = await sql`
      SELECT mi.*, r.vendor_id FROM menu_items mi JOIN restaurants r ON r.id = mi.restaurant_id WHERE mi.id = ${req.params.id} LIMIT 1
    `;
    if (!item) return res.status(404).json({ detail: 'Menu item not found' });
    const [vendor] = await sql`SELECT id FROM vendors WHERE user_id = ${req.user!.sub} LIMIT 1`;
    if (item.vendor_id !== vendor?.id) return res.status(403).json({ detail: 'Not your restaurant' });
    await sql`DELETE FROM menu_items WHERE id = ${req.params.id}`;
    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('delete menu item error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

foodRouter.get('/cart', authenticate, async (req, res) => {
  try {
    const items = await sql`
      SELECT ci.*, mi.name, mi.image, mi.category, r.name as restaurant_name, r.id as restaurant_id
      FROM cart_items ci
      JOIN menu_items mi ON mi.id = ci.menu_item_id
      JOIN restaurants r ON r.id = ci.restaurant_id
      WHERE ci.user_id = ${req.user!.sub}
      ORDER BY ci.created_at DESC
    `;
    const total = items.reduce((sum: number, i: any) => sum + Number(i.unit_price) * i.quantity, 0);
    return res.json({ items, total });
  } catch (err) {
    console.error('get cart error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

foodRouter.post('/cart', authenticate, async (req, res) => {
  try {
    const { restaurant_id, menu_item_id, quantity, special_instructions } = req.body;
    if (!restaurant_id || !menu_item_id || !quantity) {
      return res.status(400).json({ detail: 'restaurant_id, menu_item_id, and quantity are required' });
    }
    const [menuItem] = await sql`SELECT id, price, restaurant_id FROM menu_items WHERE id = ${menu_item_id} AND is_available = true LIMIT 1`;
    if (!menuItem) return res.status(404).json({ detail: 'Menu item not found or unavailable' });
    if (menuItem.restaurant_id !== restaurant_id) {
      return res.status(400).json({ detail: 'Menu item does not belong to this restaurant' });
    }
    const [existing] = await sql`
      SELECT id, quantity FROM cart_items WHERE user_id = ${req.user!.sub} AND menu_item_id = ${menu_item_id} LIMIT 1
    `;
    if (existing) {
      await sql`UPDATE cart_items SET quantity = ${existing.quantity + quantity}, special_instructions = ${special_instructions || existing.special_instructions} WHERE id = ${existing.id}`;
    } else {
      await sql`
        INSERT INTO cart_items (id, user_id, restaurant_id, menu_item_id, quantity, unit_price, special_instructions, created_at)
        VALUES (${uuid()}, ${req.user!.sub}, ${restaurant_id}, ${menu_item_id}, ${quantity}, ${menuItem.price}, ${special_instructions}, NOW())
      `;
    }
    const items = await sql`
      SELECT ci.*, mi.name, mi.image, mi.category FROM cart_items ci JOIN menu_items mi ON mi.id = ci.menu_item_id WHERE ci.user_id = ${req.user!.sub} ORDER BY ci.created_at DESC
    `;
    const total = items.reduce((sum: number, i: any) => sum + Number(i.unit_price) * i.quantity, 0);
    return res.json({ items, total });
  } catch (err) {
    console.error('add to cart error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

foodRouter.put('/cart/:id', authenticate, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ detail: 'Quantity must be at least 1' });
    }
    const [item] = await sql`SELECT id FROM cart_items WHERE id = ${req.params.id} AND user_id = ${req.user!.sub} LIMIT 1`;
    if (!item) return res.status(404).json({ detail: 'Cart item not found' });
    await sql`UPDATE cart_items SET quantity = ${quantity} WHERE id = ${req.params.id}`;
    const items = await sql`
      SELECT ci.*, mi.name, mi.image, mi.category FROM cart_items ci JOIN menu_items mi ON mi.id = ci.menu_item_id WHERE ci.user_id = ${req.user!.sub} ORDER BY ci.created_at DESC
    `;
    const total = items.reduce((sum: number, i: any) => sum + Number(i.unit_price) * i.quantity, 0);
    return res.json({ items, total });
  } catch (err) {
    console.error('update cart item error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

foodRouter.delete('/cart/:id', authenticate, async (req, res) => {
  try {
    await sql`DELETE FROM cart_items WHERE id = ${req.params.id} AND user_id = ${req.user!.sub}`;
    const items = await sql`
      SELECT ci.*, mi.name, mi.image, mi.category FROM cart_items ci JOIN menu_items mi ON mi.id = ci.menu_item_id WHERE ci.user_id = ${req.user!.sub} ORDER BY ci.created_at DESC
    `;
    const total = items.reduce((sum: number, i: any) => sum + Number(i.unit_price) * i.quantity, 0);
    return res.json({ items, total });
  } catch (err) {
    console.error('delete cart item error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

foodRouter.delete('/cart', authenticate, async (req, res) => {
  try {
    await sql`DELETE FROM cart_items WHERE user_id = ${req.user!.sub}`;
    return res.json({ items: [], total: 0 });
  } catch (err) {
    console.error('clear cart error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

foodRouter.post('/orders', authenticate, async (req, res) => {
  try {
    const cartItems = await sql`
      SELECT ci.*, mi.price, mi.name, r.id as restaurant_id, r.name as restaurant_name
      FROM cart_items ci
      JOIN menu_items mi ON mi.id = ci.menu_item_id
      JOIN restaurants r ON r.id = ci.restaurant_id
      WHERE ci.user_id = ${req.user!.sub}
      ORDER BY ci.created_at DESC
    `;
    if (cartItems.length === 0) return res.status(400).json({ detail: 'Cart is empty' });
    const restaurantId = cartItems[0].restaurant_id;
    if (cartItems.some((i: any) => i.restaurant_id !== restaurantId)) {
      return res.status(400).json({ detail: 'All items must be from the same restaurant' });
    }
    const subtotal = cartItems.reduce((sum: number, i: any) => sum + Number(i.price) * i.quantity, 0);
    const [restaurant] = await sql`SELECT delivery_fee, min_order_amount FROM restaurants WHERE id = ${restaurantId} LIMIT 1`;
    const deliveryFee = Number(restaurant?.delivery_fee || 0);
    const minOrder = Number(restaurant?.min_order_amount || 0);
    if (subtotal < minOrder) {
      return res.status(400).json({ detail: `Minimum order amount is ₦${minOrder.toLocaleString()}` });
    }
    const platformFee = Math.round(subtotal * 0.05 * 100) / 100;
    const totalAmount = subtotal + deliveryFee + platformFee;
    const orderId = uuid();
    const { delivery_address, delivery_latitude, delivery_longitude, payment_method, notes } = req.body;
    const deliveryCoords = delivery_latitude && delivery_longitude ? `(${delivery_longitude},${delivery_latitude})` : null;
    await sql`
      INSERT INTO orders (id, user_id, restaurant_id, status, subtotal, delivery_fee, platform_fee, total_amount, delivery_address, delivery_coordinates, payment_method, notes, created_at)
      VALUES (${orderId}, ${req.user!.sub}, ${restaurantId}, 'PENDING', ${subtotal}, ${deliveryFee}, ${platformFee}, ${totalAmount}, ${delivery_address}, ${deliveryCoords}, ${payment_method || 'CARD'}, ${notes}, NOW())
    `;
    for (const item of cartItems) {
      const oiId = uuid();
      await sql`
        INSERT INTO order_items (id, order_id, menu_item_id, menu_item_name, quantity, unit_price, subtotal, created_at)
        VALUES (${oiId}, ${orderId}, ${item.menu_item_id}, ${item.name}, ${item.quantity}, ${item.price}, ${Number(item.price) * item.quantity}, NOW())
      `;
    }
    await sql`DELETE FROM cart_items WHERE user_id = ${req.user!.sub}`;
    await sql`INSERT INTO order_status_history (id, order_id, status, created_at) VALUES (${uuid()}, ${orderId}, 'PENDING', NOW())`;
    const [order] = await sql`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1`;
    const items = await sql`SELECT * FROM order_items WHERE order_id = ${orderId} ORDER BY created_at ASC`;
    return res.status(201).json({ ...order, items });
  } catch (err) {
    console.error('create order error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

foodRouter.get('/orders', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    let query = sql`SELECT * FROM orders WHERE user_id = ${req.user!.sub}`;
    if (status) query = sql`${query} AND status = ${status}`;
    query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const orders = await query;
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
    console.error('list orders error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

foodRouter.get('/orders/:id', authenticate, async (req, res) => {
  try {
    const [order] = await sql`SELECT * FROM orders WHERE id = ${req.params.id} LIMIT 1`;
    if (!order) return res.status(404).json({ detail: 'Order not found' });
    if (order.user_id !== req.user!.sub && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ detail: 'Not your order' });
    }
    const items = await sql`SELECT * FROM order_items WHERE order_id = ${req.params.id} ORDER BY created_at ASC`;
    const history = await sql`SELECT * FROM order_status_history WHERE order_id = ${req.params.id} ORDER BY created_at ASC`;
    return res.json({ ...order, items, status_history: history });
  } catch (err) {
    console.error('get order error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

foodRouter.put('/orders/:id/status', authenticate, requireRole('VENDOR', 'ADMIN'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!status) return res.status(400).json({ detail: 'Status is required' });
    const [order] = await sql`SELECT * FROM orders WHERE id = ${req.params.id} LIMIT 1`;
    if (!order) return res.status(404).json({ detail: 'Order not found' });
    if (req.user!.role === 'VENDOR') {
      const [vendor] = await sql`SELECT id FROM vendors WHERE user_id = ${req.user!.sub} LIMIT 1`;
      const [restaurant] = await sql`SELECT id FROM restaurants WHERE id = ${order.restaurant_id} AND vendor_id = ${vendor?.id} LIMIT 1`;
      if (!restaurant) return res.status(403).json({ detail: 'Not your restaurant' });
    }
    const timestampFields: Record<string, string> = {
      ACCEPTED: 'accepted_at',
      PREPARING: 'prepared_at',
      READY: 'prepared_at',
      PICKED_UP: 'picked_up_at',
      DELIVERED: 'delivered_at',
      CANCELLED: 'cancelled_at',
    };
    const tsField = timestampFields[status];
    const tsClause = tsField ? `, ${tsField} = NOW()` : '';
    await sql.unsafe(`UPDATE orders SET status = $1, updated_at = NOW()${tsClause} WHERE id = $2`, [status, req.params.id]);
    await sql`INSERT INTO order_status_history (id, order_id, status, notes, created_by, created_at) VALUES (${uuid()}, ${req.params.id}, ${status}, ${notes}, ${req.user!.sub}, NOW())`;
    const [updated] = await sql`SELECT * FROM orders WHERE id = ${req.params.id} LIMIT 1`;
    return res.json(updated);
  } catch (err) {
    console.error('update order status error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});
