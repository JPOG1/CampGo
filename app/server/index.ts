import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import { authRouter } from './api/auth.js';
import { usersRouter } from './api/users.js';
import { ridesRouter } from './api/rides.js';
import { deliveriesRouter } from './api/deliveries.js';
import { deliveryProofRouter } from './api/deliveryProof.js';
import { paymentsRouter } from './api/payments.js';
import { walletRouter } from './api/wallet.js';
import { riderRouter } from './api/rider.js';
import { supportRouter } from './api/support.js';
import { notificationsRouter } from './api/notifications.js';
import { adminRouter } from './api/admin/index.js';
import { foodRouter } from './api/food.js';
import { foodExtraRouter } from './api/foodExtra.js';
import { navigationRouter } from './api/navigation.js';
import { gatewayRouter } from './api/gateway.js';
import { transportRouter } from './api/transport.js';
import { uploadRouter } from './api/upload.js';
import { shopRouter } from './api/shop.js';
import { setupWebSocket } from './ws/index.js';
import { csrfProtection } from './middleware/csrf.js';
import logger from './services/logger.js';
import { initSentry } from './services/sentry.js';
import { testConnection } from './db/index.js';
import { runMigrations } from './db/runMigrations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  initSentry();

  app.set('trust proxy', 1);

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { detail: 'Too many requests, please try again later' },
  });

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(compression());
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : process.env.APPWRITE_FUNCTION === 'true'
      ? true
      : process.env.NODE_ENV === 'production'
        ? true
        : ['http://localhost:5173', 'http://localhost:8000'];
  app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
  const morganSkip = (_req: any, res: any) =>
    process.env.NODE_ENV === 'test' || (process.env.NODE_ENV === 'production' && res.statusCode < 400);
  app.use(morgan(morganFormat, {
    stream: { write: (message: string) => logger.info(message.trim()) },
    skip: morganSkip,
  }));

  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { detail: 'Too many auth attempts, please try again later' },
  });

  app.use('/api/v1/auth', authLimiter, authRouter);

  app.use(csrfProtection);
  app.use('/api/', limiter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/rides', ridesRouter);
  app.use('/api/v1/deliveries', deliveriesRouter);
  app.use('/api/v1/deliveries', deliveryProofRouter);
  app.use('/api/v1/payments', paymentsRouter);
  app.use('/api/v1/wallet', walletRouter);
  app.use('/api/v1/rider', riderRouter);
  app.use('/api/v1/support', supportRouter);
  app.use('/api/v1/food', foodRouter);
  app.use('/api/v1/food', foodExtraRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/navigation', navigationRouter);
  app.use('/api/v1/gateway', gatewayRouter);
  app.use('/api/v1/transport', transportRouter);
  app.use('/api/v1', uploadRouter);
  app.use('/api/v1', shopRouter);

  app.get('/healthz', async (_req, res) => {
    const dbOk = await testConnection();
    const status = dbOk ? 'ok' : 'degraded';
    res.status(dbOk ? 200 : 503).json({
      status,
      database: dbOk ? 'connected' : 'disconnected',
      uptime: process.uptime(),
    });
  });

  // Global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(err.status || err.statusCode || 500).json({
      detail: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error',
    });
  });

  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));

  const uploadsPath = path.resolve(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadsPath));
  app.get('/{*p}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  return app;
}

async function checkRequiredTables() {
  try {
    const { sql } = await import('./db/index.js');
    const result = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const tableNames = result.map((r: any) => r.table_name);
    const required = ['users', 'riders', 'wallets'];
    const missing = required.filter((t) => !tableNames.includes(t));
    if (missing.length > 0) {
      console.warn(`WARNING: Required tables are missing: ${missing.join(', ')}`);
      return false;
    }
    console.log(`Table check passed (${tableNames.length} tables found)`);
    return true;
  } catch (err) {
    console.error('Table check failed:', err);
    return false;
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const hasDbUrl = !!process.env.DATABASE_URL;
  const dbPrefix = hasDbUrl
    ? process.env.DATABASE_URL!.substring(0, process.env.DATABASE_URL!.indexOf('://') + 3) + '***'
    : 'NOT SET';
  console.log(`Starting CampGo server...`);
  console.log(`  DATABASE_URL: ${dbPrefix}`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  PORT: ${process.env.PORT || '8000 (default)'}`);

  if (!hasDbUrl) {
    console.error('FATAL: DATABASE_URL environment variable is required but not set. Exiting.');
    process.exit(1);
  }

  try {
    if (process.env.NODE_ENV !== 'production') {
      await runMigrations();
    }
    await checkRequiredTables();
  } catch (err) {
    console.error('FATAL: Database initialization failed:', err);
    process.exit(1);
  }

  const app = createApp();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    path: '/ws',
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });
  setupWebSocket(io);

  const PORT = process.env.PORT || 8000;
  httpServer.listen(PORT, () => {
    console.log(`CampGo server running on http://localhost:${PORT}`);
  });
}
