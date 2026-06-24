# Development Guide

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py          # Authentication endpoints
│   │       ├── users.py         # User management endpoints
│   │       ├── rides.py         # Ride endpoints
│   │       ├── deliveries.py    # Delivery endpoints
│   │       └── payments.py      # Payment endpoints
│   ├── models/
│   │   ├── user.py              # User-related models
│   │   ├── ride.py              # Ride-related models
│   │   ├── payment.py           # Payment-related models
│   │   ├── security.py          # Security/audit models
│   │   └── notification.py      # Notification models
│   ├── schemas/
│   │   ├── user.py              # User request/response schemas
│   │   ├── ride.py              # Ride schemas
│   │   └── payment.py           # Payment schemas
│   ├── repositories/
│   │   ├── base.py              # BaseRepository with generic CRUD
│   │   ├── user.py              # UserRepository
│   │   ├── ride.py              # RideRepository
│   │   ├── delivery.py          # DeliveryRepository
│   │   ├── payment.py           # PaymentRepository
│   │   └── notification.py      # NotificationRepository
│   ├── services/
│   │   ├── auth.py              # Authentication business logic
│   │   ├── ride.py              # Ride business logic
│   │   ├── delivery.py          # Delivery business logic
│   │   └── payment.py           # Payment business logic
│   ├── websockets/
│   │   ├── manager.py           # WebSocket connection managers
│   │   └── endpoints.py         # WebSocket endpoints
│   ├── tasks/
│   │   ├── celery_app.py        # Celery configuration
│   │   ├── notifications.py     # Notification tasks
│   │   ├── payments.py          # Payment tasks
│   │   ├── email_tasks.py       # Email tasks
│   │   └── analytics.py         # Analytics tasks
│   ├── core/
│   │   ├── config.py            # Settings/environment config
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── security.py          # Authentication utilities
│   │   └── constants.py         # App constants
│   └── main.py                  # FastAPI app initialization
├── alembic/
│   ├── env.py                   # Alembic environment config
│   ├── script.py.mako           # Migration template
│   └── versions/
│       └── 001_initial.py       # Initial migration
├── tests/
│   ├── conftest.py              # Pytest configuration and fixtures
│   ├── unit/
│   │   ├── test_auth_service.py
│   │   └── test_repositories.py
│   └── integration/
│       └── test_api_endpoints.py
├── docker/
│   ├── Dockerfile               # Production-grade Docker image
│   └── postgres_init.sql        # PostgreSQL initialization
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variables template
├── alembic.ini                  # Alembic configuration
├── pytest.ini                   # Pytest configuration
├── Makefile                     # Development commands
└── README.md                    # Backend documentation
```

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────┐
│      API Layer (FastAPI)            │ /api/v1/auth, /api/v1/rides, etc.
├─────────────────────────────────────┤
│      Services Layer                 │ Business logic, validation, orchestration
├─────────────────────────────────────┤
│      Repositories Layer              │ Database abstraction, queries
├─────────────────────────────────────┤
│      Models Layer (SQLAlchemy)      │ Database entities
└─────────────────────────────────────┘
```

### Data Flow Example: Create Ride

```
Client
  ↓ POST /api/v1/rides/request
API Router (rides.py)
  ↓ Validate request
Service (RideService)
  ↓ Business logic
Repository (RideRepository)
  ↓ Query database
Database (PostgreSQL)
  ↓ Return ride
Service
  ↓ Format response
API Router
  ↓ Return JSON
Client
```

## Setting Up Local Development

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### 2. Setup Without Docker

```bash
# Clone the repository
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env

# Run migrations
alembic upgrade head

# Start development server
make dev
```

### 3. Setup With Docker

```bash
# Start all services
make docker-up

# Run migrations
docker-compose exec backend alembic upgrade head

# View logs
make docker-logs
```

## Common Development Tasks

### Running Tests

```bash
# All tests
make test

# Unit tests only
make test-unit

# Integration tests only
make test-int

# With coverage
make test-cov
```

### Code Quality

```bash
# Format code
make format

# Lint code
make lint

# Full quality check
make quality
```

### Database Migrations

```bash
# Run pending migrations
make migrate

# Create new migration
make migrate-new name=add_user_phone_verification
```

### Celery Tasks

```bash
# Start worker
celery -A app.tasks.celery_app worker --loglevel=info

# With Flower monitoring
celery -A app.tasks.celery_app worker --loglevel=info & \
flower -A app.tasks.celery_app --port=5555
```

Visit http://localhost:5555 for task monitoring.

## API Development Guide

### Adding a New Endpoint

