# CampGo System Architecture

## Table of Contents
1. [Overview](#overview)
2. [Layered Architecture](#layered-architecture)
3. [Component Architecture](#component-architecture)
4. [Data Flow Patterns](#data-flow-patterns)
5. [Scalability & Performance](#scalability--performance)
6. [Deployment Architecture](#deployment-architecture)

---

## Overview

CampGo follows a **layered, modular architecture** optimized for:
- Real-time ride/delivery tracking
- Offline-first mobile experiences
- Horizontal scaling
- AI/ML integration
- Enterprise security

### Architectural Principles

1. **Clean Architecture**: Separation of concerns (Controllers → Services → Repositories → Models)
2. **Dependency Injection**: Loose coupling, easy testing
3. **Event-Driven**: Async processing via message queues
4. **API-First**: RESTful + WebSocket + event streaming
5. **Offline-First**: Local-first with cloud sync
6. **Security-by-Design**: Zero-trust, encryption everywhere

---

## Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│  ┌─────────────────┬─────────────────┬──────────────────────┐  │
│  │  Mobile App     │  Web Dashboard  │  Admin Portal        │  │
│  │  (React Native) │  (Next.js)      │  (React)             │  │
│  └─────────────────┴─────────────────┴──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           △                    △                      △
           │                    │                      │
        HTTP/WS              HTTP/WS                HTTP/WS
           │                    │                      │
           └────────────────────┼──────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────┐
│                    API GATEWAY & ROUTING                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  • Request/Response Transformation                       │   │
│  │  • Authentication & Authorization                        │   │
│  │  • Rate Limiting & Throttling                            │   │
│  │  • Request Logging & Monitoring                          │   │
│  │  • WebSocket Upgrade & Management                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────▲──────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼─────────┐  ┌──────────▼────────┐  ┌──────────▼────────┐
│  REST API Layer │  │ WebSocket Handler │  │ Socket.IO Manager │
│  (v1 Routes)    │  │ (Connection Mgmt) │  │ (Namespaces)      │
└───────┬─────────┘  └──────────┬────────┘  └──────────┬────────┘
        │                       │                      │
        └───────────────────────┼──────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────┐
│                   SERVICE LAYER                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ • Business Logic Implementation                            │  │
│  │ • Data Transformation & Validation                         │  │
│  │ • Orchestration of multiple repositories                   │  │
│  │ • Third-party integration (Payment, Maps, Notifications)   │  │
│  │ • Domain-specific algorithms                               │  │
│  │                                                             │  │
│  │ Services:                                                   │  │
│  │ ├─ AuthService          ├─ LocationService                 │  │
│  │ ├─ UserService          ├─ PaymentService                  │  │
│  │ ├─ RideService          ├─ NotificationService             │  │
│  │ ├─ DeliveryService      ├─ OfflineSyncService              │  │
│  │ ├─ RiderService         ├─ AnalyticsService                │  │
│  │ ├─ DispatchService      ├─ MLService                       │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────────▲──────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────┐
│                 REPOSITORY LAYER (Data Access)                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ • Query Builders & ORM Mapping (SQLAlchemy)                │  │
│  │ • Cache Integration (Redis)                                │  │
│  │ • Transaction Management                                   │  │
│  │ • Database Connection Pooling                              │  │
│  │                                                             │  │
│  │ Repositories:                                               │  │
│  │ ├─ UserRepository        ├─ LocationRepository             │  │
│  │ ├─ RideRepository        ├─ PaymentRepository              │  │
│  │ ├─ DeliveryRepository    ├─ AnalyticsRepository            │  │
│  │ ├─ RiderRepository       ├─ OfflineSyncRepository          │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────────▲──────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼──────────┐  ┌─────────▼────────┐  ┌──────────▼────────┐
│  PostgreSQL      │  │  Redis Cache     │  │ File Storage      │
│  + PostGIS       │  │  Session Store   │  │ (S3-compatible)   │
│  (Primary DB)    │  │  Queue Broker    │  │                   │
└──────────────────┘  └──────────────────┘  └───────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│            CROSS-CUTTING CONCERNS (Middlewares)                   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ • Authentication & JWT Validation                          │   │
│  │ • Authorization & RBAC                                      │   │
│  │ • Request/Response Logging                                  │   │
│  │ • Error Handling & Exception Mapping                        │   │
│  │ • Security Headers & CORS                                   │   │
│  │ • Rate Limiting & Circuit Breaker                           │   │
│  │ • Distributed Tracing                                       │   │
│  │ • Performance Monitoring                                    │   │
│  └────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│            ASYNC & BACKGROUND PROCESSING                          │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ • Celery Task Queue (Redis Broker)                          │   │
│  │ • Event Publishing (Domain Events)                          │   │
│  │ • Webhook Processing                                        │   │
│  │ • Email/SMS/Push Notifications                              │   │
│  │ • Analytics Event Processing                                │   │
│  │ • Offline Sync Queue Processing                             │   │
│  │ • Scheduled Jobs (Cleanup, Reports, Analytics)              │   │
│  └────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Core Components

#### 1. **Authentication & Authorization**
```
┌──────────────────────────────────────┐
│     Authentication Component         │
├──────────────────────────────────────┤
│ • Phone OTP Verification             │
│ • JWT Token Generation & Validation  │
│ • Refresh Token Rotation             │
│ • Device Fingerprinting              │
│ • Session Management                 │
│ • OAuth Readiness (Placeholder)      │
│ • Secure Password Hashing (bcrypt)   │
│ • Token Blacklisting (Redis)         │
│ • IP-based Rate Limiting             │
└──────────────────────────────────────┘

Flow:
  1. User submits phone number
  2. OTP sent via SMS
  3. OTP verified, JWT + refresh token issued
  4. Device info stored
  5. Tokens stored in Redis session store
  6. Refresh tokens validated & rotated on use
```

#### 2. **Ride Management**
```
┌──────────────────────────────────────┐
│      Ride Management Component       │
├──────────────────────────────────────┤
│ • Ride Request Creation              │
│ • Smart Rider Matching               │
│ • Real-time Tracking                 │
│ • Status Transitions                 │
│ • Fare Calculation                   │
│ • Rating & Reviews                   │
│ • Ride History                       │
│ • Cancellation Handling              │
└──────────────────────────────────────┘

State Machine:
  REQUESTED 
    ↓
  ACCEPTED (rider accepts ride)
    ↓
  RIDER_ARRIVING (rider on the way)
    ↓
  RIDER_ARRIVED (rider reached pickup)
    ↓
  IN_PROGRESS (ride started)
    ↓
  COMPLETED (ride finished)
    or
  CANCELLED (any time before COMPLETED)
  or
  NO_SHOW (rider/user no-show)
```

#### 3. **Delivery Management**
```
┌──────────────────────────────────────┐
│   Delivery Management Component      │
├──────────────────────────────────────┤
│ • Multi-category Support             │
│ • Order Creation & Tracking          │
│ • Multi-stop Deliveries              │
│ • Delivery Proof (photo/signature)   │
│ • Delivery History                   │
│ • Multi-vendor Support               │
│ • Vendor Order Management            │
└──────────────────────────────────────┘

Categories: Food, Grocery, Parcel, Medication, Documents, Convenience
```

#### 4. **Real-time Communication**
```
┌─────────────────────────────────────────────┐
│     Real-time Component                     │
├─────────────────────────────────────────────┤
│ • WebSocket Connection Management           │
│ • Socket.IO Namespaces & Rooms              │
│ • Presence Tracking (Redis)                 │
│ • Typing Indicators                         │
│ • Live Location Streaming                   │
│ • Ride Status Updates                       │
│ • In-app Notifications                      │
│ • Emergency Alerts Broadcasting             │
│ • Connection Fallback (HTTP Long Polling)   │
└─────────────────────────────────────────────┘

Events:
  • ride.requested
  • ride.accepted
  • rider.location_updated
  • delivery.status_changed
  • payment.completed
  • notification.received
  • emergency.alert
```

#### 5. **Offline Sync Engine**
```
┌──────────────────────────────────────┐
│   Offline Sync Component             │
├──────────────────────────────────────┤
│ • Local Request Queuing              │
│ • Automatic Sync on Reconnect        │
│ • Conflict Detection & Resolution    │
│ • Exponential Backoff Retry          │
│ • Last-Write-Wins Strategy           │
│ • Optimistic Updates UI              │
│ • Sync Status Tracking               │
│ • Local Cache Management             │
└──────────────────────────────────────┘

Sync Flow:
  1. User performs action offline
  2. Action queued locally with timestamp
  3. When connection restored, sync service initiates
  4. Queue items sent to server
  5. Conflicts detected via version comparison
  6. Resolved using conflict strategy
  7. Local state updated with server response
  8. Sync metadata updated
```

#### 6. **Payment Processing**
```
┌──────────────────────────────────────┐
│    Payment Processing Component      │
├──────────────────────────────────────┤
│ • Payment Provider Abstraction       │
│ • Transaction Logging                │
│ • Payment Verification               │
│ • Wallet Management                  │
│ • Rider Earnings Tracking            │
│ • Commission Calculation             │
│ • Refund Processing                  │
│ • Webhook Handling                   │
│ • PCI Compliance                     │
└──────────────────────────────────────┘

Providers: Paystack, Flutterwave (Stripe ready)
Transaction Flow:
  1. Ride/Delivery completed
  2. Fare calculated
  3. Payment initiated with provider
  4. Webhook received with status
  5. Transaction recorded
  6. Rider earnings updated
  7. User receipt sent
```

#### 7. **Analytics & ML**
```
┌──────────────────────────────────────┐
│    Analytics & ML Component          │
├──────────────────────────────────────┤
│ • Event Collection                   │
│ • Demand Heatmap Generation          │
│ • Rider Performance Metrics          │
│ • Traffic Pattern Analysis           │
│ • Demand Prediction (Placeholder)    │
│ • Smart Dispatch AI (Placeholder)    │
│ • ETA Prediction (Placeholder)       │
│ • Congestion Forecasting (Placeholder)
│ • Churn Risk Scoring (Placeholder)   │
│ • Fraud Detection (Placeholder)      │
└──────────────────────────────────────┘

Analytics Pipeline:
  Events → Collection → Processing → Storage → Analytics → BI
```

---

## Data Flow Patterns

### Pattern 1: Ride Booking Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER MOBILE APP                          │
│  1. User enters pickup/dropoff locations                   │
│  2. App calculates estimated fare via API                  │
│  3. User confirms and submits ride request                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ POST /api/v1/rides (JSON + JWT)
                           ↓
┌──────────────────────────────────────────────────────────────┐
│                   FASTAPI BACKEND                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. AuthMiddleware validates JWT                     │   │
│  │ 2. RateLimit middleware checks quota                │   │
│  │ 3. Route handler receives request                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 4. RideService.create_ride_request()                │   │
│  │    ├─ Validate input data                           │   │
│  │    ├─ Calculate actual fare (business logic)        │   │
│  │    ├─ Check user eligibility                        │   │
│  │    └─ Create ride record                            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 5. RideRepository.create_ride()                     │   │
│  │    ├─ Insert into PostgreSQL                        │   │
│  │    ├─ Update cache (Redis)                          │   │
│  │    └─ Return ride object                            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 6. Publish "ride.requested" domain event            │   │
│  │    → Async tasks (notifications, analytics)         │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 7. Start DispatchService.match_riders()             │   │
│  │    ├─ Query PostGIS for nearby riders               │   │
│  │    ├─ Rank riders (distance, rating, availability)  │   │
│  │    ├─ Generate offers                               │   │
│  │    └─ Emit WebSocket offer events                   │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬───────────────────────────────────────┘
                       │ 
        ┌──────────────┴──────────────┐
        │                             │
        │ WebSocket Event            │ Redis Cache Updated
        │ ride.requested             │ + Analytics Event
        │                            │
        ↓                            ↓
┌───────────────────┐         ┌────────────────┐
│ User's Device     │         │ Rider Devices  │
│ Receives Update   │         │ Receive Offers │
└───────────────────┘         └────────────────┘
        │                           │
        │                    Rider accepts
        │                           │
        └─────────────┬─────────────┘
                      │ POST /api/v1/rides/{id}/accept
                      ↓
              Backend updates ride status
              Broadcasts ride.accepted event
              Sends notification to user
              Updates analytics
              Triggers next state (RIDER_ARRIVING)
```

### Pattern 2: Offline Sync Flow

```
┌──────────────────────────────────────────────────┐
│              MOBILE APP (OFFLINE)                │
│  ┌──────────────────────────────────────────┐   │
│  │ 1. User attempts ride request            │   │
│  │ 2. Network detection: No internet        │   │
│  │ 3. LocalDB stores request with:          │   │
│  │    ├─ Entity: ride_request               │   │
│  │    ├─ Operation: CREATE                  │   │
│  │    ├─ Payload: ride data                 │   │
│  │    ├─ Status: PENDING                    │   │
│  │    ├─ Device version: 1                  │   │
│  │    └─ Timestamp: local_time              │   │
│  │ 4. UI shows "Offline - Will sync later"  │   │
│  │ 5. SyncEngine.addToQueue()                │   │
│  │ 6. BackgroundWorker starts retry timer   │   │
│  └──────────────────────────────────────────┘   │
└──────────────────┬───────────────────────────────┘
                   │
        Internet restored
                   │
                   ↓
┌──────────────────────────────────────────────────┐
│         SYNC ENGINE INITIATES                    │
│  ┌──────────────────────────────────────────┐   │
│  │ 1. Check pending items in queue          │   │
│  │ 2. Build batch sync payload              │   │
│  │ 3. POST /api/v1/sync (with versions)     │   │
│  └──────────────────────────────────────────┘   │
└──────────────────┬───────────────────────────────┘
                   │
                   ↓
┌────────────────────────────────────────────────────────────┐
│              BACKEND SYNC HANDLER                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Receive sync batch from device                    │  │
│  │ 2. For each operation:                               │  │
│  │    ├─ Check server version vs device version        │  │
│  │    ├─ If match: Apply operation                     │  │
│  │    ├─ If conflict: Store in conflicts table         │  │
│  │    └─ If newer server: Use server version           │  │
│  │ 3. Generate response with:                          │  │
│  │    ├─ Applied items (with server IDs)               │  │
│  │    ├─ Conflicts (with server data)                  │  │
│  │    ├─ New server version                            │  │
│  │    └─ Sync metadata                                 │  │
│  │ 4. Return 200 OK with complete state                │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────┐
│         MOBILE APP RECEIVES RESPONSE             │
│  ┌──────────────────────────────────────────┐   │
│  │ 1. Update local queue with result        │   │
│  │ 2. Mark applied items as SYNCED          │   │
│  │ 3. Handle conflicts:                     │   │
│  │    ├─ If auto-resolvable: RESOLVE        │   │
│  │    ├─ If manual needed: NOTIFY USER      │   │
│  │ 4. Update local state with server data   │   │
│  │ 5. Clear cache for affected entities     │   │
│  │ 6. Update UI with confirmed state        │   │
│  │ 7. Mark sync as complete                 │   │
│  │ 8. Update sync metadata:                 │   │
│  │    ├─ last_sync_timestamp                │   │
│  │    ├─ pending_count: 0                   │   │
│  │    └─ sync_status: IDLE                  │   │
│  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

---

## Scalability & Performance

### Caching Strategy

```
┌─────────────────────────────────────┐
│     CACHE HIERARCHY                 │
├─────────────────────────────────────┤
│                                     │
│  Level 1: In-Memory (FastAPI)       │
│  ├─ LRU Cache (3-5 min TTL)         │
│  ├─ Endpoint cache for expensive ops│
│  └─ ~100 MB per instance            │
│                                     │
│  Level 2: Redis (Distributed)       │
│  ├─ User sessions (1 hour)          │
│  ├─ User data (30 min)              │
│  ├─ Ride data (10 min)              │
│  ├─ Heatmap data (60 min)           │
│  ├─ Rate limit counters (1 min)     │
│  ├─ Presence info (real-time)       │
│  ├─ Availability: ~20 GB            │
│  └─ Cluster ready                   │
│                                     │
│  Level 3: Database (PostgreSQL)     │
│  ├─ Source of truth                 │
│  ├─ Persistent storage              │
│  ├─ Optimized with indexes          │
│  └─ Read replicas for analytics     │
│                                     │
└─────────────────────────────────────┘
```

### Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| API Response Time (p95) | < 200ms | Caching, CDN, async processing |
| WebSocket Message Latency | < 100ms | Direct connection, Redis pub/sub |
| Database Query (p95) | < 100ms | Indexing, denormalization |
| Ride Booking to Match | < 5 sec | Geospatial indexing, caching |
| Location Update Frequency | 5-10 sec | Batch writes, async queue |
| Concurrent Users | 10,000+ | Load balancing, connection pooling |
| Requests/Second | 5,000+ | Horizontal scaling, caching |

### Horizontal Scaling

```
┌─────────────────────────────────────────────────────────┐
│                  LOAD BALANCER                          │
│                  (Nginx/HAProxy)                        │
└──────────┬──────────┬──────────┬──────────┬─────────────┘
           │          │          │          │
    ┌──────▼──┐ ┌────▼─────┐ ┌──▼──────┐ ┌▼──────────┐
    │ FastAPI │ │ FastAPI  │ │ FastAPI │ │ FastAPI   │
    │Instance1│ │Instance2 │ │Instance3│ │Instance4  │
    └─────────┘ └──────────┘ └─────────┘ └───────────┘
           │          │          │          │
           └──────────┬──────────┬──────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
    ┌────▼────┐             ┌─────▼──────┐
    │PostgreSQL│             │Redis Cluster│
    │Read Rep  │             │+ Sentinel   │
    │          │             │             │
    └──────────┘             └─────────────┘
```

---

## Deployment Architecture

### Multi-Environment Setup

```
┌────────────────────────────────────────────────────────────┐
│              LOCAL DEVELOPMENT                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ docker-compose.yml                                   │ │
│  │ ├─ FastAPI dev server                               │ │
│  │ ├─ PostgreSQL (local)                               │ │
│  │ ├─ Redis (dev)                                      │ │
│  │ ├─ Mailhog (email testing)                          │ │
│  │ └─ Mobile emulator                                  │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│              STAGING ENVIRONMENT                          │
│  ├─ Docker containers                                     │
│  ├─ AWS RDS PostgreSQL                                    │
│  ├─ AWS ElastiCache Redis                                │
│  ├─ S3 for file storage                                   │
│  ├─ CloudFront CDN                                        │
│  ├─ SNS/SQS for queues                                    │
│  └─ SSL certificates                                      │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│              PRODUCTION ENVIRONMENT                        │
│  ├─ Kubernetes cluster (EKS/GKE)                          │
│  ├─ PostgreSQL RDS (Multi-AZ)                            │
│  ├─ Redis Cluster (ElastiCache)                          │
│  ├─ S3 + CloudFront                                       │
│  ├─ Load Balancer (ALB)                                   │
│  ├─ Auto-scaling (HPA)                                    │
│  ├─ Monitoring (CloudWatch/Prometheus)                   │
│  ├─ Logging (ELK/CloudWatch Logs)                        │
│  └─ Backup & Disaster Recovery                           │
└────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### External Services

```
┌─────────────────────────────────────────────────────────┐
│                   CampGo Platform                       │
└──────────────┬──────────────┬──────────┬────────────────┘
               │              │          │
       ┌───────▼──┐    ┌──────▼─┐   ┌───▼────────┐
       │ Mapbox   │    │Firebase│   │Payment     │
       │(Maps/Geo)│    │(FCM)   │   │Providers   │
       │Routing   │    │Push    │   │(Paystack)  │
       │Geocoding │    │Notif   │   │(Flutterwave)
       └──────────┘    └────────┘   └────────────┘
                │           │            │
         Geolocation  Push Notifications  Payments
         Services        Services         Services
```

---

## Next Steps

1. **Backend Code Generation**: FastAPI structure & core services
2. **Database Migration Scripts**: Alembic setup
3. **API Documentation**: OpenAPI/Swagger specs
4. **Testing Infrastructure**: Unit & integration tests
5. **DevOps Setup**: Docker & CI/CD pipelines
