# CampGo Developer Guide (for AI agents)

## Build & Run

```bash
# Install dependencies
cd app && npm install

# Dev (frontend + API)
npm run dev              # starts Vite dev server + nodemon API on :8000

# Lint / typecheck
npm run lint
npm run typecheck

# Tests
npm test                 # vitest (unit/integration)
npm run test -- --coverage

# E2E tests
cd e2e && npm install && npx playwright install --with-deps && npm test

# Docker
docker compose up -d      # full stack
docker compose up -d db   # just database

# Database migrations
npm run db:generate       # generate from schema
npm run db:migrate        # apply pending migrations
npx drizzle-kit push      # push schema directly

# Mobile
cd mobile/campgo && npx react-native run-android  # or run-ios
```

## Project Layout

```
app/              # Main monolith (backend + web frontend)
  server/         # Express API, WebSocket, DB, auth
    api/          # Route handlers (rides, deliveries, food, etc.)
      admin/      # Admin dashboard API
    ws/           # WebSocket handlers
    db/           # Drizzle schema + migrations
    auth/         # JWT auth middleware
  app/            # SolidJS web frontend (TanStack Router)
  public/         # Static assets (PWA service worker)
  tests/          # Vitest test files

mobile/
  campgo/         # React Native app
    src/
      screens/    # UI screens
      components/ # Shared components
      services/   # API client, auth, offline sync
      store/      # Redux Toolkit slices
      navigation/

admin/            # Admin dashboard (React SPA) — stub
e2e/              # Playwright E2E tests
Dockerfile
docker-compose.yml
Makefile
```

## Key Conventions

- **API**: Express routes in `app/server/api/`, registered in `index.ts`
- **DB**: Drizzle ORM with PostgreSQL, schema in `app/server/db/schema.ts`
- **Auth**: JWT in `accessToken` cookie, middleware in `app/server/auth/index.ts`
- **WebSocket**: Socket.IO via `app/server/ws/index.ts` (typing, location sharing, rooms)
- **Mobile state**: Redux Toolkit slices in `mobile/campgo/src/store/slices/`
- **Mobile offline**: SyncService in `mobile/campgo/src/services/offline/SyncService.ts`
- **Color**: Brand primary = `#FF6B35` (orange), used everywhere
- **Testing**: Vitest (unit) in `app/tests/`, Playwright (e2e) in `e2e/`
- **Payments**: Paystack + Flutterwave via `app/server/api/gateway.ts`
- **Proof of delivery**: Photo/signature capture via `app/server/api/deliveryProof.ts`
- **Migrations**: Drizzle Kit in `app/server/db/migrations/`

## API Endpoints

`GET /healthz` — health check
`POST /api/v1/auth/*` — login, register, forgot/reset password, verify email, profile
`GET/POST /api/v1/users/*` — user profiles, settings
`GET/POST /api/v1/rides/*` — rides CRUD + nearby drivers
`GET/POST /api/v1/deliveries/*` — delivery requests + proof of delivery
`GET/POST /api/v1/food/*` — food ordering (restaurants, menu, cart, orders, reviews, recommendations, popular items, deals, search)
`GET/POST /api/v1/wallet/*` — wallet balance, transactions
`GET/POST /api/v1/payments/*` — payment history
`GET/POST /api/v1/rider/*` — driver/rider flow
`GET/POST /api/v1/notifications/*` — push/email/in-app notifications
`GET/POST /api/v1/support/*` — support tickets
`GET/POST /api/v1/navigation/*` — POI search, directions
`GET/POST /api/v1/gateway/*` — Paystack/Flutterwave integration
`GET/POST /api/v1/transport/*` — fleet management, vehicle tracking, drivers, routes
`GET/POST /api/v1/admin/*` — admin dashboard, analytics, settings, fraud alerts

## Tables (54 total in schema)

`users`, `riders`, `vendors`, `user_devices`, `user_sessions`, `user_locations`, `otp_records`,
`rides`, `ride_locations`,
`deliveries`, `delivery_items`, `delivery_stops`, `delivery_proof`,
`transactions`, `wallets`, `wallet_transactions`, `payouts`, `payments`, `refunds`,
`reviews`, `notifications`, `notification_events`, `messages`,
`analytics_events`, `demand_heatmap`, `rider_metrics`, `user_behavior`, `ml_predictions`, `traffic_patterns`,
`audit_logs`, `security_events`, `api_logs`, `fraud_alerts`,
`offline_sync_queue`, `offline_sync_conflicts`, `sync_metadata`,
`system_config`, `region_settings`, `support_tickets`,
`restaurants`, `menu_items`, `cart_items`, `orders`, `order_items`, `order_status_history`,
`referrals`, `kyc_documents`, `promo_redemptions`, `service_areas`, `promo_codes`,
`fleet`, `vehicle_tracking`, `transport_routes`
