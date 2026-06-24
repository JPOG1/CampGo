# CampGo Database Schema & ER Diagrams

## Overview

The database uses PostgreSQL 15+ with PostGIS extension for geospatial queries. This document outlines the complete schema design optimized for:
- Real-time ride/delivery tracking
- Geolocation-based queries
- Analytics and ML predictions
- Offline sync and conflict resolution
- Audit logging and security

---

## Entity Relationship Diagram (ER)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CAMPGO DATABASE SCHEMA                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION & USERS                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐   │
│  │   users             │  │   riders             │  │   admins        │   │
│  ├──────────────────────┤  ├──────────────────────┤  ├─────────────────┤   │
│  │ id (PK)             │  │ id (PK)              │  │ id (PK)         │   │
│  │ phone (UNIQUE)      │  │ user_id (FK→users)   │  │ user_id (FK→ users)
│  │ email               │  │ verification_status  │  │ role            │   │
│  │ first_name          │  │ vehicle_type         │  │ permissions     │   │
│  │ last_name           │  │ vehicle_registration │  │ department      │   │
│  │ role (user/rider)   │  │ license_number       │  │ assigned_region │   │
│  │ profile_image_url   │  │ license_expiry       │  │ created_at      │   │
│  │ document_verified   │  │ insurance_expiry     │  │ updated_at      │   │
│  │ is_active           │  │ bank_account         │  │ is_active       │   │
│  │ region              │  │ earnings_total       │  └─────────────────┘   │
│  │ timezone            │  │ ratings_average      │                         │
│  │ created_at          │  │ total_rides          │  ┌─────────────────┐   │
│  │ updated_at          │  │ total_deliveries     │  │   vendors       │   │
│  │ deleted_at          │  │ availability_status  │  ├─────────────────┤   │
│  └──────────────────────┘  │ last_location_update │  │ id (PK)         │   │
│           △                 │ created_at           │  │ user_id (FK)    │   │
│           │                 │ updated_at           │  │ business_name   │   │
│           │                 │ deleted_at           │  │ category        │   │
│           └─────────────────┴──────────────────────┘  │ rating          │   │
│                                                         │ verified_at     │   │
│  ┌──────────────────────┐  ┌──────────────────────┐   │ created_at      │   │
│  │  user_devices       │  │  user_sessions       │   └─────────────────┘   │
│  ├──────────────────────┤  ├──────────────────────┤                         │
│  │ id (PK)             │  │ id (PK)              │   ┌─────────────────┐   │
│  │ user_id (FK)        │  │ user_id (FK)         │   │ user_locations  │   │
│  │ device_id           │  │ device_id            │   ├─────────────────┤   │
│  │ device_type         │  │ ip_address           │   │ id (PK)         │   │
│  │ os_version          │  │ user_agent           │   │ user_id (FK)    │   │
│  │ app_version         │  │ access_token         │   │ label           │   │
│  │ fcm_token           │  │ refresh_token        │   │ coordinates     │   │
│  │ is_active           │  │ token_expires_at     │   │ is_saved        │   │
│  │ created_at          │  │ revoked_at           │   │ created_at      │   │
│  │ last_used_at        │  │ created_at           │   └─────────────────┘   │
│  └──────────────────────┘  └──────────────────────┘                         │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                            RIDES & TRACKING                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐   │
│  │  rides              │  │  ride_requests       │  │ rider_offers    │   │
│  ├──────────────────────┤  ├──────────────────────┤  ├─────────────────┤   │
│  │ id (PK)             │  │ id (PK)              │  │ id (PK)         │   │
│  │ user_id (FK)        │  │ ride_id (FK)         │  │ ride_request_id │   │
│  │ rider_id (FK)       │  │ user_id (FK)         │  │ rider_id (FK)   │   │
│  │ status              │  │ pickup_coordinates   │  │ status          │   │
│  │ pickup_lat/lng      │  │ dropoff_coordinates  │  │ offered_at      │   │
│  │ dropoff_lat/lng     │  │ estimated_distance   │  │ expires_at      │   │
│  │ pickup_address      │  │ estimated_fare       │  │ accepted_at     │   │
│  │ dropoff_address     │  │ promo_code           │  │ rejected_at     │   │
│  │ distance_km         │  │ payment_method       │  │ created_at      │   │
│  │ fare_amount         │  │ requested_at         │  └─────────────────┘   │
│  │ payment_status      │  │ expires_at           │                         │
│  │ start_time          │  │ created_at           │  ┌─────────────────┐   │
│  │ end_time            │  └──────────────────────┘  │ ride_locations  │   │
│  │ duration_minutes    │                             ├─────────────────┤   │
│  │ rating_by_user      │  ┌──────────────────────┐   │ id (PK)         │   │
│  │ rating_by_rider     │  │  ride_tracking       │   │ ride_id (FK)    │   │
│  │ notes               │  ├──────────────────────┤   │ coordinates     │   │
│  │ created_at          │  │ id (PK)              │   │ accuracy        │   │
│  │ updated_at          │  │ ride_id (FK)         │   │ speed           │   │
│  │ completed_at        │  │ location_lat/lng     │   │ bearing         │   │
│  │ cancelled_at        │  │ accuracy_meters      │   │ altitude        │   │
│  └──────────────────────┘  │ timestamp            │   │ timestamp       │   │
│           △                 │ created_at           │   │ created_at      │   │
│           │                 └──────────────────────┘   └─────────────────┘   │
│           └──────────────────────────────────────────────────────────────┘   │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         DELIVERIES & LOGISTICS                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐   │
│  │  deliveries         │  │  delivery_items      │  │ delivery_proof  │   │
│  ├──────────────────────┤  ├──────────────────────┤  ├─────────────────┤   │
│  │ id (PK)             │  │ id (PK)              │  │ id (PK)         │   │
│  │ vendor_id (FK)      │  │ delivery_id (FK)     │  │ delivery_id (FK)│   │
│  │ rider_id (FK)       │  │ category             │  │ photo_url       │   │
│  │ user_id (FK)        │  │ description          │  │ signature_url   │   │
│  │ status              │  │ quantity             │  │ notes           │   │
│  │ category            │  │ weight_kg            │  │ verified_at     │   │
│  │ pickup_lat/lng      │  │ unit_price           │  │ verified_by     │   │
│  │ dropoff_lat/lng     │  │ total_price          │  │ created_at      │   │
│  │ pickup_address      │  └──────────────────────┘  └─────────────────┘   │
│  │ dropoff_address     │                                                    │
│  │ description         │  ┌──────────────────────┐                         │
│  │ special_requirements│  │ delivery_stops       │                         │
│  │ delivery_fee        │  ├──────────────────────┤                         │
│  │ subtotal            │  │ id (PK)              │                         │
│  │ payment_status      │  │ delivery_id (FK)     │                         │
│  │ requested_at        │  │ stop_number          │                         │
│  │ scheduled_for       │  │ address              │                         │
│  │ pickup_time         │  │ coordinates          │                         │
│  │ dropoff_time        │  │ order_number         │                         │
│  │ created_at          │  │ status               │                         │
│  │ completed_at        │  │ completed_at         │                         │
│  └──────────────────────┘  └──────────────────────┘                         │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         PAYMENTS & TRANSACTIONS                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐   │
│  │  transactions       │  │  wallets             │  │ refunds         │   │
│  ├──────────────────────┤  ├──────────────────────┤  ├─────────────────┤   │
│  │ id (PK)             │  │ id (PK)              │  │ id (PK)         │   │
│  │ user_id (FK)        │  │ user_id (FK)         │  │ transaction_id  │   │
│  │ ride_id (FK NULL)   │  │ balance              │  │ ride_id/deliv   │   │
│  │ delivery_id (FK NUL)│  │ available_balance    │  │ amount          │   │
│  │ type (payment)      │  │ pending_balance      │  │ reason          │   │
│  │ amount              │  │ currency             │  │ status          │   │
│  │ currency            │  │ last_updated_at      │  │ initiated_at    │   │
│  │ status              │  │ created_at           │  │ completed_at    │   │
│  │ reference           │  └──────────────────────┘  └─────────────────┘   │
│  │ payment_provider    │                                                    │
│  │ provider_reference  │  ┌──────────────────────┐                         │
│  │ metadata            │  │ payouts              │                         │
│  │ created_at          │  ├──────────────────────┤                         │
│  │ processed_at        │  │ id (PK)              │                         │
│  └──────────────────────┘  │ rider_id (FK)       │                         │
│           △                 │ amount              │                         │
│           │                 │ bank_account        │                         │
│           └─────────────────│ status              │                         │
│                             │ reference           │                         │
│                             │ created_at          │                         │
│                             │ processed_at        │                         │
│                             └──────────────────────┘                         │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                        ANALYTICS & ML SCHEMA                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐   │
│  │  analytics_events   │  │ demand_heatmap       │  │ rider_metrics   │   │
│  ├──────────────────────┤  ├──────────────────────┤  ├─────────────────┤   │
│  │ id (PK)             │  │ id (PK)              │  │ id (PK)         │   │
│  │ event_type          │  │ geohash              │  │ rider_id (FK)   │   │
│  │ user_id (FK NULL)   │  │ hour_of_day          │  │ day_of_week     │   │
│  │ ride_id (FK NULL)   │  │ day_of_week          │  │ total_earnings  │   │
│  │ delivery_id (FK NUL)│  │ demand_count         │  │ average_rating  │   │
│  │ properties (JSON)   │  │ average_fare         │  │ completion_rate │   │
│  │ timestamp           │  │ recorded_at          │  │ cancellation_rate
│  │ created_at          │  └──────────────────────┘  │ period_start    │   │
│  └──────────────────────┘                             │ period_end      │   │
│                             ┌──────────────────────┐  │ created_at      │   │
│  ┌──────────────────────┐   │ ml_predictions       │  └─────────────────┘   │
│  │ user_behavior       │   ├──────────────────────┤                         │
│  ├──────────────────────┤   │ id (PK)              │  ┌─────────────────┐   │
│  │ id (PK)             │   │ type                 │  │ traffic_patterns│   │
│  │ user_id (FK)        │   │ target_id            │  ├─────────────────┤   │
│  │ last_ride_time      │   │ prediction           │  │ id (PK)         │   │
│  │ total_rides         │   │ confidence_score     │  │ area_geohash    │   │
│  │ avg_rating_given    │   │ input_features (JSON)│  │ hour_of_day     │   │
│  │ preferred_categories│   │ created_at           │  │ congestion_level│   │
│  │ preferred_routes    │   │ valid_until          │  │ avg_duration    │   │
│  │ churn_risk_score    │   └──────────────────────┘  │ recorded_at     │   │
│  │ ltv_score           │                             │ created_at      │   │
│  │ created_at          │                             └─────────────────┘   │
│  │ updated_at          │                                                    │
│  └──────────────────────┘                                                    │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                    SECURITY & AUDIT LOGGING                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐   │
│  │  audit_logs         │  │  security_events     │  │ otp_records     │   │
│  ├──────────────────────┤  ├──────────────────────┤  ├─────────────────┤   │
│  │ id (PK)             │  │ id (PK)              │  │ id (PK)         │   │
│  │ user_id (FK NULL)   │  │ event_type           │  │ phone           │   │
│  │ action              │  │ severity             │  │ otp_code        │   │
│  │ resource_type       │  │ user_id (FK NULL)    │  │ status          │   │
│  │ resource_id         │  │ ip_address           │  │ attempts        │   │
│  │ changes (JSON)      │  │ user_agent           │  │ expires_at      │   │
│  │ status              │  │ description          │  │ verified_at     │   │
│  │ ip_address          │  │ created_at           │  │ created_at      │   │
│  │ user_agent          │  └──────────────────────┘  └─────────────────┘   │
│  │ timestamp           │                                                    │
│  │ created_at          │  ┌──────────────────────┐                         │
│  └──────────────────────┘  │ fraud_flags          │                         │
│                             ├──────────────────────┤                         │
│  ┌──────────────────────┐   │ id (PK)              │                         │
│  │ api_logs            │   │ ride_id/delivery_id  │                         │
│  ├──────────────────────┤   │ flag_type            │                         │
│  │ id (PK)             │   │ confidence_score     │                         │
│  │ endpoint            │   │ description          │                         │
│  │ method              │   │ reviewed_by          │                         │
│  │ status_code         │   │ action_taken         │                         │
│  │ user_id (FK NULL)   │   │ created_at           │                         │
│  │ response_time_ms    │   └──────────────────────┘                         │
│  │ request_size        │                                                    │
│  │ response_size       │                                                    │
│  │ error_message       │                                                    │
│  │ created_at          │                                                    │
│  └──────────────────────┘                                                    │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                    OFFLINE SYNC & CONFLICT RESOLUTION                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  offline_sync_queue                                                  │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │ id (PK)                                                              │   │
│  │ device_id                                                            │   │
│  │ user_id (FK)                                                         │   │
│  │ operation_type (CREATE/UPDATE/DELETE)                               │   │
│  │ entity_type (ride_request, delivery, payment, etc)                  │   │
│  │ entity_id                                                            │   │
│  │ payload (JSON) - Complete record data                               │   │
│  │ status (PENDING, SYNCED, FAILED, CONFLICT)                          │   │
│  │ last_sync_attempt_at                                                │   │
│  │ retry_count                                                          │   │
│  │ error_message                                                        │   │
│  │ conflict_resolution (MANUAL_REVIEW, AUTO_REMOTE, AUTO_LOCAL)        │   │
│  │ created_at (local timestamp)                                        │   │
│  │ synced_at                                                            │   │
│  │ version                                                              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  offline_sync_conflicts                                              │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │ id (PK)                                                              │   │
│  │ sync_queue_id (FK)                                                   │   │
│  │ entity_type                                                          │   │
│  │ entity_id                                                            │   │
│  │ local_version                                                        │   │
│  │ server_version                                                       │   │
│  │ local_data (JSON)                                                    │   │
│  │ server_data (JSON)                                                   │   │
│  │ conflict_fields (array) - Which fields conflicted                    │   │
│  │ resolution_strategy (LAST_WRITE_WINS, MERGE, MANUAL, CALLBACK)      │   │
│  │ resolved_data (JSON)                                                 │   │
│  │ resolved_by (manual=user_id, auto=system)                           │   │
│  │ resolution_timestamp                                                 │   │
│  │ created_at                                                           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  sync_metadata (per device/user)                                     │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │ id (PK)                                                              │   │
│  │ device_id (UNIQUE)                                                   │   │
│  │ user_id (FK)                                                         │   │
│  │ last_sync_timestamp                                                  │   │
│  │ last_full_sync_timestamp                                             │   │
│  │ server_timestamp_offset (to handle clock skew)                       │   │
│  │ sync_status (IN_PROGRESS, IDLE, FAILED)                              │   │
│  │ pending_operations_count                                             │   │
│  │ failed_operations_count                                              │   │
│  │ needs_full_sync (boolean flag)                                       │   │
│  │ created_at                                                           │   │
│  │ updated_at                                                           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATIONS & MESSAGES                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐   │
│  │ notifications       │  │ notification_events  │  │ messages        │   │
│  ├──────────────────────┤  ├──────────────────────┤  ├─────────────────┤   │
│  │ id (PK)             │  │ id (PK)              │  │ id (PK)         │   │
│  │ user_id (FK)        │  │ notification_id (FK) │  │ from_user (FK)  │   │
│  │ type                │  │ event_type           │  │ to_user (FK)    │   │
│  │ title               │  │ timestamp            │  │ content         │   │
│  │ body                │  │ read_at              │  │ type            │   │
│  │ data (JSON)         │  │ delivery_status      │  │ ride_id (FK NUL)│   │
│  │ image_url           │  │ error_message        │  │ delivery_id (FK)│   │
│  │ deep_link           │  └──────────────────────┘  │ read_at         │   │
│  │ channel             │                             │ created_at      │   │
│  │ status              │                             │ updated_at      │   │
│  │ provider            │                             └─────────────────┘   │
│  │ provider_id         │                                                    │
│  │ read_at             │                                                    │
│  │ delivery_status     │                                                    │
│  │ created_at          │                                                    │
│  └──────────────────────┘                                                    │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                    SYSTEM CONFIGURATION & SETTINGS                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐                         │
│  │ system_config       │  │ region_settings      │                         │
│  ├──────────────────────┤  ├──────────────────────┤                         │
│  │ id (PK)             │  │ id (PK)              │                         │
│  │ key (UNIQUE)        │  │ region               │                         │
│  │ value (JSON)        │  │ currency             │                         │
│  │ data_type           │  │ timezone             │                         │
│  │ description         │  │ min_fare             │                         │
│  │ environment         │  │ per_km_rate          │                         │
│  │ updated_by          │  │ per_minute_rate      │                         │
│  │ updated_at          │  │ delivery_base_fee    │                         │
│  │ created_at          │  │ delivery_per_km      │                         │
│  └──────────────────────┘  │ commission_percentage
│                             │ insurance_enabled   │                         │
│                             │ is_active           │                         │
│                             │ created_at          │                         │
│                             └──────────────────────┘                         │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Models & Detailed Schema

