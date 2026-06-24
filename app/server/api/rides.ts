import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/index.js';
import { authenticate } from '../auth/index.js';

export const ridesRouter = Router();

ridesRouter.get('/', authenticate, async (req, res) => {
  try {
    const { userId, status } = req.query;
    const uid = userId || req.user!.sub;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    let rows;
    if (status === 'ACTIVE') {
      rows = await sql`SELECT * FROM rides WHERE user_id = ${uid} AND status IN ('REQUESTED', 'ACCEPTED', 'RIDER_ARRIVING', 'RIDER_ARRIVED', 'IN_PROGRESS') ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (status) {
      rows = await sql`SELECT * FROM rides WHERE user_id = ${uid} AND status = ${status} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    } else {
      rows = await sql`SELECT * FROM rides WHERE user_id = ${uid} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    }
    return res.json(rows);
  } catch (err) {
    console.error('get rides error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

ridesRouter.post('/', authenticate, async (req, res) => {
  try {
    const id = uuid();
    const { pickup_address, dropoff_address, pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude, payment_method } = req.body;
    const pcoord = `(${pickup_longitude},${pickup_latitude})`;
    const dcoord = `(${dropoff_longitude},${dropoff_latitude})`;
    await sql`
      INSERT INTO rides (id, user_id, status, pickup_address, dropoff_address, pickup_coordinates, dropoff_coordinates, payment_method, created_at)
      VALUES (${id}, ${req.user!.sub}, 'REQUESTED', ${pickup_address}, ${dropoff_address}, ${pcoord}, ${dcoord}, ${payment_method || null}, NOW())
    `;
    const rows = await sql`SELECT * FROM rides WHERE id = ${id} LIMIT 1`;
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('create ride error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

ridesRouter.put('/:id', authenticate, async (req, res) => {
  try {
    const { status, rider_id, fare_amount, distance_km, duration_minutes, rating_by_user, review_by_user } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    if (status !== undefined) { updates.push('status'); values.push(status); }
    if (rider_id !== undefined) { updates.push('rider_id'); values.push(rider_id); }
    if (fare_amount !== undefined) { updates.push('fare_amount'); values.push(fare_amount); }
    if (distance_km !== undefined) { updates.push('distance_km'); values.push(distance_km); }
    if (duration_minutes !== undefined) { updates.push('duration_minutes'); values.push(duration_minutes); }
    if (rating_by_user !== undefined) { updates.push('rating_by_user'); values.push(rating_by_user); }
    if (review_by_user !== undefined) { updates.push('review_by_user'); values.push(review_by_user); }
    if (status === 'COMPLETED') { updates.push('completed_at'); values.push(new Date()); }
    if (status === 'ACCEPTED' || status === 'RIDER_ARRIVING' || status === 'RIDER_ARRIVED') {
      updates.push('started_at'); values.push(new Date());
    }
    updates.push('updated_at'); values.push(new Date());
    const setClauseRides = updates.map((c, i) => `${c} = $${i + 1}`).join(', ');
    await sql.unsafe(`UPDATE rides SET ${setClauseRides} WHERE id = $${updates.length + 1}`, [...values, req.params.id]);
    const rows = await sql`SELECT * FROM rides WHERE id = ${req.params.id} LIMIT 1`;
    return res.json(rows[0]);
  } catch (err) {
    console.error('update ride error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

ridesRouter.post('/:id/location', authenticate, async (req, res) => {
  try {
    const { latitude, longitude, accuracy_meters } = req.body;
    const id = uuid();
    const coord = `(${longitude},${latitude})`;
    await sql`
      INSERT INTO ride_locations (id, ride_id, coordinates, recorded_at)
      VALUES (${id}, ${req.params.id}, ${coord}, NOW())
    `;
    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('location update error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});
