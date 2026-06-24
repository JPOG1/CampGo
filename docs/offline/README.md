# CampGo Offline-First Architecture

## Overview

CampGo is designed from the ground up to function reliably in low-connectivity environments. This is critical for:
- Convention grounds with limited cellular coverage
- Camp environments with patchy networks
- User fallback during network degradation
- Batch processing in areas with intermittent connectivity

## Core Principles

1. **Local-First**: All data operations work locally first
2. **Optimistic Updates**: UI updates immediately, server sync follows
3. **Eventual Consistency**: Server state syncs when connection available
4. **Conflict Resolution**: Intelligent handling of simultaneous edits
5. **Transparent to User**: Offline mode seamless, automatic sync
6. **Battery Efficient**: Minimal background processing

## Architecture Layers

### Layer 1: Local Data Storage

**Mobile (SQLite/RealmDB)**
```typescript
// Schema mirrors server models with sync metadata
interface RideRequest {
  id: string
  userId: string
  pickupCoords: GeoPoint
  dropoffCoords: GeoPoint
  status: 'REQUESTED' | 'ACCEPTED' | ...
  
  // Sync Metadata
  _localVersion: number      // Local version counter
  _serverVersion: number     // Server version counter
  _syncStatus: 'PENDING' | 'SYNCED' | 'FAILED' | 'CONFLICT'
  _lastSyncAttempt: number   // Timestamp
  _createdAtLocal: number    // Local creation time
  _createdAtServer: number   // Server creation time
  _queuedAt: number          // When added to sync queue
}
```

**Storage Strategy**
- Encrypted SQLite database (secure storage)
- Automatic pruning of old completed rides
- Index on commonly queried fields
- ~50 MB limit for reasonable performance

### Layer 2: Request Queue

**Pending Operations Storage**
```typescript
interface SyncQueueItem {
  id: string
  entityType: 'ride' | 'delivery' | 'payment'
  entityId: string
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  payload: any
  
  retryCount: number
  lastRetryAt: number
  nextRetryAt: number
  
  status: 'PENDING' | 'SYNCED' | 'FAILED' | 'CONFLICT'
  errorMessage?: string
  
  createdAt: number
}
```

**Queue Management**
- In-memory + SQLite backup
- Ordered by creation time (FIFO)
- Retry backoff: exponential (1s, 2s, 4s, 8s... max 5min)
- Max retries: 24 (24 hours total)
- Survives app restart

### Layer 3: Conflict Detection

**Version-Based Conflict Detection**
```
                Offline Changes        Server Changes
                     │                      │
                     ├─ local_version: 1    ├─ server_version: 2
                     │                      │
                     └─────────────┬────────┘
                                   │
                        Sync Attempt: CONFLICT
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
            FIELD COMPARISON   VERSION CHECK   TIMESTAMP CHECK
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ Apply Resolution Strategy   │
                    └─────────────────────────────┘
```

**Conflict Resolution Strategies**
1. **LAST_WRITE_WINS** (default)
   - Compare timestamps
   - Use most recent version
   - Suitable for: status updates, location changes

2. **MERGE**
   - Combine non-conflicting fields
   - Suitable for: metadata, tags, settings

3. **CALLBACK**
   - Application-specific logic
   - User notification + manual review option
   - Suitable for: payment data, critical fields

4. **MANUAL_REVIEW**
   - Flag for manual resolution
   - User chooses which version to keep
   - Suitable for: data loss scenarios

## Sync Engine Workflow

### State Machine

```
IDLE
  │
  ├─ Internet available?
  │   No → OFFLINE
  │   Yes → CHECKING
  │
CHECKING
  │
  ├─ Server reachable?
  │   No → OFFLINE
  │   Yes → PENDING_ITEMS?
  │
OFFLINE
  │
  ├─ Queue pending items locally
  ├─ Retry on interval (exponential backoff)
  └─ Return to CHECKING periodically
  
SYNCING
  │
  ├─ Build batch from queue
  ├─ POST /api/v1/sync
  │
  ├─ Success?
  │   Yes → Apply results → Update local state → IDLE
  │   No → Analyze errors
  │         ├─ Network error → OFFLINE
  │         ├─ Conflict → CONFLICT_RESOLUTION
  │         ├─ Validation error → FAILED (log error)
  │         └─ Server error → Retry
  │
CONFLICT_RESOLUTION
  │
  ├─ Determine resolution strategy
  ├─ Apply resolution logic
  ├─ Update local data
  ├─ Update sync metadata
  └─ Return to IDLE
```

### Sync Protocol

**Request Format**
```json
{
  "device_id": "device-uuid",
  "batch_id": "batch-uuid",
  "timestamp": 1700000000,
  "protocol_version": 1,
  "operations": [
    {
      "id": "queue-item-id",
      "entity_type": "ride_request",
      "entity_id": "ride-123",
      "operation": "CREATE",
      "payload": { /* full entity data */ },
      "local_version": 1,
      "created_at_local": 1699999900
    }
  ],
  "sync_metadata": {
    "last_sync_timestamp": 1699998000,
    "device_timestamp_offset": 100  // ms offset from server
  }
}
```