### 1. Users & Authentication

#### users table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    phone_country_code VARCHAR(3),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'RIDER', 'ADMIN', 'VENDOR')),
    profile_image_url VARCHAR(500),
    bio TEXT,
    
    -- Verification & Security
    document_verified BOOLEAN DEFAULT FALSE,
    document_url VARCHAR(500),
    document_verified_at TIMESTAMP,
    verified_by_admin UUID REFERENCES users(id),
    
    -- Account Status
    is_active BOOLEAN DEFAULT TRUE,
    account_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION')),
    suspend_reason TEXT,
    suspended_at TIMESTAMP,
    
    -- Location & Preferences
    region VARCHAR(50) NOT NULL DEFAULT 'Lagos',
    timezone VARCHAR(50) DEFAULT 'Africa/Lagos',
    preferred_language VARCHAR(10) DEFAULT 'en',
    
    -- Metadata
    last_login_at TIMESTAMP,
    login_attempts_count INT DEFAULT 0,
    login_attempts_reset_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    
    CONSTRAINT user_email_if_provided CHECK (email IS NULL OR email ~ '^[^@]+@[^@]+$')
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_region ON users(region);
```

#### riders table (extends users)
```sql
CREATE TABLE riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Vehicle Information
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('KEKE_3WHEELER', 'MOTORCYCLE', 'CAR')),
    vehicle_registration VARCHAR(20) UNIQUE NOT NULL,
    vehicle_color VARCHAR(50),
    vehicle_model VARCHAR(100),
    vehicle_capacity INT,
    vehicle_photo_url VARCHAR(500),
    
    -- License & Verification
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_expiry DATE NOT NULL,
    license_photo_url VARCHAR(500),
    
    -- Insurance
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(100) UNIQUE,
    insurance_expiry DATE NOT NULL,
    insurance_document_url VARCHAR(500),
    
    -- Financial
    bank_account_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_code VARCHAR(10),
    bank_name VARCHAR(100),
    account_verified BOOLEAN DEFAULT FALSE,
    
    -- Performance Metrics
    earnings_total DECIMAL(15,2) DEFAULT 0,
    earnings_today DECIMAL(15,2) DEFAULT 0,
    earnings_this_week DECIMAL(15,2) DEFAULT 0,
    earnings_this_month DECIMAL(15,2) DEFAULT 0,
    
    ratings_average DECIMAL(3,2) DEFAULT 0,
    total_ratings_count INT DEFAULT 0,
    total_rides BIGINT DEFAULT 0,
    total_deliveries BIGINT DEFAULT 0,
    
    -- Completion & Cancellation Rates
    completion_rate DECIMAL(5,2),
    cancellation_rate DECIMAL(5,2),
    
    -- Availability
    availability_status VARCHAR(20) DEFAULT 'OFFLINE' CHECK (availability_status IN ('ONLINE', 'OFFLINE', 'BUSY', 'ON_RIDE', 'ON_DELIVERY')),
    availability_radius_km INT DEFAULT 5,
    
    -- Location Tracking
    current_coordinates GEOGRAPHY(POINT, 4326),
    last_location_update TIMESTAMP,
    
    -- Verification Status
    verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED')),
    verification_completed_at TIMESTAMP,
    verified_by_admin UUID REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_riders_user_id ON riders(user_id);
