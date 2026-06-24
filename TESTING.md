# Testing Guide

## Overview

CampGo backend uses pytest for comprehensive testing including unit tests, integration tests, and fixtures for test databases.

## Test Structure

```
backend/tests/
├── conftest.py                 # Shared pytest fixtures and configuration
├── unit/
│   ├── test_auth_service.py    # Authentication service tests
│   └── test_repositories.py    # Repository layer tests
└── integration/
    └── test_api_endpoints.py   # API endpoint integration tests
```

## Setup

### 1. Install Test Dependencies

All test dependencies are already in `requirements.txt`:

```bash
cd backend
pip install -r requirements.txt
```

Key test packages:
- `pytest`: Test framework
- `pytest-asyncio`: Async test support
- `pytest-cov`: Code coverage reporting
- `httpx`: HTTP client for API testing
- `faker`: Fake data generation

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 3. Install Pre-commit Hooks (Optional but Recommended)

```bash
pip install pre-commit
pre-commit install
```

This will automatically run code quality checks before commits.

## Running Tests

### Run All Tests

```bash
pytest
```

### Run Specific Test File

```bash
pytest tests/unit/test_auth_service.py
```

### Run Specific Test Class

```bash
pytest tests/unit/test_auth_service.py::TestAuthService
```

### Run Specific Test

```bash
pytest tests/unit/test_auth_service.py::TestAuthService::test_request_otp
```

### Run Tests with Coverage

```bash
pytest --cov=app --cov-report=html
```

This generates an HTML coverage report in `htmlcov/index.html`

### Run Only Unit Tests

```bash
pytest -m unit
```

### Run Only Integration Tests

```bash
pytest -m integration
```

### Run Tests with Verbose Output

```bash
pytest -v
```

### Run Tests in Parallel (Faster)

Install pytest-xdist:

```bash
pip install pytest-xdist
pytest -n auto
```

### Run with Live Output

```bash
pytest -s
```

## Test Fixtures

### Available Fixtures (from conftest.py)

#### Database Fixtures

- **`test_db`**: Creates in-memory SQLite test database with all tables
- **`db_session`**: Fresh database session for each test

#### User Fixtures

- **`test_user`**: Regular customer user
- **`test_rider`**: Rider user
- **`test_vendor`**: Vendor user

#### Data Fixtures

- **`sample_ride_data`**: Sample ride request data
- **`sample_delivery_data`**: Sample delivery request data
- **`sample_payment_data`**: Sample payment request data

### Using Fixtures

```python
@pytest.mark.asyncio
async def test_example(test_user, sample_ride_data):
    """Test example using fixtures"""
    assert test_user.phone == "+2348012345678"
    assert sample_ride_data["payment_method"] == "CASH"
```

## Test Organization

### Unit Tests (tests/unit/)

Test individual components in isolation:

- **Service tests**: Business logic, validations
- **Repository tests**: Database queries
- **Utility tests**: Helpers, validators

Example:

```python
@pytest.mark.unit
def test_hash_password():
    """Test password hashing"""
    password = "secret123"
    hashed = hash_password(password)
    assert verify_password(password, hashed)
    assert not verify_password("wrong", hashed)
```

### Integration Tests (tests/integration/)

Test API endpoints and workflows:

- **Auth flow**: OTP request, verification, login
- **Ride lifecycle**: Request, accept, complete, rate
- **Payment flow**: Initiate, verify, confirm

Example:

```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_ride_lifecycle(client, test_user, sample_ride_data):
    """Test complete ride flow"""
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
    assert response.json()["status"] == "REQUESTED"
```

## Test Markers

Custom markers for organizing tests:

```python
@pytest.mark.unit           # Unit tests
@pytest.mark.integration    # Integration tests
@pytest.mark.asyncio        # Async tests
@pytest.mark.slow           # Slow tests (optional)
```

Run tests by marker:

```bash
pytest -m "not slow"        # Skip slow tests
pytest -m integration       # Only integration tests
```

## Debugging Tests

### Print Debug Output

```python
def test_example():
    print("Debug output here")
    assert condition
```

Run with `-s` flag:

```bash
pytest -s tests/path/test_file.py
```

### Use Debugger

```python
def test_example():
    import pdb; pdb.set_trace()
    assert condition
```

Or use pytest's built-in debugger:

```bash
pytest --pdb tests/path/test_file.py
```

### Inspect Variables

```python
def test_example(capsys):
    result = some_function()
    captured = capsys.readouterr()
    print(captured.out)
```

## Code Quality

### Format Code with Black

```bash
black app/
```

### Sort Imports with isort

```bash
isort app/
```

### Check Style with Flake8

```bash
flake8 app/
```

### Type Check with mypy

```bash
mypy app/
```

### Run All Quality Checks

```bash
black app/
isort app/
flake8 app/
mypy app/
pytest
```

## Test Database

Tests use an in-memory SQLite database for speed:

```python
@pytest.fixture
async def test_db():
    """Uses SQLite in-memory for fast tests"""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        # ...
    )
```

Benefits:
- ✅ Fast (in-memory)
- ✅ No cleanup needed
- ✅ Isolated per test
- ✅ No port conflicts

## Continuous Integration

Before committing, run:

```bash
pre-commit run --all-files
pytest --cov=app
```

The `.pre-commit-config.yaml` automatically enforces code quality on commit.

## Troubleshooting

### ImportError: No module named 'app'

Make sure you're in the `backend/` directory:

```bash
cd backend
pytest
```

### AsyncIO Event Loop Error

Ensure pytest-asyncio is installed:

```bash
pip install pytest-asyncio
```

### Database Lock Error

This usually means a test didn't clean up properly. Using the in-memory SQLite fixture should prevent this.

### Slow Tests

Use pytest-xdist for parallel execution:

```bash
pip install pytest-xdist
pytest -n auto
```

Or mark slow tests and skip them:

```bash
pytest -m "not slow"
```

## Performance Targets

When writing tests, consider:

- ✅ Unit tests: < 100ms each
- ✅ Integration tests: < 500ms each
- ✅ Total test suite: < 30s (with xdist)

## Best Practices

1. **One assertion per test** (ideally)
2. **Use descriptive test names**
3. **Arrange-Act-Assert pattern**
4. **Use fixtures for setup/teardown**
5. **Mock external dependencies**
6. **Test edge cases and errors**
7. **Keep tests independent**
8. **Don't use real credentials in tests**

Example of good test:

```python
@pytest.mark.asyncio
async def test_request_ride_missing_locations(test_user, client):
    """Test ride request fails without locations"""
    # Arrange
    invalid_data = {"payment_method": "CASH"}
    
    # Act
    response = await client.post(
        "/api/v1/rides/request",
        json=invalid_data,
        params={"user_id": str(test_user.id)},
    )
    
    # Assert
    assert response.status_code == 422  # Validation error
```

## Next Steps

1. Run tests locally: `pytest -v`
2. Check coverage: `pytest --cov=app --cov-report=html`
3. Set up pre-commit: `pre-commit install`
4. Add more tests for new features
5. Monitor coverage: aim for > 80%