1. **Define the model** (if needed):

```python
# app/models/ride.py
class Ride(Base):
    __tablename__ = "rides"
    id = Column(UUID, primary_key=True, default=uuid4)
    status = Column(String, default="REQUESTED")
    # ... more fields
```

2. **Define schemas**:

```python
# app/schemas/ride.py
class RideRequest(BaseModel):
    pickup_location: LocationSchema
    dropoff_location: LocationSchema
    payment_method: str

class RideResponse(BaseModel):
    id: UUID
    status: str
    # ... more fields
```

3. **Create repository methods**:

```python
# app/repositories/ride.py
class RideRepository(BaseRepository):
    async def get_by_user(self, user_id: UUID):
        query = select(Ride).where(Ride.user_id == user_id)
        return await self.session.execute(query)
```

4. **Add service logic**:

```python
# app/services/ride.py
class RideService:
    async def request_ride(self, user_id: UUID, data: RideRequest):
        ride = await self.repository.create(user_id=user_id, **data.dict())
        # Business logic here
        return {"status": "success", "ride_id": str(ride.id)}
```

5. **Create API endpoint**:

```python
# app/api/v1/rides.py
@router.post("/rides/request")
async def request_ride(request: RideRequest, user_id: UUID):
    service = RideService(session)
    result = await service.request_ride(user_id, request)
    return result
```

## Testing Guide

### Unit Test Example

```python
@pytest.mark.unit
def test_hash_password():
    """Test password hashing utility"""
    password = "secure123"
    hashed = hash_password(password)
    
    assert hashed != password
    assert verify_password(password, hashed)
```

### Integration Test Example

```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_ride_request_flow(client, test_user, sample_ride_data):
    """Test complete ride request flow"""
    # Request ride
    response = await client.post(
        "/api/v1/rides/request",
        json=sample_ride_data,
        params={"user_id": str(test_user.id)},
    )
    
    assert response.status_code == 201
    ride_id = response.json()["ride_id"]
    
    # Get ride
    response = await client.get(f"/api/v1/rides/{ride_id}")
    assert response.status_code == 200
```

## Performance Considerations

### Database Queries

1. **Use indexes** on frequently queried columns
2. **Avoid N+1 queries** with eager loading
3. **Use pagination** for large datasets

```python
# Good: Paginated query
rides = await repository.get_all(skip=0, limit=20)

# Bad: Fetch all
all_rides = await repository.get_all()
```

### Caching

Redis is available for caching:

```python
# Set cache
await redis.set(f"ride:{ride_id}", ride_data, ex=3600)

# Get cache
cached = await redis.get(f"ride:{ride_id}")
```

### WebSocket Optimization

- Keep messages small (< 1KB when possible)
- Use binary frames for large payloads
- Implement heartbeat to detect disconnections

## Debugging

### Print Debugging

```python
import logging

logger = logging.getLogger(__name__)
logger.debug(f"Ride status: {ride.status}")
```

### Debugger

```python
import pdb; pdb.set_trace()
```

### Check Logs

```bash
# Docker logs
docker-compose logs -f backend

# Celery worker logs
docker-compose logs -f celery_worker
```

## Environment Variables

Key environment variables in `.env`:

```
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/dbname

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=15

# Celery
CELERY_BROKER_URL=redis://localhost:6379/3
CELERY_RESULT_BACKEND=redis://localhost:6379/4

# Payment Providers
PAYSTACK_SECRET_KEY=...
FLUTTERWAVE_SECRET_KEY=...

# Email
SENDGRID_API_KEY=...
SMTP_HOST=localhost
SMTP_PORT=1025
```

## Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>
```

### Database Connection Error

```bash
# Check PostgreSQL
docker-compose logs postgres

# Verify connection
psql -U campgo -d campgo_db -h localhost
```

### Celery Tasks Not Running

```bash
# Check Redis
redis-cli ping

# Check Celery worker
docker-compose logs celery_worker

# Restart worker
docker-compose restart celery_worker
```

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing (`make test`)
- [ ] No linting errors (`make lint`)
- [ ] Coverage > 80% (`make test-cov`)
- [ ] Environment variables set correctly
- [ ] Database migrations up to date
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Logging configured for production
- [ ] Error tracking (Sentry) configured
- [ ] Performance monitoring configured

## Useful Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Celery Documentation](https://docs.celeryproject.io/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)

## Getting Help

1. Check existing issues/PRs
2. Review BACKEND.md for API documentation
3. Review SECURITY.md for security guidelines
4. Check test examples in `tests/`
5. Ask in project discussions