CREATE INDEX idx_riders_verification_status ON riders(verification_status);
CREATE INDEX idx_riders_availability_status ON riders(availability_status);
CREATE INDEX idx_riders_current_coordinates ON riders USING GIST(current_coordinates);
```

#### user_devices table
```sql
CREATE TABLE user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('ANDROID', 'IOS', 'WEB')),
    os_name VARCHAR(50),
    os_version VARCHAR(20),
    app_version VARCHAR(20),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    
    -- Firebase Cloud Messaging
    fcm_token VARCHAR(500) NOT NULL,
    fcm_token_updated_at TIMESTAMP,
    
    -- Device Status
    is_active BOOLEAN DEFAULT TRUE,
    is_trusted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP,
    
    CONSTRAINT unique_user_device UNIQUE (user_id, device_id)
);

CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_fcm_token ON user_devices(fcm_token);
```

#### user_sessions table
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- Tokens
    access_token VARCHAR(1000) NOT NULL,
    refresh_token VARCHAR(1000) NOT NULL,
    token_expires_at TIMESTAMP NOT NULL,
    
    -- Session Status
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_access_token ON user_sessions(access_token);
```

---

### 2. Rides & Tracking

#### rides table
```sql
CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    rider_id UUID REFERENCES riders(id) ON DELETE SET NULL,
    
    -- Location
    pickup_coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
    dropoff_coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
    pickup_address TEXT NOT NULL,
    dropoff_address TEXT NOT NULL,
    
    -- Distance & Fare
    distance_km DECIMAL(10,3),
    estimated_distance_km DECIMAL(10,3),
    fare_amount DECIMAL(10,2),
    estimated_fare DECIMAL(10,2),
    actual_fare DECIMAL(10,2),
    
    -- Promo & Discounts
    promo_code VARCHAR(50),
    promo_discount_amount DECIMAL(10,2) DEFAULT 0,
    platform_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
        'REQUESTED', 'ACCEPTED', 'RIDER_ARRIVING', 'RIDER_ARRIVED', 
        'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
    )),
    
    -- Payment
    payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'WALLET', 'CARD', 'USSD')),
    payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    
    -- Ratings & Reviews
    rating_by_user INT CHECK (rating_by_user BETWEEN 1 AND 5),
    rating_by_rider INT CHECK (rating_by_rider BETWEEN 1 AND 5),
    review_by_user TEXT,
    review_by_rider TEXT,
    user_rated_at TIMESTAMP,
    rider_rated_at TIMESTAMP,
    
    -- Additional Info
    ride_notes TEXT,
    special_requirements TEXT,
    
    -- Timestamps
    requested_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_rides_user_id ON rides(user_id);
CREATE INDEX idx_rides_rider_id ON rides(rider_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_requested_at ON rides(requested_at);
CREATE INDEX idx_rides_completed_at ON rides(completed_at);
CREATE INDEX idx_rides_pickup_coordinates ON rides USING GIST(pickup_coordinates);
CREATE INDEX idx_rides_dropoff_coordinates ON rides USING GIST(dropoff_coordinates);
```

