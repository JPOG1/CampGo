# CampGo Security Architecture & Guidelines

## Table of Contents
1. [Security Overview](#security-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Protection](#data-protection)
4. [API Security](#api-security)
5. [Infrastructure Security](#infrastructure-security)
6. [Compliance Checklist](#compliance-checklist)

---

## Security Overview

CampGo implements **defense-in-depth** security with:
- Zero-trust architecture
- Encryption everywhere (in-transit & at-rest)
- OWASP Top 10 compliance
- Secure-by-default configuration
- Audit logging & threat detection

### Security Principles
1. **Least Privilege**: Minimal necessary permissions
2. **Defense in Depth**: Multiple security layers
3. **Fail Secure**: Defaults deny access
4. **Security Through Transparency**: Code reviews, audits
5. **Continuous Monitoring**: Real-time threat detection

---

## Authentication & Authorization

### 1. Authentication Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. Submit phone number
       ▼
┌──────────────────────────┐
│   Backend                │
│ 1. Generate OTP          │
│ 2. Store in Redis (5min) │
│ 3. Send via SMS          │
└──────┬───────────────────┘
       │
       │ 2. User receives SMS
       │
       ▼
┌──────────────────────────┐
│   User enters OTP        │
└──────┬───────────────────┘
       │ 3. Submit OTP
       ▼
┌──────────────────────────────────────┐
│   Backend OTP Verification           │
│ 1. Check OTP in Redis                │
│ 2. Validate timing (not expired)     │
│ 3. Validate attempt count (≤3)       │
│ 4. OTP matches? YES                  │
│ 5. Generate tokens                   │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│   Token Generation                   │
│ 1. Create JWT access token (15 min)  │
│ 2. Create refresh token (7 days)     │
│ 3. Store refresh token in Redis      │
│ 4. Return both tokens                │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│   Client Storage                     │
│ 1. Access token → Secure Storage     │
│ 2. Refresh token → Secure Storage    │
│ 3. Device fingerprint → localStorage │
└──────────────────────────────────────┘
```

### 2. JWT Token Structure

```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "sub": "user-uuid",
  "user_id": "user-uuid",
  "role": "USER",
  "phone": "+2348012345678",
  "device_id": "device-fingerprint",
  "iat": 1700000000,
  "exp": 1700000900,
  "iss": "campgo-api",
  "aud": ["mobile", "web"]
}

Signature: HMAC-SHA256(header + payload, secret_key)
```

### 3. Refresh Token Rotation

```
Client: POST /api/v1/auth/refresh
├─ Send: { refresh_token, device_id }
│
Backend:
├─ 1. Validate refresh token signature
├─ 2. Check if token blacklisted (Redis)
├─ 3. Verify device fingerprint matches
├─ 4. Check token hasn't expired
├─ 5. If valid:
│     ├─ Generate new access token
│     ├─ Generate new refresh token
│     ├─ Blacklist old refresh token
│     ├─ Store new refresh token in Redis
│     └─ Return new tokens
│
├─ 6. If invalid:
│     ├─ Log security event
│     ├─ Increment failed attempt counter
│     ├─ If attempts > 5 → Require re-login
│     └─ Return 401 Unauthorized
```

### 4. Role-Based Access Control (RBAC)

```
Roles:
├─ USER (End user - rides, deliveries)
├─ RIDER (Driver - accept rides, make money)
├─ VENDOR (Business - manage deliveries)
└─ ADMIN (Admin - platform management)

Resource-Level Permissions:
┌─────────────────────────────────┐
│ Resource: /rides/{ride_id}      │
├─────────────────────────────────┤
│ GET    │ USER: own ride         │
│        │ RIDER: assigned ride   │
│        │ ADMIN: any ride        │
├─────────────────────────────────┤
│ UPDATE │ RIDER: accept/complete │
│        │ ADMIN: any update      │
├─────────────────────────────────┤
│ DELETE │ ADMIN: only            │
└─────────────────────────────────┘

Implementation:
@app.get("/rides/{ride_id}")
@require_auth(permissions=["ride:read"])
async def get_ride(ride_id: str, current_user: User):
    ride = await ride_repo.get(ride_id)
    
    # Authorization check
    if current_user.role == "USER":
        if ride.user_id != current_user.id:
            raise HTTPException(403, "Forbidden")
    elif current_user.role == "RIDER":
        if ride.rider_id != current_user.id:
            raise HTTPException(403, "Forbidden")
    
    return ride
```

---

## Data Protection

### 1. Encryption at Rest

```
PostgreSQL:
├─ Transparent Data Encryption (TDE)
├─ Full disk encryption (OS level)
├─ Encrypted backups
└─ Key rotation: monthly

Redis:
├─ Encrypted cache (at rest)
├─ No persistent sensitive data
└─ In-memory only (cleared on restart)

File Storage (S3):
├─ Server-Side Encryption (SSE-S3)
├─ Per-file encryption possible
├─ KMS key management
└─ Key rotation: annual

Client Storage (Mobile):
├─ Encrypted preferences (iOS Keychain)
├─ Encrypted database (SQLCipher)
├─ No plain-text tokens
└─ Device-locked encryption
```

### 2. Encryption in Transit

```
HTTPS/TLS 1.2+:
├─ All API endpoints
├─ Certificate pinning (mobile)
├─ Perfect forward secrecy
├─ Strong cipher suites only
└─ HSTS enabled

WebSocket Secure (WSS):
├─ TLS encryption
├─ Same certificate as HTTPS
└─ Certificate validation

Mobile-to-Backend:
├─ HTTPS with certificate pinning
├─ TLS 1.2+ minimum
└─ Reject self-signed certs
```

### 3. Sensitive Data Handling

```
Data Classification:
┌──────────────────────────────────────┐
│ Classification │ Treatment           │
├──────────────────────────────────────┤
│ PII            │ • Encrypted at rest │
│ (Phone, Email) │ • Masked in logs    │
│                │ • Access logged     │
│                │ • Retention: 3 yrs  │
├──────────────────────────────────────┤
│ Payment Data   │ • Never stored      │
│ (Card)         │ • Token only        │
│                │ • PCI DSS compliant │
│                │ • Third-party only  │
├──────────────────────────────────────┤
│ Location Data  │ • Encrypted         │
│ (GPS)          │ • Aggregate only    │
│                │ • Real-time expires │
│                │ • User consent      │
├──────────────────────────────────────┤
│ Documents      │ • Scanned only      │
│ (ID, License)  │ • Encrypted file    │
│                │ • Deleted after 90d │
│                │ • Audit logged      │
└──────────────────────────────────────┘

Redaction in Logs:
├─ Phone numbers → +234****5678
├─ Email → user@*****.com
├─ Card numbers → ****-****-****-1234
├─ API keys → sk_test_****...
└─ Tokens → jwt_****...
```

### 4. Secure Password Policy

```
Requirements:
├─ Minimum 12 characters
├─ Mix of uppercase, lowercase, numbers, symbols
├─ Not in common password list
├─ Not user's personal info
└─ Change required every 90 days (admin)

Hashing:
├─ Algorithm: bcrypt (industry standard)
├─ Cost factor: 12 (balance security/speed)
├─ Salt: automatic per-password
└─ NO plain-text storage EVER

Implementation:
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

hash = pwd_context.hash(password)
verify = pwd_context.verify(password, hash)
```

---

## API Security

### 1. Rate Limiting

```
Strategy: Token Bucket with Redis

Authentication Endpoints:
├─ /auth/otp: 5 requests per 10 minutes per phone
├─ /auth/verify: 3 attempts per OTP
├─ /auth/refresh: 10 requests per minute per user
└─ Account lockout after 5 failed attempts

General API:
├─ Unauthenticated: 60 req/hour per IP
├─ Authenticated: 1000 req/hour per user
├─ Burst: 100 req/minute per user
└─ Admin: Unlimited (optional)

Backend Implementation:
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    key = f"rate_limit:{get_identifier(request)}"
    current = redis.incr(key)
    
    if current == 1:
        redis.expire(key, 60)  # 1 minute window
    
    if current > RATE_LIMIT:
        return JSONResponse(429, {"error": "Too many requests"})
    
    return await call_next(request)
```

### 2. Input Validation

```
All Input → Validation → Sanitization → Processing

Validation Rules:
├─ Schema validation (Pydantic)
├─ Type checking (string, int, float, bool)
├─ Length limits (prevent buffer overflow)
├─ Pattern matching (regex for format)
├─ Range validation (min/max values)
└─ Whitelist validation (known values only)

Example:
from pydantic import BaseModel, validator

class RideRequest(BaseModel):
    pickup_lat: float = Field(..., ge=-90, le=90)
    pickup_lng: float = Field(..., ge=-180, le=180)
    dropoff_lat: float = Field(..., ge=-90, le=90)
    dropoff_lng: float = Field(..., ge=-180, le=180)
    
    @validator('pickup_lat', 'pickup_lng')
    def validate_coordinates(cls, v):
        # Custom validation logic
        return v
    
    class Config:
        max_anystr_length = 1000
```

### 3. SQL Injection Prevention

```
NEVER use string concatenation:
❌ query = f"SELECT * FROM users WHERE id = {user_id}"

ALWAYS use parameterized queries:
✅ query = "SELECT * FROM users WHERE id = :user_id"
   result = db.execute(query, {"user_id": user_id})

With SQLAlchemy ORM:
✅ user = db.query(User).filter(User.id == user_id).first()

Prevention Verified By:
├─ Code review (all queries)
├─ Automated scanning (SAST)
├─ Penetration testing
└─ Database audit logs
```

### 4. CSRF Protection

```
Token-Based CSRF:
1. Server generates CSRF token
2. Token stored in session (Redis)
3. Token sent to client in form/cookie
4. Client includes token in state-changing request (POST/PUT/DELETE)
5. Server validates token matches session

Implementation:
@app.post("/api/v1/rides")
async def create_ride(
    request: Request,
    ride_data: RideRequest,
    current_user: User = Depends(get_current_user)
):
    # CSRF token automatically validated by middleware
    # If missing or invalid → 403 Forbidden
    return await ride_service.create(ride_data)
```

### 5. CORS Configuration

```
Allowed Origins:
├─ https://app.campgo.io (production web)
├─ https://admin.campgo.io (admin portal)
├─ Localhost:3000 (local development)
└─ Mobile: Native app (no CORS check needed)

Allowed Methods:
├─ GET, POST, PUT, DELETE, OPTIONS
└─ No CONNECT, TRACE

Allowed Headers:
├─ Authorization
├─ Content-Type
├─ X-Device-ID
└─ Custom app headers

Credentials:
├─ Allow credentials (for cookies if used)
├─ Preflight cache: 3600 seconds
└─ No wildcard origin with credentials

Implementation:
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
    max_age=3600,
)
```

### 6. Security Headers

```
HTTP Response Headers:

├─ Strict-Transport-Security: max-age=31536000; includeSubDomains
│  └─ Force HTTPS for 1 year
│
├─ Content-Security-Policy: default-src 'self'; script-src 'self'
│  └─ Prevent XSS attacks
│
├─ X-Content-Type-Options: nosniff
│  └─ Prevent MIME sniffing
│
├─ X-Frame-Options: DENY
│  └─ Prevent clickjacking
│
├─ X-XSS-Protection: 1; mode=block
│  └─ Enable XSS filtering
│
├─ Referrer-Policy: strict-origin-when-cross-origin
│  └─ Control referrer information
│
├─ Permissions-Policy: geolocation=(), microphone=(), camera=()
│  └─ Restrict browser APIs
│
└─ Cache-Control: no-store, no-cache, max-age=0
   └─ Prevent sensitive data caching
```

---

## Infrastructure Security

### 1. Network Security

```
┌─────────────────────────────────────────┐
│         INTERNET                        │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│   WAF (Web Application Firewall)        │
│   ├─ Block malicious requests           │
│   ├─ DDoS protection                    │
│   └─ Geo-blocking (if needed)           │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│   Load Balancer (TLS Termination)       │
│   ├─ HTTPS offloading                   │
│   ├─ SSL/TLS certificates               │
│   └─ Certificate pinning enforcement    │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│   Application Servers (Private VPC)     │
│   ├─ FastAPI instances                  │
│   ├─ No direct internet access          │
│   └─ Internal communication only        │
└────────┬────────────────────────────────┘
         │
   ┌─────┴──────┐
   │             │
   ▼             ▼
PostgreSQL   Redis (Private Subnet)
(Private)    (Private)
```

### 2. Database Security

```
PostgreSQL Hardening:
├─ Authentication:
│  ├─ Strong credentials (32+ char random)
│  ├─ Certificate-based auth (optional)
│  └─ Row-level security (RLS) policies
│
├─ Network:
│  ├─ Private subnet only (no public IP)
│  ├─ Firewall rules: app servers only
│  ├─ SSL/TLS required for connections
│  └─ Connection pooling (pgBouncer)
│
├─ Encryption:
│  ├─ Encrypted backups
│  ├─ Encrypted replication
│  └─ TDE at database level
│
├─ Auditing:
│  ├─ pgAudit extension
│  ├─ Log all DDL statements
│  ├─ Log sensitive data access
│  └─ Archive logs (immutable)
│
└─ Access Control:
   ├─ Separate users per application
   ├─ Minimal required privileges
   ├─ Separate roles for read/write
   └─ Service account with time limits

Row-Level Security (RLS):
├─ Users see only their own rides
├─ Riders see assigned rides
├─ Admins see all data
└─ Policy enforcement by database
```

### 3. Secrets Management

```
Environment Variables (Development):
├─ .env file (git-ignored)
├─ Never commit secrets
├─ Share via secure channel (1Password, LastPass)
└─ Load via python-dotenv

Secrets Management (Production):
├─ AWS Secrets Manager
│  ├─ Encrypted secrets
│  ├─ Automatic rotation
│  ├─ Audit logging
│  └─ IAM access control
│
├─ Sensitive Variables:
│  ├─ DATABASE_URL
│  ├─ REDIS_URL
│  ├─ JWT_SECRET_KEY
│  ├─ API keys (Firebase, Mapbox, Payment)
│  ├─ Encryption keys
│  └─ CORS origins
│
└─ Rotation Policy:
   ├─ API keys: quarterly
   ├─ Database password: semi-annually
   ├─ JWT secret: semi-annually
   └─ SSL certificates: annually
```

### 4. Access Control

```
Principle of Least Privilege:

Admin Access:
├─ MFA required (Google Authenticator)
├─ SSH key-based authentication only
├─ Bastion host for server access
├─ Audit log all admin actions
└─ Time-limited sessions (1 hour)

Developer Access:
├─ Production read-only (unless emergency)
├─ Database access via tunnel only
├─ API keys personal (tied to developer)
├─ Git SSH keys (no deploy keys shared)
└─ Revoke immediately on departure

Service Accounts:
├─ Unique per service/application
├─ Read-only credentials when possible
├─ No credentials in code (use IAM)
├─ Automatic rotation enabled
└─ Audit log all service access
```

---

## Compliance Checklist

### OWASP Top 10 Mitigation

- [ ] **A1: Broken Authentication**
  - ✅ MFA via OTP
  - ✅ Secure password hashing (bcrypt)
  - ✅ JWT with refresh tokens
  - ✅ Session invalidation on logout
  - ✅ Rate limiting on login

- [ ] **A2: Broken Authorization**
  - ✅ Role-based access control (RBAC)
  - ✅ Resource-level permission checks
  - ✅ Row-level security in database
  - ✅ Deny by default
  - ✅ Audit logging

- [ ] **A3: Injection**
  - ✅ Parameterized queries (SQLAlchemy)
  - ✅ Input validation (Pydantic)
  - ✅ Prepared statements
  - ✅ SAST scanning in CI/CD

- [ ] **A4: Insecure Design**
  - ✅ Threat modeling completed
  - ✅ Security requirements specified
  - ✅ Secure architecture review done
  - ✅ Defense-in-depth implemented

- [ ] **A5: Security Misconfiguration**
  - ✅ Secure defaults in code
  - ✅ Minimal necessary permissions
  - ✅ Security headers configured
  - ✅ Unnecessary services disabled
  - ✅ Inventory of configs maintained

- [ ] **A6: Vulnerable & Outdated Components**
  - ✅ Dependency scanning (Dependabot)
  - ✅ Regular updates scheduled
  - ✅ Vulnerability patches applied within 24h
  - ✅ Lock file committed (reproducible builds)

- [ ] **A7: Authentication Failure**
  - ✅ (Covered under A1)

- [ ] **A8: Software & Data Integrity Failures**
  - ✅ Signed commits (git)
  - ✅ Branch protection
  - ✅ Code review required before merge
  - ✅ CI/CD security checks
  - ✅ Package verification

- [ ] **A9: Logging & Monitoring Failures**
  - ✅ Centralized logging
  - ✅ Security event monitoring
  - ✅ Alert on suspicious activity
  - ✅ Log retention policy
  - ✅ Tamper-proof logging

- [ ] **A10: Server-Side Request Forgery (SSRF)**
  - ✅ URL validation
  - ✅ Whitelist allowed hosts
  - ✅ Timeout on external requests
  - ✅ No server-side file access from user input

### Additional Security Measures

- [ ] **Penetration Testing**
  - [ ] Quarterly external pen tests
  - [ ] Monthly internal security scans
  - [ ] Remediation tracking

- [ ] **Incident Response**
  - [ ] Incident response plan documented
  - [ ] On-call security team established
  - [ ] Communication templates prepared
  - [ ] Forensics procedures defined

- [ ] **Data Privacy**
  - [ ] Privacy policy published
  - [ ] Data retention policy enforced
  - [ ] GDPR/local law compliance
  - [ ] Right to deletion implemented

- [ ] **Security Training**
  - [ ] Team trained on secure coding
  - [ ] Regular security awareness updates
  - [ ] Phishing simulation tests
  - [ ] Documentation kept current

---

## Security Incident Response

### Response Steps

```
1. DETECT (Continuous monitoring)
   ├─ Alert fires
   └─ Analyst investigates

2. ASSESS (Is it a real incident?)
   ├─ False alarm? → Close
   ├─ Confirmed? → Escalate

3. CONTAIN (Stop spread)
   ├─ Revoke exposed credentials
   ├─ Block attacking IPs
   ├─ Disable affected accounts
   └─ Isolate affected systems

4. INVESTIGATE (Understand impact)
   ├─ Gather logs
   ├─ Timeline analysis
   ├─ Identify compromised data
   └─ Determine root cause

5. REMEDIATE (Fix vulnerability)
   ├─ Patch system
   ├─ Close access vector
   ├─ Update security rules
   └─ Deploy fix

6. RECOVER (Restore operations)
   ├─ Verify security
   ├─ Restore services
   ├─ Monitor for recurrence
   └─ Document all changes

7. COMMUNICATE (Notify stakeholders)
   ├─ User notification (if data exposed)
   ├─ Regulatory reporting
   ├─ Media statement (if needed)
   └─ Post-incident review
```

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [PCI DSS](https://www.pcisecuritystandards.org/)
- [GDPR Compliance](https://gdpr-info.eu/)

---

**Last Updated**: 2026-05-26
**Next Review**: 2026-08-26
