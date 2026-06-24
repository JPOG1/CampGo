import { sql } from '../db/index.js';
import { v4 as uuid } from 'uuid';

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type?: 'RIDE' | 'DELIVERY' | 'FOOD' | 'PAYMENT' | 'PROMO' | 'SYSTEM';
  data?: Record<string, any>;
  channels?: ('in_app' | 'push' | 'email' | 'sms')[];
}

async function sendFCM(userId: string, title: string, body: string, data?: Record<string, any>) {
  try {
    const devices = await sql`
      SELECT fcm_token FROM user_devices WHERE user_id = ${userId} AND fcm_token IS NOT NULL AND fcm_token != ''
    `;
    for (const device of devices) {
      console.log(`[FCM] Sending to ${device.fcm_token}: ${title} - ${body}`);
    }
  } catch (err) {
    console.error('[FCM] Error:', err);
  }
}

async function sendEmail(userId: string, subject: string, html: string) {
  try {
    const [user] = await sql`SELECT email, first_name FROM users WHERE id = ${userId} LIMIT 1`;
    if (!user?.email) return;
    console.log(`[EMAIL] To: ${user.email} | Subject: ${subject}`);
    if (process.env.SMTP_HOST) {
      // In production, use nodemailer here
    }
  } catch (err) {
    console.error('[EMAIL] Error:', err);
  }
}

async function sendSMS(phone: string, message: string) {
  try {
    console.log(`[SMS] To: ${phone} | Message: ${message}`);
    if (process.env.TWILIO_ACCOUNT_SID) {
      // In production, use twilio here
    }
  } catch (err) {
    console.error('[SMS] Error:', err);
  }
}

export async function sendNotification(payload: NotificationPayload) {
  const id = uuid();
  const channels = payload.channels || ['in_app'];
  
  if (channels.includes('in_app')) {
    await sql`
      INSERT INTO notifications (id, user_id, title, body, type, data, read_at, created_at)
      VALUES (${id}, ${payload.userId}, ${payload.title}, ${payload.body}, ${payload.type || 'SYSTEM'}, ${payload.data ? JSON.stringify(payload.data) : null}, NULL, NOW())
    `;
  }

  if (channels.includes('push')) {
    await sendFCM(payload.userId, payload.title, payload.body, payload.data);
  }

  if (channels.includes('email')) {
    const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#FF6B35;">${payload.title}</h2>
      <p>${payload.body}</p>
      <hr style="border:1px solid #eee;"/>
      <p style="color:#999;font-size:12px;">CampGo - Ride Hailing & Delivery</p>
    </div>`;
    await sendEmail(payload.userId, payload.title, html);
  }

  return { id };
}

export async function notifyRideStatus(userId: string, rideId: string, status: string, driverName?: string) {
  const messages: Record<string, { title: string; body: string }> = {
    REQUESTED: { title: 'Ride Requested', body: 'Your ride has been requested. Waiting for a driver...' },
    ACCEPTED: { title: 'Driver Accepted', body: `${driverName || 'A driver'} has accepted your ride!` },
    RIDER_ARRIVING: { title: 'Driver Arriving', body: `${driverName || 'Your driver'} is on the way!` },
    RIDER_ARRIVED: { title: 'Driver Arrived', body: 'Your driver has arrived at the pickup location.' },
    IN_PROGRESS: { title: 'Ride Started', body: 'Your ride is now in progress.' },
    COMPLETED: { title: 'Ride Complete', body: 'You have arrived at your destination. Thank you for riding with CampGo!' },
    CANCELLED: { title: 'Ride Cancelled', body: 'Your ride has been cancelled.' },
  };
  const msg = messages[status];
  if (!msg) return;
  return sendNotification({
    userId,
    title: msg.title,
    body: msg.body,
    type: 'RIDE',
    data: { ride_id: rideId, status },
    channels: ['in_app', 'push'],
  });
}

export async function notifyOrderStatus(userId: string, orderId: string, status: string, restaurantName?: string) {
  const messages: Record<string, { title: string; body: string }> = {
    PENDING: { title: 'Order Placed', body: `Your order from ${restaurantName || 'the restaurant'} has been placed.` },
    ACCEPTED: { title: 'Order Accepted', body: `${restaurantName || 'The restaurant'} has accepted your order!` },
    PREPARING: { title: 'Preparing', body: 'Your food is being prepared.' },
    READY: { title: 'Order Ready', body: 'Your order is ready for pickup/delivery.' },
    PICKED_UP: { title: 'Picked Up', body: 'Your order has been picked up and is on the way!' },
    DELIVERED: { title: 'Delivered', body: 'Your order has been delivered. Enjoy your meal!' },
    CANCELLED: { title: 'Order Cancelled', body: 'Your order has been cancelled.' },
  };
  const msg = messages[status];
  if (!msg) return;
  return sendNotification({
    userId,
    title: msg.title,
    body: msg.body,
    type: 'FOOD',
    data: { order_id: orderId, status },
    channels: ['in_app', 'push'],
  });
}

export async function notifyDeliveryStatus(userId: string, deliveryId: string, status: string) {
  const messages: Record<string, { title: string; body: string }> = {
    REQUESTED: { title: 'Delivery Requested', body: 'Your delivery request has been submitted.' },
    ACCEPTED: { title: 'Delivery Accepted', body: 'A rider has accepted your delivery!' },
    IN_TRANSIT: { title: 'In Transit', body: 'Your package is on the way!' },
    DELIVERED: { title: 'Delivered', body: 'Your package has been delivered!' },
    CANCELLED: { title: 'Delivery Cancelled', body: 'Your delivery has been cancelled.' },
  };
  const msg = messages[status];
  if (!msg) return;
  return sendNotification({
    userId,
    title: msg.title,
    body: msg.body,
    type: 'DELIVERY',
    data: { delivery_id: deliveryId, status },
    channels: ['in_app', 'push', 'sms'],
  });
}
