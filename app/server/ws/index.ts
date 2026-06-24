import type { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../auth/index.js';
import { sql } from '../db/index.js';

const activeRideRooms = new Map<string, Set<string>>();
const riderLocations = new Map<string, { latitude: number; longitude: number; updatedAt: Date }>();

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function setupWebSocket(io: SocketIOServer) {
  io.on('connection', async (socket: Socket) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) { socket.disconnect(); return; }

    let userId: string | null = null;
    try {
      const payload = verifyToken(token);
      userId = payload.sub;
    } catch {
      socket.disconnect();
      return;
    }

    socket.on('join-ride', (rideId: string) => {
      socket.join(`ride:${rideId}`);
      if (!activeRideRooms.has(rideId)) activeRideRooms.set(rideId, new Set());
      activeRideRooms.get(rideId)!.add(socket.id);
    });

    socket.on('leave-ride', (rideId: string) => {
      socket.leave(`ride:${rideId}`);
      activeRideRooms.get(rideId)?.delete(socket.id);
    });

    socket.on('join-order', (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    socket.on('leave-order', (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on('join-vendor', (vendorId: string) => {
      socket.join(`vendor:${vendorId}`);
    });

    socket.on('rider-location', async (data: { rideId: string; latitude: number; longitude: number; accuracy?: number }) => {
      const { rideId, latitude, longitude, accuracy } = data;
      riderLocations.set(userId!, { latitude, longitude, updatedAt: new Date() });

      const [ride] = await sql`SELECT pickup_coordinates, dropoff_coordinates FROM rides WHERE id = ${rideId} LIMIT 1`;
      if (ride) {
        const eta = ride.dropoff_coordinates
          ? Math.round(haversineKm(latitude, longitude, ride.dropoff_coordinates.y, ride.dropoff_coordinates.x) / 30 * 60)
          : null;
        io.to(`ride:${rideId}`).emit('RIDER_LOCATION', {
          rideId,
          latitude,
          longitude,
          accuracy,
          eta,
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on('order-location', (data: { orderId: string; latitude: number; longitude: number }) => {
      io.to(`order:${data.orderId}`).emit('ORDER_LOCATION', {
        orderId: data.orderId,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('rider-online', async () => {
      await sql`UPDATE riders SET availability_status = 'ONLINE' WHERE user_id = ${userId}`;
      io.emit('RIDER_ONLINE', { userId });
    });

    socket.on('rider-offline', async () => {
      await sql`UPDATE riders SET availability_status = 'OFFLINE' WHERE user_id = ${userId}`;
      io.emit('RIDER_OFFLINE', { userId });
    });

    socket.on('send-message', (data: { type: string; payload: unknown; rideId?: string; orderId?: string }) => {
      const room = data.rideId ? `ride:${data.rideId}` : data.orderId ? `order:${data.orderId}` : null;
      if (room) io.to(room).emit(data.type, data.payload);
    });

    socket.on('disconnect', () => {
      riderLocations.delete(userId!);
      for (const [rideId, sockets] of activeRideRooms) {
        sockets.delete(socket.id);
        if (sockets.size === 0) activeRideRooms.delete(rideId);
      }
    });
  });
}

export function getRiderLocation(userId: string) {
  return riderLocations.get(userId) || null;
}

export function getNearbyRiders(latitude: number, longitude: number, radiusKm: number = 5) {
  const nearby: { userId: string; latitude: number; longitude: number; distance: number }[] = [];
  for (const [uid, loc] of riderLocations) {
    const distance = haversineKm(latitude, longitude, loc.latitude, loc.longitude);
    if (distance <= radiusKm) {
      nearby.push({ userId: uid, latitude: loc.latitude, longitude: loc.longitude, distance: Math.round(distance * 100) / 100 });
    }
  }
  return nearby.sort((a, b) => a.distance - b.distance);
}
