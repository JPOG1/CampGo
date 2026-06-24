import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/index.js';
import { authenticate } from '../auth/index.js';
import { sendNotification, notifyDeliveryStatus } from '../services/notifications.js';

export const deliveriesRouter = Router();

deliveriesRouter.get('/', authenticate, async (req, res) => {
  try {
    const { userId, status } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    let query: any;
    if (status) {
      query = sql`SELECT * FROM deliveries WHERE user_id = ${userId || req.user!.sub} AND status = ${status} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    } else {
      query = sql`SELECT * FROM deliveries WHERE user_id = ${userId || req.user!.sub} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    }
    const rows = await query;
    return res.json(rows);
  } catch (err) {
    console.error('get deliveries error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

deliveriesRouter.post('/', authenticate, async (req, res) => {
  try {
    const id = uuid();
    const { category, pickup_address, dropoff_address, pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude, payment_method, description } = req.body;
    const pcoord = `(${pickup_longitude},${pickup_latitude})`;
    const dcoord = `(${dropoff_longitude},${dropoff_latitude})`;
    await sql`
      INSERT INTO deliveries (id, user_id, status, category, description, pickup_address, dropoff_address, pickup_coordinates, dropoff_coordinates, payment_method, created_at)
      VALUES (${id}, ${req.user!.sub}, 'REQUESTED', ${category || 'PARCEL'}, ${description || ''}, ${pickup_address}, ${dropoff_address}, ${pcoord}, ${dcoord}, ${payment_method || null}, NOW())
    `;

    // Auto-dispatch: find nearby active riders
    try {
      const nearbyRiders = await sql`
        SELECT r.id, r.user_id FROM riders r
        JOIN users u ON u.id = r.user_id
        WHERE r.status = 'AVAILABLE' AND u.is_active = true
        LIMIT 3
      `;
      for (const rider of nearbyRiders) {
        await sendNotification({
          userId: rider.user_id,
          title: 'New Delivery Available',
          body: `A new ${category || 'PARCEL'} delivery is available for pickup`,
          type: 'DELIVERY',
          data: { delivery_id: id },
          channels: ['in_app', 'push'],
        });
      }
      if (nearbyRiders.length > 0) {
        await sql`UPDATE deliveries SET rider_id = ${nearbyRiders[0].user_id}, status = 'ACCEPTED' WHERE id = ${id}`;
        await notifyDeliveryStatus(req.user!.sub, id, 'ACCEPTED');
      }
    } catch (dispatchErr) {
      console.error('dispatch error:', dispatchErr);
    }

    const rows = await sql`SELECT * FROM deliveries WHERE id = ${id} LIMIT 1`;
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('create delivery error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

deliveriesRouter.put('/:id', authenticate, async (req, res) => {
  try {
    const { status, rider_id, total_amount, distance_km } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    if (status !== undefined) { updates.push('status'); values.push(status); }
    if (rider_id !== undefined) { updates.push('rider_id'); values.push(rider_id); }
    if (total_amount !== undefined) { updates.push('total_amount'); values.push(total_amount); }
    if (distance_km !== undefined) { updates.push('distance_km'); values.push(distance_km); }
    if (status === 'IN_TRANSIT') { updates.push('pickup_time'); values.push(new Date()); }
    if (status === 'DELIVERED') {
      updates.push('actual_delivery_time'); values.push(new Date());
      await notifyDeliveryStatus(req.user!.sub, req.params.id, 'DELIVERED');
    }
    updates.push('updated_at'); values.push(new Date());
    const setClauseDeliveries = updates.map((c, i) => `${c} = $${i + 1}`).join(', ');
    await sql.unsafe(`UPDATE deliveries SET ${setClauseDeliveries} WHERE id = $${updates.length + 1}`, [...values, req.params.id]);
    const rows = await sql`SELECT * FROM deliveries WHERE id = ${req.params.id} LIMIT 1`;
    return res.json(rows[0]);
  } catch (err) {
    console.error('update delivery error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

deliveriesRouter.get('/:id/eta', authenticate, async (req, res) => {
  try {
    const [delivery] = await sql`SELECT * FROM deliveries WHERE id = ${req.params.id} LIMIT 1`;
    if (!delivery) return res.status(404).json({ detail: 'Delivery not found' });

    const parsePoint = (p: string) => {
      const match = p?.match(/\(([\d.-]+),([\d.-]+)\)/);
      return match ? { lng: parseFloat(match[1]), lat: parseFloat(match[2]) } : null;
    };
    const pickup = parsePoint(delivery.pickup_coordinates);
    const dropoff = parsePoint(delivery.dropoff_coordinates);

    if (pickup && dropoff) {
      const R = 6371;
      const dLat = (dropoff.lat - pickup.lat) * Math.PI / 180;
      const dLng = (dropoff.lng - pickup.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(pickup.lat * Math.PI / 180) * Math.cos(dropoff.lat * Math.PI / 180) * Math.sin(dLng/2)**2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const etaMinutes = Math.round(dist / 30 * 60);
      return res.json({ distance_km: Math.round(dist * 100) / 100, eta_minutes: etaMinutes });
    }
    return res.json({ distance_km: null, eta_minutes: null });
  } catch (err) {
    console.error('eta error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});
