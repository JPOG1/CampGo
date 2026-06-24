# CampGo Architecture Documentation

## Overview

This directory contains comprehensive architectural documentation for the CampGo smart mobility and logistics platform.

## Contents

### System Design
- **[system_design.md](./system_design.md)** - High-level system architecture, layered design, component interactions
- **[database_schema.md](./database_schema.md)** - Complete ER diagrams, table schemas, relationships, indexing strategy

### API Design
- **[api_design.md](./api_design.md)** - RESTful API structure, endpoint specifications, request/response formats *(Pending)*

### Real-time Communication
- **[realtime.md](./realtime.md)** - WebSocket architecture, Socket.IO setup, presence tracking *(Pending)*

### Microservices
- **[microservices.md](./microservices.md)** - Service boundaries, domain-driven design, inter-service communication *(Pending)*

### Scaling & Performance
- **[scaling.md](./scaling.md)** - Horizontal scaling strategies, caching tiers, load balancing, database sharding *(Pending)*

## Key Architectural Principles

### 1. Clean Architecture
```
┌─────────────────────────────────────┐
│     Presentation Layer              │
│  (Controllers, Routes, Views)       │
├─────────────────────────────────────┤
│     Application Layer               │
│  (Use Cases, Business Logic)        │
├─────────────────────────────────────┤
│     Domain Layer                    │
│  (Entities, Value Objects)          │
├─────────────────────────────────────┤
│     Infrastructure Layer            │
│  (Databases, External Services)     │
└─────────────────────────────────────┘
```

### 2. Offline-First Design
- Local-first operations (SQLite on mobile)
- Automatic sync when connected
- Conflict resolution strategies
- Transparent to users

### 3. Real-time Capabilities
- WebSocket connections (Socket.IO)
- Event-driven architecture
- Presence tracking
- Live updates (rides, deliveries, location)

### 4. Security-by-Design
- Zero-trust architecture
- Defense-in-depth
- Encryption (in-transit and at-rest)
- OWASP compliance
- Audit logging

### 5. Scalability
- Stateless API servers
- Redis caching layer
- Database read replicas
- Horizontal scaling ready
- Async task processing

### 6. AI/ML Ready
- Event collection infrastructure
- Analytics pipeline
- Prediction placeholders
- ML schema preparation

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Database**: PostgreSQL 15+ with PostGIS
- **Cache**: Redis 7+
- **Queues**: Celery + Redis
- **Real-time**: Socket.IO + WebSocket

### Mobile
- **Framework**: React Native + Expo
- **State**: Zustand
- **Local DB**: SQLite/RealmDB
- **HTTP**: Axios
- **Real-time**: Socket.IO client

### Web
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **UI**: Shadcn UI
- **State**: TanStack Query + Zustand

### DevOps
- **Containers**: Docker
- **Orchestration**: Docker Compose (dev), Kubernetes (prod)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana (ready)

## Data Flow Examples

### Ride Booking Flow
```
User Request → API Validation → Business Logic → Database
                    ↓
               Event Publish → Async Tasks (Analytics, Notifications)
                    ↓
         WebSocket Broadcast → Real-time Update to UI
```

### Offline Sync Flow
```
Offline Operation → Local Storage → Queue
                        ↓
            Connection Restored
                        ↓
          Sync Engine → Server → Conflict Detection
                        ↓
              Resolution Applied → Local Update
```

## Deployment Architecture

### Local Development
- Docker Compose orchestration
- Single instance of each service
- Suitable for development and testing

### Staging
- AWS EC2 instances
- RDS PostgreSQL
- ElastiCache Redis
- S3 for file storage
- CloudFront CDN

### Production
- Kubernetes cluster (EKS/GKE)
- Multi-AZ RDS
- Redis cluster
- Load balancing
- Auto-scaling
- Monitoring & alerting

## API Versioning

All APIs are versioned under `/api/v1/`:
- **v1**: Current stable API
- **v2**: (Planned) Future improvements without breaking v1

Backward compatibility is maintained during transitions.

## Authentication

- **Primary**: JWT tokens (15-minute expiry)
- **Refresh**: Refresh tokens (7-day expiry)
- **MFA**: OTP via SMS
- **Session**: Tracked in Redis
- **Device**: Fingerprinting for security

## Caching Strategy

### L1: In-Memory Cache
- TTL: 3-5 minutes
- Per-instance
- Fast access

### L2: Redis Distributed Cache
- TTL: 30 minutes
- Shared across instances
- User sessions, config, API responses

### L3: Database
- Source of truth
- Optimized with indexes
- Read replicas for analytics

## Monitoring & Observability

### Logging
- Structured JSON logging
- Centralized log aggregation
- Request tracing
- Security event logging

### Metrics
- Request latency (p50, p95, p99)
- Error rates
- Cache hit ratios
- Database query performance

### Alerting
- Anomaly detection
- Threshold-based alerts
- On-call integration

## Security Audit Checklist

- [x] OWASP Top 10 compliance
- [x] Authentication (JWT + OTP)
- [x] Authorization (RBAC)
- [x] Encryption (TLS, at-rest)
- [x] Input validation
- [x] SQL injection prevention
- [x] CSRF protection
- [x] Rate limiting
- [x] Audit logging
- [ ] Penetration testing (ongoing)

## Next Steps

1. **API Documentation**: Generate OpenAPI specs
2. **Integration Tests**: Comprehensive test coverage
3. **Load Testing**: Performance benchmarks
4. **Security Audit**: Third-party penetration testing
5. **Deployment**: CI/CD pipeline setup
6. **Monitoring**: Prometheus + Grafana setup

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy ORM](https://www.sqlalchemy.org/)
- [PostGIS Documentation](https://postgis.net/)
- [Socket.IO Guide](https://socket.io/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Twelve-Factor App](https://12factor.net/)

---

**Last Updated**: May 2026
**Maintained By**: CampGo Team