#### ride_locations table (GPS tracking)
```sql
CREATE TABLE ride_locations (
    id BIGSERIAL PRIMARY KEY,
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES riders(id) ON DELETE SET NULL,
    
    -- GPS Data
    coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy_meters FLOAT,
    altitude FLOAT,
    bearing FLOAT,
    speed_kmh FLOAT,
    
    -- Timestamp
    recorded_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_ride_locations_ride_id ON ride_locations(ride_id);
CREATE INDEX idx_ride_locations_recorded_at ON ride_locations(recorded_at);
CREATE INDEX idx_ride_locations_coordinates ON ride_locations USING GIST(coordinates);
```

---

### 3. Deliveries & Orders

#### deliveries table
```sql
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE RESTRICT,
    rider_id UUID REFERENCES riders(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Delivery Details
    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
        'REQUESTED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP',
        'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'
    )),
    
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'FOOD', 'GROCERY', 'PARCEL', 'MEDICATION', 'DOCUMENTS', 'CONVENIENCE'
    )),
    description TEXT NOT NULL,
    special_requirements TEXT,
    
    -- Locations
    pickup_coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
    dropoff_coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
    pickup_address TEXT NOT NULL,
    dropoff_address TEXT NOT NULL,
    
    -- Distance & Pricing
    distance_km DECIMAL(10,3),
    delivery_fee DECIMAL(10,2),
    estimated_delivery_fee DECIMAL(10,2),
    subtotal DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    
    -- Payment
    payment_method VARCHAR(50) DEFAULT 'CASH',
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    
    -- Timing
    requested_at TIMESTAMP NOT NULL,
    scheduled_for TIMESTAMP,
    pickup_time TIMESTAMP,
    expected_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_deliveries_vendor_id ON deliveries(vendor_id);
CREATE INDEX idx_deliveries_rider_id ON deliveries(rider_id);
CREATE INDEX idx_deliveries_user_id ON deliveries(user_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_requested_at ON deliveries(requested_at);
```

