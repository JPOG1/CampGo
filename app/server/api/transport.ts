import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/index.js';
import { authenticate, requireRole } from '../auth/index.js';

export const transportRouter = Router();

// All routes require auth
transportRouter.use(authenticate);

// GET /fleet - list all fleet vehicles (admin only)
transportRouter.get('/fleet', requireRole('ADMIN'), async (req, res) => {
  try {
    const rows = await sql`SELECT f.*, u.first_name, u.last_name, u.phone FROM fleet f LEFT JOIN users u ON u.id = f.driver_id ORDER BY f.created_at DESC`;
    return res.json(rows);
  } catch (err) {
    console.error('list fleet error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /fleet - add a vehicle to fleet
transportRouter.post('/fleet', requireRole('ADMIN'), async (req, res) => {
  try {
    const id = uuid();
    const { plate_number, model, make, year, color, vehicle_type, capacity, driver_id } = req.body;
    if (!plate_number || !model || !make) {
      return res.status(400).json({ detail: 'Plate number, model, and make are required' });
    }
    await sql`
      INSERT INTO fleet (id, plate_number, model, make, year, color, vehicle_type, capacity, driver_id, status, created_at)
      VALUES (${id}, ${plate_number}, ${model}, ${make}, ${year || null}, ${color || null}, ${vehicle_type || 'SEDAN'}, ${capacity || 4}, ${driver_id || null}, 'ACTIVE', NOW())
    `;
    const [row] = await sql`SELECT * FROM fleet WHERE id = ${id} LIMIT 1`;
    return res.status(201).json(row);
  } catch (err) {
    console.error('create fleet error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// PUT /fleet/:id - update fleet vehicle
transportRouter.put('/fleet/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { plate_number, model, make, year, color, vehicle_type, capacity, driver_id, status } = req.body;
    const updates: string[] = []; const values: any[] = [];
    const fields: Record<string, any> = { plate_number, model, make, year, color, vehicle_type, capacity, driver_id, status };
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) { updates.push(k); values.push(v); }
    }
    updates.push('updated_at'); values.push(new Date());
    const setClause = updates.map((c, i) => `${c} = $${i+1}`).join(', ');
    await sql.unsafe(`UPDATE fleet SET ${setClause} WHERE id = $${updates.length+1}`, [...values, req.params.id]);
    const [row] = await sql`SELECT * FROM fleet WHERE id = ${req.params.id} LIMIT 1`;
    return res.json(row);
  } catch (err) {
    console.error('update fleet error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// DELETE /fleet/:id - remove fleet vehicle
transportRouter.delete('/fleet/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    await sql`DELETE FROM fleet WHERE id = ${req.params.id}`;
    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('delete fleet error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /fleet/:id/tracking - get vehicle tracking history
transportRouter.get('/fleet/:id/tracking', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM vehicle_tracking WHERE vehicle_id = ${req.params.id} ORDER BY recorded_at DESC LIMIT 100`;
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /fleet/:id/location - update vehicle location (from GPS)
transportRouter.post('/fleet/:id/location', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) return res.status(400).json({ detail: 'Latitude and longitude required' });
    const coord = `(${longitude},${latitude})`;
    await sql`INSERT INTO vehicle_tracking (id, vehicle_id, coordinates, recorded_at) VALUES (${uuid()}, ${req.params.id}, ${coord}, NOW())`;
    await sql`UPDATE fleet SET last_location = ${coord}, last_seen_at = NOW() WHERE id = ${req.params.id}`;
    return res.json({ status: 'ok' });
  } catch (err) {
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /drivers - list all drivers
transportRouter.get('/drivers', requireRole('ADMIN'), async (_req, res) => {
  try {
    const rows = await sql`SELECT id, first_name, last_name, phone, email, role, is_active, created_at FROM users WHERE role = 'RIDER' ORDER BY created_at DESC`;
    return res.json(rows);
  } catch (err) {
    console.error('list drivers error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /routes - list transport routes
transportRouter.get('/routes', async (_req, res) => {
  try {
    const rows = await sql`SELECT * FROM transport_routes WHERE is_active = true ORDER BY name ASC`;
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /routes - create a transport route
transportRouter.post('/routes', requireRole('ADMIN'), async (req, res) => {
  try {
    const id = uuid();
    const { name, description, origin, destination, distance_km, estimated_duration, fare } = req.body;
    await sql`
      INSERT INTO transport_routes (id, name, description, origin, destination, distance_km, estimated_duration, fare, is_active, created_at)
      VALUES (${id}, ${name}, ${description}, ${origin}, ${destination}, ${distance_km}, ${estimated_duration}, ${fare}, true, NOW())
    `;
    const [row] = await sql`SELECT * FROM transport_routes WHERE id = ${id} LIMIT 1`;
    return res.status(201).json(row);
  } catch (err) {
    console.error('create route error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});
