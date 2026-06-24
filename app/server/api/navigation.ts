import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/index.js';

export const navigationRouter = Router();

const POI_CATEGORIES = [
  { name: 'Restaurants', icon: 'restaurant', tag: 'food' },
  { name: 'Hospitals', icon: 'hospital', tag: 'health' },
  { name: 'Pharmacies', icon: 'pharmacy', tag: 'health' },
  { name: 'Police Stations', icon: 'police', tag: 'security' },
  { name: 'Fuel Stations', icon: 'fuel', tag: 'transport' },
  { name: 'Banks', icon: 'bank', tag: 'finance' },
  { name: 'Schools', icon: 'school', tag: 'education' },
  { name: 'Markets', icon: 'market', tag: 'shopping' },
  { name: 'Hotels', icon: 'hotel', tag: 'accommodation' },
  { name: 'Shopping Malls', icon: 'mall', tag: 'shopping' },
];

navigationRouter.get('/poi/categories', async (_req, res) => {
  return res.json(POI_CATEGORIES);
});

navigationRouter.get('/poi/search', async (req, res) => {
  try {
    const { q, lat, lng, category, radius } = req.query;
    let query = sql`SELECT * FROM user_locations WHERE is_saved = true`;
    if (q) query = sql`${query} AND (label ILIKE ${'%' + q + '%'} OR address ILIKE ${'%' + q + '%'})`;
    if (category) query = sql`${query} AND label ILIKE ${'%' + category + '%'}`;
    if (lat && lng && radius) {
      query = sql`${query} AND coordinates IS NOT NULL`;
    }
    query = sql`${query} ORDER BY label ASC LIMIT 50`;
    const rows = await query;
    return res.json(rows.map((r: any) => ({
      id: r.id,
      name: r.label,
      address: r.address,
      latitude: r.coordinates ? r.coordinates.y : null,
      longitude: r.coordinates ? r.coordinates.x : null,
      category: 'place',
      distance: null,
    })));
  } catch (err) {
    console.error('POI search error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

navigationRouter.post('/poi', async (req, res) => {
  try {
    const id = uuid();
    const { name, address, latitude, longitude, category } = req.body;
    if (!name || !latitude || !longitude) {
      return res.status(400).json({ detail: 'Name, latitude, and longitude are required' });
    }
    const coords = `(${longitude},${latitude})`;
    await sql`
      INSERT INTO user_locations (id, user_id, label, coordinates, address, is_saved, created_at)
      VALUES (${id}, ${req.user?.sub || '00000000-0000-0000-0000-000000000000'}, ${name}, ${coords}, ${address || null}, true, NOW())
    `;
    const [row] = await sql`SELECT * FROM user_locations WHERE id = ${id} LIMIT 1`;
    return res.status(201).json(row);
  } catch (err) {
    console.error('create POI error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

navigationRouter.get('/directions', async (req, res) => {
  try {
    const { origin_lat, origin_lng, dest_lat, dest_lng } = req.query;
    if (!origin_lat || !origin_lng || !dest_lat || !dest_lng) {
      return res.status(400).json({ detail: 'origin and destination coordinates required' });
    }
    const olat = Number(origin_lat);
    const olng = Number(origin_lng);
    const dlat = Number(dest_lat);
    const dlng = Number(dest_lng);
    const R = 6371;
    const dLat = (dlat - olat) * Math.PI / 180;
    const dLng = (dlng - olng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(olat * Math.PI / 180) * Math.cos(dlat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const estimatedMinutes = Math.round(distanceKm / 30 * 60);
    return res.json({
      distance_km: Math.round(distanceKm * 100) / 100,
      duration_minutes: estimatedMinutes,
      origin: { latitude: olat, longitude: olng },
      destination: { latitude: dlat, longitude: dlng },
      polyline: `${olat},${olng}:${dlat},${dlng}`,
    });
  } catch (err) {
    console.error('directions error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});