**Response Format**
```json
{
  "batch_id": "batch-uuid",
  "timestamp": 1700000001,
  "results": [
    {
      "queue_item_id": "queue-item-id",
      "entity_type": "ride_request",
      "entity_id": "ride-123",
      "status": "APPLIED",
      "server_entity": { /* complete entity from server */ },
      "server_version": 2,
      "server_timestamp": 1700000001
    },
    {
      "queue_item_id": "queue-item-id-2",
      "entity_type": "delivery",
      "entity_id": "delivery-456",
      "status": "CONFLICT",
      "conflict_fields": ["status", "location"],
      "resolution_strategy": "MERGE",
      "server_data": { /* server version */ },
      "resolved_data": { /* merged result */ }
    }
  ],
  "full_sync_required": false,  // If true, request full state
  "deleted_entities": [],  // Entities deleted on server
  "sync_metadata": {
    "server_timestamp": 1700000001,
    "next_sync_recommended_at": 1700000060,
    "pending_operations_count": 0
  }
}
```

## Network Fallback Hierarchy

### Primary: Internet (Online Mode)
- Standard HTTP/HTTPS
- Real-time WebSocket
- Direct API calls
- Cloud-based features

### Secondary: Offline Mode
- Local SQLite database
- In-memory queue
- Bluetooth LE mesh network (Phase 2)
- Wi-Fi Direct P2P (Phase 2)

### Phase 2: Hybrid Connectivity

```
┌──────────────────────────────────────┐
│      Network Availability Check       │
└──────┬───────────────────────────────┘
       │
    ┌──┴──┐
    │     │
 YES │     │ NO
    │     │
    ▼     ▼
ONLINE  CHECK_ALTERNATIVES
    │         │
    │      ┌──┴──────────────┐
    │      │                 │
    │   BLUETOOTH_LE      WIFI_DIRECT
    │      │                 │
    │      └──────┬──────────┘
    │             │
    └──────┬──────┘
           │
        OFFLINE (Local-only mode)
```

## Local Cache Management

### Cache Hierarchy

```
User Requested Ride
    │
    ├─ Check In-Memory Cache (L1)
    │  ├─ Hit? → Return immediately
    │  └─ Miss? → Continue
    │
    ├─ Check SQLite Local DB (L2)
    │  ├─ Hit? → Load to memory, return
    │  └─ Miss? → Continue
    │
    ├─ Check Server (if online)
    │  ├─ Hit? → Store in L2, load to L1, return
    │  └─ Miss? → Return null
    │
    └─ Return null (offline, no cache)

Cache Invalidation:
- Explicit: User action (refresh)
- Time-based: TTL expiration (10 min)
- Event-based: Real-time updates (WebSocket)
- Size-based: LRU eviction (50MB limit)
```

### Pruning Strategy

```
Daily Task:
├─ Delete completed rides > 30 days old
├─ Delete completed deliveries > 30 days old
├─ Compress older analytics events
├─ Clean orphaned cache entries
└─ Maintain < 50MB total size
```

## Offline-First Code Examples

### Sync-Aware Ride Booking

```typescript
async function bookRide(pickupCoords, dropoffCoords) {
  // 1. Create ride locally (immediate feedback)
  const ride = {
    id: generateUUID(),
    status: 'REQUESTED',
    _syncStatus: 'PENDING',
    _createdAtLocal: Date.now(),
    pickupCoords,
    dropoffCoords
  }
  
  // 2. Save to local database
  await localDB.rides.insert(ride)
  
  // 3. Update UI optimistically
  setRides([...rides, ride])
  
  // 4. Add to sync queue
  await syncQueue.add({
    entityType: 'ride',
    entityId: ride.id,
    operation: 'CREATE',
    payload: ride
  })
  
  // 5. Attempt immediate sync (if online)
  if (isOnline()) {
    await syncEngine.syncBatch()
  }
  
  return ride
}
```

### Conflict Resolution Example

```typescript
async function resolveConflict(conflict) {
  const { localData, serverData, conflictFields } = conflict
  
  // Strategy: MERGE for metadata, LAST_WRITE_WINS for status
  const resolved = {
    ...serverData,  // Start with server version
    
    // Merge non-conflicting fields
    ...Object.entries(localData).reduce((acc, [key, value]) => {
      if (!conflictFields.includes(key)) {
        acc[key] = value  // Keep local change
      }
      return acc
    }, {}),
    
    // Status: use most recent timestamp
    status: localData._lastUpdatedAt > serverData._lastUpdatedAt 
      ? localData.status 
      : serverData.status
  }
  
  // Apply resolution
  await localDB.rides.update(resolved)
  await syncQueue.markResolved(conflict.queueItemId)
  
  return resolved
}
```

## Monitoring & Debugging

### Sync Health Metrics

```typescript
interface SyncMetrics {
  pending_operations: number
  failed_operations: number
  conflict_count: number
  last_successful_sync: timestamp
  average_sync_duration_ms: number
  sync_success_rate: percentage
  queue_size_bytes: number
  offline_duration_seconds: number
}
```

### Debugging Tools

- **Sync Queue Inspector**: View pending/failed operations
- **Local DB Browser**: Inspect local database state
- **Conflict Viewer**: Review unresolved conflicts
- **Network Monitor**: Track connectivity changes
- **Sync Logs**: Detailed sync attempt logs

## Best Practices

1. **Minimal Dependencies**: Fetch only needed data
2. **Smart Caching**: Cache frequently accessed data
3. **Batch Operations**: Group syncs for efficiency
4. **User Communication**: Clear offline/syncing indicators
5. **Data Validation**: Validate locally before sync
6. **Error Handling**: Graceful failure recovery
7. **Testing**: Test offline scenarios thoroughly

## Performance Targets

| Metric | Target |
|--------|--------|
| Local operation | < 50ms |
| Conflict detection | < 100ms |
| Sync batch size | < 1MB |
| Sync completion | < 5 seconds |
| Database query (local) | < 10ms |
| Startup time (cold) | < 2 seconds |
