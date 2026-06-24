import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('../server/db/index.js', () => ({
  sql: vi.fn().mockResolvedValue([]),
  db: {},
}));

import { sendNotification, notifyRideStatus, notifyOrderStatus, notifyDeliveryStatus } from '../server/services/notifications.js';

describe('Notification Service', () => {
  beforeAll(() => {
    vi.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('should be a function', () => {
      expect(typeof sendNotification).toBe('function');
    });

    it('should return an object with id', async () => {
      const result = await sendNotification({
        userId: 'test-user',
        title: 'Test',
        body: 'Test body',
        type: 'SYSTEM',
        channels: ['in_app'],
      });
      expect(result).toHaveProperty('id');
      expect(typeof result.id).toBe('string');
    });

    it('should work without optional fields', async () => {
      const result = await sendNotification({
        userId: 'test-user',
        title: 'Minimal',
        body: 'Minimal body',
      });
      expect(result).toHaveProperty('id');
    });

    it('should handle all channel types', async () => {
      const result = await sendNotification({
        userId: 'test-user',
        title: 'All Channels',
        body: 'Testing all channels',
        channels: ['in_app', 'push', 'email', 'sms'],
      });
      expect(result).toHaveProperty('id');
    });

    it('should include data payload', async () => {
      const result = await sendNotification({
        userId: 'test-user',
        title: 'With Data',
        body: 'Has data payload',
        data: { key: 'value', nested: { a: 1 } },
      });
      expect(result).toHaveProperty('id');
    });
  });

  describe('notifyRideStatus', () => {
    it('should handle REQUESTED status', async () => {
      const result = await notifyRideStatus('user-1', 'ride-1', 'REQUESTED');
      expect(result).toBeDefined();
    });

    it('should handle ACCEPTED status with driver name', async () => {
      const result = await notifyRideStatus('user-1', 'ride-1', 'ACCEPTED', 'John');
      expect(result).toBeDefined();
    });

    it('should handle all ride statuses', async () => {
      const statuses = ['REQUESTED', 'ACCEPTED', 'RIDER_ARRIVING', 'RIDER_ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      for (const status of statuses) {
        const result = await notifyRideStatus('user-1', 'ride-1', status);
        expect(result, `Failed for status: ${status}`).toBeDefined();
      }
    });

    it('should return undefined for unknown status', async () => {
      const result = await notifyRideStatus('user-1', 'ride-1', 'UNKNOWN_STATUS');
      expect(result).toBeUndefined();
    });
  });

  describe('notifyOrderStatus', () => {
    it('should handle all order statuses', async () => {
      const statuses = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];
      for (const status of statuses) {
        const result = await notifyOrderStatus('user-1', 'order-1', status, 'Test Restaurant');
        expect(result, `Failed for status: ${status}`).toBeDefined();
      }
    });

    it('should work without restaurant name', async () => {
      const result = await notifyOrderStatus('user-1', 'order-1', 'PENDING');
      expect(result).toBeDefined();
    });

    it('should return undefined for unknown status', async () => {
      const result = await notifyOrderStatus('user-1', 'order-1', 'UNKNOWN_STATUS');
      expect(result).toBeUndefined();
    });
  });

  describe('notifyDeliveryStatus', () => {
    it('should handle all delivery statuses', async () => {
      const statuses = ['REQUESTED', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
      for (const status of statuses) {
        const result = await notifyDeliveryStatus('user-1', 'delivery-1', status);
        expect(result, `Failed for status: ${status}`).toBeDefined();
      }
    });

    it('should return undefined for unknown status', async () => {
      const result = await notifyDeliveryStatus('user-1', 'delivery-1', 'UNKNOWN_STATUS');
      expect(result).toBeUndefined();
    });
  });
});
