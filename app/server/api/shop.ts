import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/index.js';
import { authenticate } from '../auth/index.js';

export const shopRouter = Router();

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

function getVendorId(req: any) {
  return sql`SELECT id FROM vendors WHERE user_id = ${req.user!.sub} LIMIT 1`;
}

function getShopByVendor(req: any) {
  return sql`
    SELECT s.* FROM shops s JOIN vendors v ON v.id = s.vendor_id
    WHERE v.user_id = ${req.user!.sub} LIMIT 1
  `;
}

shopRouter.get('/shop', async (_req, res) => {
  try {
    const { category, search } = _req.query;
    let query = sql`SELECT * FROM shops WHERE is_active = true`;
    if (category) query = sql`${query} AND category = ${category}`;
    if (search) query = sql`${query} AND (name ILIKE ${'%' + search + '%'} OR description ILIKE ${'%' + search + '%'})`;
    query = sql`${query} ORDER BY created_at DESC LIMIT 50`;
    const rows = await query;
    return res.json(rows);
  } catch (err) {
    console.error('list shops error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

shopRouter.get('/shop/categories', async (_req, res) => {
  try {
    const rows = await sql`
      SELECT DISTINCT category FROM shops WHERE is_active = true ORDER BY category ASC
    `;
    return res.json(rows.map((r: any) => r.category));
  } catch (err) {
    console.error('shop categories error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

shopRouter.get('/shop/:id', async (req, res) => {
  try {
    const [shop] = await sql`SELECT * FROM shops WHERE id = ${req.params.id} AND is_active = true LIMIT 1`;
    if (!shop) return res.status(404).json({ detail: 'Shop not found' });
    const [vendor] = await sql`SELECT business_name FROM vendors WHERE id = ${shop.vendor_id} LIMIT 1`;
    const products = await sql`
      SELECT * FROM products WHERE shop_id = ${shop.id} AND is_available = true ORDER BY sort_order ASC, category ASC, name ASC
    `;
    return res.json({ ...shop, vendor_name: vendor?.business_name || '', products });
  } catch (err) {
    console.error('get shop error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

shopRouter.get('/vendor/shop', authenticate, async (req, res) => {
  try {
    const [shop] = await getShopByVendor(req);
    return res.json(shop || null);
  } catch (err) {
    console.error('get vendor shop error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

shopRouter.post('/vendor/shop', authenticate, async (req, res) => {
  try {
    const [vendor] = await getVendorId(req);
    if (!vendor) return res.status(404).json({ detail: 'Vendor profile not found' });
    const [existing] = await sql`SELECT id FROM shops WHERE vendor_id = ${vendor.id} LIMIT 1`;
    if (existing) return res.status(400).json({ detail: 'You already have a shop. Use PUT to update it.' });
    const id = uuid();
    const { name, description, category, cover_image, logo_url } = req.body;
    if (!name || !category) return res.status(400).json({ detail: 'Name and category are required' });
    await sql`
      INSERT INTO shops (id, vendor_id, name, description, category, cover_image, logo_url, created_at)
      VALUES (${id}, ${vendor.id}, ${name}, ${description}, ${category}, ${cover_image}, ${logo_url}, NOW())
    `;
    const [row] = await sql`SELECT * FROM shops WHERE id = ${id} LIMIT 1`;
    return res.status(201).json(row);
  } catch (err) {
    console.error('create shop error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

shopRouter.put('/vendor/shop', authenticate, async (req, res) => {
  try {
    const [shop] = await getShopByVendor(req);
    if (!shop) return res.status(404).json({ detail: 'Shop not found. Create one first.' });
    const { name, description, category, cover_image, logo_url, is_active } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    if (name !== undefined) { updates.push('name'); values.push(name); }
    if (description !== undefined) { updates.push('description'); values.push(description); }
    if (category !== undefined) { updates.push('category'); values.push(category); }
    if (cover_image !== undefined) { updates.push('cover_image'); values.push(cover_image); }
    if (logo_url !== undefined) { updates.push('logo_url'); values.push(logo_url); }
    if (is_active !== undefined) { updates.push('is_active'); values.push(is_active); }
    if (updates.length === 0) return res.json(shop);
    updates.push('updated_at'); values.push(new Date());
    const setClause = updates.map((c, i) => `${c} = $${i + 1}`).join(', ');
    await sql.unsafe(`UPDATE shops SET ${setClause} WHERE id = $${updates.length + 1}`, [...values, shop.id]);
    const [row] = await sql`SELECT * FROM shops WHERE id = ${shop.id} LIMIT 1`;
    return res.json(row);
  } catch (err) {
    console.error('update shop error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

shopRouter.get('/vendor/products', authenticate, async (req, res) => {
  try {
    const [shop] = await getShopByVendor(req);
    if (!shop) return res.json([]);
    const rows = await sql`
      SELECT * FROM products WHERE shop_id = ${shop.id} ORDER BY sort_order ASC, category ASC, name ASC
    `;
    return res.json(rows);
  } catch (err) {
    console.error('list products error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

shopRouter.post('/vendor/products', authenticate, async (req, res) => {
  try {
    const [shop] = await getShopByVendor(req);
    if (!shop) return res.status(400).json({ detail: 'Create your shop first' });
    const id = uuid();
    const { name, description, price, currency, image, category, stock_quantity, is_available } = req.body;
    if (!name || price === undefined) return res.status(400).json({ detail: 'Name and price are required' });
    await sql`
      INSERT INTO products (id, shop_id, name, description, price, currency, image, category, stock_quantity, is_available, created_at)
      VALUES (${id}, ${shop.id}, ${name}, ${description}, ${price}, ${currency || 'NGN'}, ${image}, ${category}, ${stock_quantity ?? 0}, ${is_available ?? true}, NOW())
    `;
    const [row] = await sql`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
    return res.status(201).json(row);
  } catch (err) {
    console.error('create product error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

shopRouter.put('/vendor/products/:id', authenticate, async (req, res) => {
  try {
    const [shop] = await getShopByVendor(req);
    if (!shop) return res.status(404).json({ detail: 'Shop not found' });
    const [product] = await sql`
      SELECT p.* FROM products p JOIN shops s ON s.id = p.shop_id
      WHERE p.id = ${req.params.id} AND s.vendor_id = ${shop.vendor_id} LIMIT 1
    `;
    if (!product) return res.status(404).json({ detail: 'Product not found' });
    const { name, description, price, currency, image, category, stock_quantity, is_available } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    if (name !== undefined) { updates.push('name'); values.push(name); }
    if (description !== undefined) { updates.push('description'); values.push(description); }
    if (price !== undefined) { updates.push('price'); values.push(price); }
    if (currency !== undefined) { updates.push('currency'); values.push(currency); }
    if (image !== undefined) { updates.push('image'); values.push(image); }
    if (category !== undefined) { updates.push('category'); values.push(category); }
    if (stock_quantity !== undefined) { updates.push('stock_quantity'); values.push(stock_quantity); }
    if (is_available !== undefined) { updates.push('is_available'); values.push(is_available); }
    if (updates.length === 0) return res.json(product);
    updates.push('updated_at'); values.push(new Date());
    const setClause = updates.map((c, i) => `${c} = $${i + 1}`).join(', ');
    await sql.unsafe(`UPDATE products SET ${setClause} WHERE id = $${updates.length + 1}`, [...values, req.params.id]);
    const [row] = await sql`SELECT * FROM products WHERE id = ${req.params.id} LIMIT 1`;
    return res.json(row);
  } catch (err) {
    console.error('update product error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

shopRouter.delete('/vendor/products/:id', authenticate, async (req, res) => {
  try {
    const [shop] = await getShopByVendor(req);
    if (!shop) return res.status(404).json({ detail: 'Shop not found' });
    const [product] = await sql`
      SELECT p.id FROM products p JOIN shops s ON s.id = p.shop_id
      WHERE p.id = ${req.params.id} AND s.vendor_id = ${shop.vendor_id} LIMIT 1
    `;
    if (!product) return res.status(404).json({ detail: 'Product not found' });
    await sql`UPDATE products SET is_available = false, updated_at = NOW() WHERE id = ${req.params.id}`;
    return res.json({ detail: 'Product removed' });
  } catch (err) {
    console.error('delete product error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

shopRouter.get('/vendor/shop-orders', authenticate, async (req, res) => {
  try {
    const [shop] = await getShopByVendor(req);
    if (!shop) return res.json([]);
    const orders = await sql`
      SELECT so.*, u.first_name || ' ' || u.last_name as customer_name
      FROM shop_orders so JOIN users u ON u.id = so.user_id
      WHERE so.shop_id = ${shop.id}
      ORDER BY so.created_at DESC LIMIT 50
    `;
    const orderIds = orders.map((o: any) => o.id);
    const allItems = orderIds.length > 0
      ? await sql`SELECT * FROM shop_order_items WHERE shop_order_id = ANY(${orderIds}) ORDER BY created_at ASC`
      : [];
    const itemsByOrder = new Map();
    for (const item of allItems) {
      const list = itemsByOrder.get(item.shop_order_id) || [];
      list.push(item);
      itemsByOrder.set(item.shop_order_id, list);
    }
    return res.json(orders.map((o: any) => ({ ...o, items: itemsByOrder.get(o.id) || [] })));
  } catch (err) {
    console.error('vendor shop orders error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

shopRouter.patch('/vendor/shop-orders/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ detail: `Invalid status. Valid: ${VALID_STATUSES.join(', ')}` });
    }
    const [order] = await sql`
      SELECT so.* FROM shop_orders so JOIN shops s ON s.id = so.shop_id
      JOIN vendors v ON v.id = s.vendor_id
      WHERE so.id = ${req.params.id} AND v.user_id = ${req.user!.sub} LIMIT 1
    `;
    if (!order) return res.status(404).json({ detail: 'Order not found' });
    await sql`UPDATE shop_orders SET status = ${status}, updated_at = NOW() WHERE id = ${req.params.id}`;
    await sql`
      INSERT INTO shop_order_status_history (id, shop_order_id, status, notes, created_by, created_at)
      VALUES (${uuid()}, ${req.params.id}, ${status}, ${'Updated by vendor'}, ${req.user!.sub}, NOW())
    `;
    const [updated] = await sql`SELECT * FROM shop_orders WHERE id = ${req.params.id} LIMIT 1`;
    const [customer] = await sql`SELECT first_name, last_name FROM users WHERE id = ${updated.user_id} LIMIT 1`;
    return res.json({ ...updated, customer_name: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown' });
  } catch (err) {
    console.error('vendor update shop order error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

shopRouter.get('/shop/cart', authenticate, async (req, res) => {
  try {
    const items = await sql`
      SELECT sci.*, p.name as product_name, p.price as unit_price, p.image as product_image, p.is_available,
             s.name as shop_name, s.id as shop_id
      FROM shop_cart_items sci
      JOIN products p ON p.id = sci.product_id
      JOIN shops s ON s.id = sci.shop_id
      WHERE sci.user_id = ${req.user!.sub}
      ORDER BY sci.created_at ASC
    `;
    const total = items.reduce((sum: number, item: any) => sum + Number(item.unit_price) * item.quantity, 0);
    const shopIds = [...new Set(items.map((i: any) => i.shop_id))];
    const shopCount = shopIds.length;
    return res.json({ items, total, shop_count: shopCount });
  } catch (err) {
    console.error('get shop cart error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

shopRouter.post('/shop/cart', authenticate, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    if (!product_id) return res.status(400).json({ detail: 'Product ID is required' });
    const qty = Math.max(1, quantity || 1);
    const [product] = await sql`SELECT * FROM products WHERE id = ${product_id} AND is_available = true LIMIT 1`;
    if (!product) return res.status(404).json({ detail: 'Product not found or unavailable' });
    const [existing] = await sql`
      SELECT id FROM shop_cart_items WHERE user_id = ${req.user!.sub} AND product_id = ${product_id} LIMIT 1
    `;
    if (existing) {
      await sql`UPDATE shop_cart_items SET quantity = quantity + ${qty} WHERE id = ${existing.id}`;
    } else {
      const id = uuid();
      await sql`
        INSERT INTO shop_cart_items (id, user_id, shop_id, product_id, quantity, created_at)
        VALUES (${id}, ${req.user!.sub}, ${product.shop_id}, ${product_id}, ${qty}, NOW())
      `;
    }
    const items = await sql`
      SELECT sci.*, p.name as product_name, p.price as unit_price, p.image as product_image, p.is_available,
             s.name as shop_name, s.id as shop_id
      FROM shop_cart_items sci
      JOIN products p ON p.id = sci.product_id
      JOIN shops s ON s.id = sci.shop_id
      WHERE sci.user_id = ${req.user!.sub}
      ORDER BY sci.created_at ASC
    `;
    const total = items.reduce((sum: number, item: any) => sum + Number(item.unit_price) * item.quantity, 0);
    return res.status(201).json({ items, total });
  } catch (err) {
    console.error('add to shop cart error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

shopRouter.put('/shop/cart/:id', authenticate, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ detail: 'Quantity must be at least 1' });
    const [existing] = await sql`
      SELECT id FROM shop_cart_items WHERE id = ${req.params.id} AND user_id = ${req.user!.sub} LIMIT 1
    `;
    if (!existing) return res.status(404).json({ detail: 'Cart item not found' });
    await sql`UPDATE shop_cart_items SET quantity = ${quantity} WHERE id = ${req.params.id}`;
    const items = await sql`
      SELECT sci.*, p.name as product_name, p.price as unit_price, p.image as product_image, p.is_available,
             s.name as shop_name, s.id as shop_id
      FROM shop_cart_items sci
      JOIN products p ON p.id = sci.product_id
      JOIN shops s ON s.id = sci.shop_id
      WHERE sci.user_id = ${req.user!.sub}
      ORDER BY sci.created_at ASC
    `;
    const total = items.reduce((sum: number, item: any) => sum + Number(item.unit_price) * item.quantity, 0);
    return res.json({ items, total });
  } catch (err) {
    console.error('update shop cart error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

shopRouter.delete('/shop/cart/:id', authenticate, async (req, res) => {
  try {
    const [existing] = await sql`
      SELECT id FROM shop_cart_items WHERE id = ${req.params.id} AND user_id = ${req.user!.sub} LIMIT 1
    `;
    if (!existing) return res.status(404).json({ detail: 'Cart item not found' });
    await sql`DELETE FROM shop_cart_items WHERE id = ${req.params.id}`;
    return res.json({ detail: 'Item removed from cart' });
  } catch (err) {
    console.error('remove from shop cart error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

shopRouter.post('/shop/checkout', authenticate, async (req, res) => {
  try {
    const { delivery_address, payment_method, notes } = req.body;
    if (!delivery_address) return res.status(400).json({ detail: 'Delivery address is required' });
    const items = await sql`
      SELECT sci.*, p.price as unit_price, p.name as product_name, p.shop_id, p.is_available
      FROM shop_cart_items sci JOIN products p ON p.id = sci.product_id
      WHERE sci.user_id = ${req.user!.sub}
    `;
    if (items.length === 0) return res.status(400).json({ detail: 'Cart is empty' });
    const unavailable = items.find((i: any) => !i.is_available);
    if (unavailable) return res.status(400).json({ detail: `"${unavailable.product_name}" is no longer available` });
    const shopIds = [...new Set(items.map((i: any) => i.shop_id))];
    if (shopIds.length !== 1) return res.status(400).json({ detail: 'All items must be from the same shop' });
    const shopId = shopIds[0];
    const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.unit_price) * item.quantity, 0);
    const deliveryFee = 0;
    const totalAmount = subtotal + deliveryFee;
    const orderId = uuid();
    await sql`
      INSERT INTO shop_orders (id, user_id, shop_id, status, subtotal, delivery_fee, total_amount, delivery_address, payment_method, notes, created_at)
      VALUES (${orderId}, ${req.user!.sub}, ${shopId}, 'PENDING', ${subtotal}, ${deliveryFee}, ${totalAmount}, ${delivery_address}, ${payment_method || 'CARD'}, ${notes}, NOW())
    `;
    for (const item of items) {
      const oiId = uuid();
      await sql`
        INSERT INTO shop_order_items (id, shop_order_id, product_id, product_name, quantity, unit_price, subtotal, created_at)
        VALUES (${oiId}, ${orderId}, ${item.product_id}, ${item.product_name}, ${item.quantity}, ${item.unit_price}, ${Number(item.unit_price) * item.quantity}, NOW())
      `;
    }
    await sql`
      INSERT INTO shop_order_status_history (id, shop_order_id, status, created_by, created_at)
      VALUES (${uuid()}, ${orderId}, 'PENDING', ${req.user!.sub}, NOW())
    `;
    await sql`DELETE FROM shop_cart_items WHERE user_id = ${req.user!.sub}`;
    const [order] = await sql`SELECT * FROM shop_orders WHERE id = ${orderId} LIMIT 1`;
    const [shop] = await sql`SELECT name FROM shops WHERE id = ${shopId} LIMIT 1`;
    const orderItems = await sql`SELECT * FROM shop_order_items WHERE shop_order_id = ${orderId} ORDER BY created_at ASC`;
    return res.status(201).json({ ...order, shop_name: shop?.name, items: orderItems });
  } catch (err) {
    console.error('shop checkout error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

shopRouter.get('/shop/orders', authenticate, async (req, res) => {
  try {
    const orders = await sql`
      SELECT so.*, s.name as shop_name, s.cover_image as shop_image
      FROM shop_orders so JOIN shops s ON s.id = so.shop_id
      WHERE so.user_id = ${req.user!.sub}
      ORDER BY so.created_at DESC LIMIT 50
    `;
    const orderIds = orders.map((o: any) => o.id);
    const allItems = orderIds.length > 0
      ? await sql`SELECT * FROM shop_order_items WHERE shop_order_id = ANY(${orderIds}) ORDER BY created_at ASC`
      : [];
    const itemsByOrder = new Map();
    for (const item of allItems) {
      const list = itemsByOrder.get(item.shop_order_id) || [];
      list.push(item);
      itemsByOrder.set(item.shop_order_id, list);
    }
    return res.json(orders.map((o: any) => ({ ...o, items: itemsByOrder.get(o.id) || [] })));
  } catch (err) {
    console.error('my shop orders error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});
