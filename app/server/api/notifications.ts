import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/index.js';
import { authenticate } from '../auth/index.js';

export const notificationsRouter = Router();

notificationsRouter.get('/', authenticate, async (req, res) => {
  try {
    const { limit, unread } = req.query;
    let query = sql`SELECT * FROM notifications WHERE user_id = ${req.user!.sub}`;
    if (unread === 'true') query = sql`${query} AND read_at IS NULL`;
    query = sql`${query} ORDER BY created_at DESC LIMIT ${Math.min(Number(limit) || 50, 100)}`;
    const rows = await query;
    const unreadCount = await sql`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${req.user!.sub} AND read_at IS NULL`;
    return res.json({ notifications: rows, unread_count: Number(unreadCount[0]?.count || 0) });
  } catch (err) {
    console.error('list notifications error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

notificationsRouter.put('/:id/read', authenticate, async (req, res) => {
  try {
    await sql`UPDATE notifications SET read_at = NOW(), updated_at = NOW() WHERE id = ${req.params.id} AND user_id = ${req.user!.sub}`;
    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('mark notification read error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

notificationsRouter.put('/read-all', authenticate, async (req, res) => {
  try {
    await sql`UPDATE notifications SET read_at = NOW(), updated_at = NOW() WHERE user_id = ${req.user!.sub} AND read_at IS NULL`;
    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('mark all read error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

notificationsRouter.post('/register-push', authenticate, async (req, res) => {
  try {
    const { fcm_token, device_id, device_type } = req.body;
    if (!fcm_token) return res.status(400).json({ detail: 'FCM token is required' });
    const [existing] = await sql`
      SELECT id FROM user_devices WHERE fcm_token = ${fcm_token} LIMIT 1
    `;
    if (existing) {
      await sql`UPDATE user_devices SET is_active = true, last_used_at = NOW() WHERE id = ${existing.id}`;
    } else {
      await sql`
        INSERT INTO user_devices (id, user_id, device_id, device_type, fcm_token, created_at)
        VALUES (${uuid()}, ${req.user!.sub}, ${device_id || null}, ${device_type || 'mobile'}, ${fcm_token}, NOW())
      `;
    }
    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('register push error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  try {
    const id = uuid();
    await sql`
      INSERT INTO notifications (id, user_id, type, title, body, data, channel, status, created_at)
      VALUES (${id}, ${userId}, ${type}, ${title}, ${body}, ${data ? JSON.stringify(data) : null}, 'IN_APP', 'SENT', NOW())
    `;
    return id;
  } catch (err) {
    console.error('create notification error:', err);
    return null;
  }
}