#### delivery_items table
```sql
CREATE TABLE delivery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    
    category VARCHAR(50),
    description TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    weight_kg DECIMAL(10,3),
    unit_price DECIMAL(15,2),
    total_price DECIMAL(15,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_delivery_items_delivery_id ON delivery_items(delivery_id);
```

---

### 4. Payments & Transactions

#### transactions table
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
    delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
    
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'RIDE_PAYMENT', 'DELIVERY_PAYMENT', 'WALLET_TOPUP', 'WALLET_DEDUCTION',
        'RIDER_EARNINGS', 'REFUND', 'COMMISSION'
    )),
    
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'DISPUTED'
    )),
    
    -- Payment Provider Details
    payment_provider VARCHAR(50) CHECK (payment_provider IN ('PAYSTACK', 'FLUTTERWAVE', 'STRIPE', 'INTERNAL')),
    provider_reference VARCHAR(255),
    provider_message TEXT,
    
    -- Additional Metadata
    reference VARCHAR(255) UNIQUE,
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
```

---

### 5. Analytics & ML Schema

#### analytics_events table
```sql
CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
    delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
    
    properties JSONB,
    
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
```

#### demand_heatmap table
```sql
CREATE TABLE demand_heatmap (
    id BIGSERIAL PRIMARY KEY,
    geohash VARCHAR(12) NOT NULL,
    hour_of_day SMALLINT CHECK (hour_of_day BETWEEN 0 AND 23),
    day_of_week SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
    
    demand_count INT DEFAULT 0,
    average_fare DECIMAL(10,2),
    
    recorded_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT unique_heatmap UNIQUE (geohash, hour_of_day, day_of_week)
);

