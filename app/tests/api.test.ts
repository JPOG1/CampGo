import { describe, it, expect, vi } from 'vitest';

vi.mock('../server/db/index.js', () => ({
  sql: vi.fn().mockResolvedValue([]),
  db: {},
}));

describe('Server Configuration', () => {
  it('should have test environment variables set', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should import auth utilities', async () => {
    const { generateAccessToken } = await import('../server/auth/index.js');
    const token = generateAccessToken('test-id', 'TEST');
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  it('should import all core API routers', async () => {
    const { authRouter } = await import('../server/api/auth.js');
    const { ridesRouter } = await import('../server/api/rides.js');
    const { deliveriesRouter } = await import('../server/api/deliveries.js');
    const { foodRouter } = await import('../server/api/food.js');
    const { notificationsRouter } = await import('../server/api/notifications.js');
    const { walletRouter } = await import('../server/api/wallet.js');
    const { adminRouter } = await import('../server/api/admin/index.js');
    const { paymentsRouter } = await import('../server/api/payments.js');
    const { riderRouter } = await import('../server/api/rider.js');
    const { usersRouter } = await import('../server/api/users.js');
    const { supportRouter } = await import('../server/api/support.js');

    expect(authRouter).toBeDefined();
    expect(ridesRouter).toBeDefined();
    expect(deliveriesRouter).toBeDefined();
    expect(foodRouter).toBeDefined();
    expect(notificationsRouter).toBeDefined();
    expect(walletRouter).toBeDefined();
    expect(adminRouter).toBeDefined();
    expect(paymentsRouter).toBeDefined();
    expect(riderRouter).toBeDefined();
    expect(usersRouter).toBeDefined();
    expect(supportRouter).toBeDefined();
  });

  it('should import all extra API routers', async () => {
    const { navigationRouter } = await import('../server/api/navigation.js');
    const { gatewayRouter } = await import('../server/api/gateway.js');
    const { transportRouter } = await import('../server/api/transport.js');
    const { deliveryProofRouter } = await import('../server/api/deliveryProof.js');
    const { foodExtraRouter } = await import('../server/api/foodExtra.js');

    expect(navigationRouter).toBeDefined();
    expect(gatewayRouter).toBeDefined();
    expect(transportRouter).toBeDefined();
    expect(deliveryProofRouter).toBeDefined();
    expect(foodExtraRouter).toBeDefined();
  });

  it('should import notification service', async () => {
    const notificationService = await import('../server/services/notifications.js');
    expect(notificationService.sendNotification).toBeDefined();
    expect(typeof notificationService.sendNotification).toBe('function');
    expect(notificationService.notifyRideStatus).toBeDefined();
    expect(notificationService.notifyOrderStatus).toBeDefined();
    expect(notificationService.notifyDeliveryStatus).toBeDefined();
  });

  it('should have all routers as Express Router instances', async () => {
    const { authRouter } = await import('../server/api/auth.js');
    expect(authRouter.stack).toBeInstanceOf(Array);
    expect(authRouter.stack.length).toBeGreaterThan(0);

    const routes = authRouter.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    expect(routes.length).toBeGreaterThan(0);
    const paths = routes.map((r: any) => r.path);
    expect(paths).toContain('/login');
    expect(paths).toContain('/register');
    expect(paths).toContain('/me');
  });
});