CREATE INDEX idx_demand_heatmap_geohash ON demand_heatmap(geohash);
CREATE INDEX idx_demand_heatmap_recorded_at ON demand_heatmap(recorded_at);
```

---

### 6. Offline Sync Schema

#### offline_sync_queue table
```sql
CREATE TABLE offline_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('CREATE', 'UPDATE', 'DELETE')),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255),
    
    payload JSONB NOT NULL,
    
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SYNCED', 'FAILED', 'CONFLICT')),
    last_sync_attempt_at TIMESTAMP,
    retry_count INT DEFAULT 0,
    error_message TEXT,
    
    conflict_resolution VARCHAR(50) CHECK (conflict_resolution IN ('MANUAL_REVIEW', 'AUTO_REMOTE', 'AUTO_LOCAL')),
    
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    synced_at TIMESTAMP,
    
    CONSTRAINT unique_sync_queue UNIQUE (device_id, entity_type, entity_id, operation_type)
);

CREATE INDEX idx_offline_sync_queue_user_id ON offline_sync_queue(user_id);
CREATE INDEX idx_offline_sync_queue_status ON offline_sync_queue(status);
CREATE INDEX idx_offline_sync_queue_created_at ON offline_sync_queue(created_at);
```

#### offline_sync_conflicts table
```sql
CREATE TABLE offline_sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_queue_id UUID REFERENCES offline_sync_queue(id) ON DELETE CASCADE,
    
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    
    local_version INT NOT NULL,
    server_version INT NOT NULL,
    
    local_data JSONB NOT NULL,
    server_data JSONB NOT NULL,
    
    conflict_fields TEXT[] NOT NULL,
    resolution_strategy VARCHAR(50) NOT NULL CHECK (resolution_strategy IN ('LAST_WRITE_WINS', 'MERGE', 'MANUAL', 'CALLBACK')),
    
    resolved_data JSONB,
    resolved_by VARCHAR(50),
    resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_timestamp TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_offline_sync_conflicts_sync_queue_id ON offline_sync_conflicts(sync_queue_id);
```

---

## Indexing Strategy

### Performance-Critical Indexes

```sql
-- Geospatial queries
CREATE INDEX idx_riders_location_available ON riders USING GIST(current_coordinates) 
    WHERE availability_status != 'OFFLINE';

-- Ride status queries
CREATE INDEX idx_rides_active ON rides(status, created_at DESC) 
    WHERE status NOT IN ('COMPLETED', 'CANCELLED');

-- Payment reconciliation
CREATE INDEX idx_transactions_unpaid ON transactions(user_id, created_at DESC) 
    WHERE status NOT IN ('COMPLETED', 'REFUNDED');

-- Analytics queries
CREATE INDEX idx_analytics_daily ON analytics_events(DATE(timestamp), event_type);
```

---

## Migration & Seed Strategy

All database changes use Alembic migrations:

```
migrations/versions/
├── 001_initial_schema.py
├── 002_add_postgis.py
├── 003_add_offline_sync.py
├── 004_add_analytics_tables.py
└── ...
```

---

## Data Integrity & Constraints

- **Foreign Key**: Strict referential integrity with cascading deletes where appropriate
- **Unique Constraints**: Phone, email, license, vehicle registration
- **Check Constraints**: Enum-like fields, value ranges
- **NOT NULL**: Critical fields only
- **Default Values**: Sensible defaults for timestamps, status fields
- **Soft Deletes**: deleted_at column for data retention

---

## Scaling Considerations

1. **Partitioning**:
   - `ride_locations` partitioned by date (hourly for high volume)
   - `analytics_events` partitioned by week
   - `transactions` partitioned by month

2. **Archival**:
   - Archive completed rides > 1 year old
   - Archive completed deliveries > 1 year old
   - Archive analytics events > 2 years old

3. **Replication**:
   - Read-replicas for analytics queries
   - Separate OLTP/OLAP databases for large scale

4. **Sharding** (Future):
   - Shard by region/city for multi-region deployment
   - Shard by user_id for ride/delivery data

---

## Next Steps

- Generate Alembic migration files
- Create schema validation tests
- Design connection pooling strategy
- Plan backup & disaster recovery strategy
