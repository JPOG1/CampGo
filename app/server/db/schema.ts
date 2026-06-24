import { pgTable, uuid, varchar, text, boolean, timestamp, integer, numeric, jsonb, doublePrecision, uniqueIndex, index, primaryKey, customType } from 'drizzle-orm/pg-core';

export const point = customType<{ data: string }>({
  dataType() { return 'point'; },
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  phoneCountryCode: varchar('phone_country_code', { length: 3 }),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  profileImageUrl: varchar('profile_image_url', { length: 500 }),
  bio: text('bio'),
  role: varchar('role', { length: 20 }).notNull().default('CUSTOMER'),
  isActive: boolean('is_active').notNull().default(true),
  accountStatus: varchar('account_status', { length: 20 }).notNull().default('ACTIVE'),
  isVerified: boolean('is_verified').notNull().default(false),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  documentVerified: boolean('document_verified').notNull().default(false),
  documentUrl: varchar('document_url', { length: 500 }),
  documentVerifiedAt: timestamp('document_verified_at', { withTimezone: true }),
  verifiedByAdminId: uuid('verified_by_admin_id'),
  suspendReason: text('suspend_reason'),
  suspendedAt: timestamp('suspended_at', { withTimezone: true }),
  region: varchar('region', { length: 50 }).notNull().default('Lagos'),
  timezone: varchar('timezone', { length: 50 }).notNull().default('Africa/Lagos'),
  preferredLanguage: varchar('preferred_language', { length: 10 }).notNull().default('en'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  loginAttemptsCount: integer('login_attempts_count').notNull().default(0),
  loginAttemptsResetAt: timestamp('login_attempts_reset_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  passwordResetToken: varchar('password_reset_token', { length: 500 }),
  passwordResetExpiresAt: timestamp('password_reset_expires_at', { withTimezone: true }),
  emailVerificationToken: varchar('email_verification_token', { length: 500 }),
}, (table) => [
  index('idx_users_phone').on(table.phone),
  index('idx_users_email').on(table.email),
  index('idx_users_role').on(table.role),
  index('idx_users_is_active').on(table.isActive),
  index('idx_users_region').on(table.region),
  index('idx_users_created_at').on(table.createdAt),
]);

export const riders = pgTable('riders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  vehicleType: varchar('vehicle_type', { length: 30 }).notNull(),
  vehicleRegistration: varchar('vehicle_registration', { length: 20 }).notNull().unique(),
  vehicleColor: varchar('vehicle_color', { length: 50 }),
  vehicleModel: varchar('vehicle_model', { length: 100 }),
  vehicleCapacity: integer('vehicle_capacity'),
  vehiclePhotoUrl: varchar('vehicle_photo_url', { length: 500 }),
  licenseNumber: varchar('license_number', { length: 50 }).notNull().unique(),
  licenseExpiry: timestamp('license_expiry').notNull(),
  licensePhotoUrl: varchar('license_photo_url', { length: 500 }),
  insuranceProvider: varchar('insurance_provider', { length: 100 }),
  insurancePolicyNumber: varchar('insurance_policy_number', { length: 100 }).unique(),
  insuranceExpiry: timestamp('insurance_expiry').notNull(),
  insuranceDocumentUrl: varchar('insurance_document_url', { length: 500 }),
  bankAccountName: varchar('bank_account_name', { length: 100 }),
  bankAccountNumber: varchar('bank_account_number', { length: 50 }),
  bankCode: varchar('bank_code', { length: 10 }),
  bankName: varchar('bank_name', { length: 100 }),
  accountVerified: boolean('account_verified').notNull().default(false),
  earningsTotal: numeric('earnings_total', { precision: 15, scale: 2 }).notNull().default('0'),
  earningsToday: numeric('earnings_today', { precision: 15, scale: 2 }).notNull().default('0'),
  earningsThisWeek: numeric('earnings_this_week', { precision: 15, scale: 2 }).notNull().default('0'),
  earningsThisMonth: numeric('earnings_this_month', { precision: 15, scale: 2 }).notNull().default('0'),
  ratingsAverage: numeric('ratings_average', { precision: 3, scale: 2 }).notNull().default('0'),
  totalRatingsCount: integer('total_ratings_count').notNull().default(0),
  totalRides: integer('total_rides').notNull().default(0),
  totalDeliveries: integer('total_deliveries').notNull().default(0),
  completionRate: numeric('completion_rate', { precision: 5, scale: 2 }),
  cancellationRate: numeric('cancellation_rate', { precision: 5, scale: 2 }),
  availabilityStatus: varchar('availability_status', { length: 20 }).notNull().default('OFFLINE'),
  availabilityRadiusKm: integer('availability_radius_km').notNull().default(5),
  currentCoordinates: point('current_coordinates'),
  lastLocationUpdate: timestamp('last_location_update', { withTimezone: true }),
  verificationStatus: varchar('verification_status', { length: 20 }).notNull().default('PENDING'),
  verificationCompletedAt: timestamp('verification_completed_at', { withTimezone: true }),
  verifiedByAdminId: uuid('verified_by_admin_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_riders_verification_status').on(table.verificationStatus),
  index('idx_riders_availability_status').on(table.availabilityStatus),
]);

export const vendors = pgTable('vendors', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  businessName: varchar('business_name', { length: 200 }).notNull(),
  businessCategory: varchar('business_category', { length: 100 }).notNull(),
  businessDescription: text('business_description'),
  logoUrl: varchar('logo_url', { length: 500 }),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('0'),
  totalOrders: integer('total_orders').notNull().default(0),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userDevices = pgTable('user_devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  deviceId: varchar('device_id', { length: 255 }).notNull(),
  deviceType: varchar('device_type', { length: 50 }).notNull(),
  osName: varchar('os_name', { length: 50 }),
  osVersion: varchar('os_version', { length: 20 }),
  manufacturer: varchar('manufacturer', { length: 100 }),
  model: varchar('model', { length: 100 }),
  appVersion: varchar('app_version', { length: 20 }),
  fcmToken: varchar('fcm_token', { length: 500 }).notNull(),
  fcmTokenUpdatedAt: timestamp('fcm_token_updated_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  isTrusted: boolean('is_trusted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
}, (table) => [
  index('idx_user_devices_user_id').on(table.userId),
  index('idx_user_devices_fcm_token').on(table.fcmToken),
]);

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  deviceId: varchar('device_id', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  accessToken: varchar('access_token', { length: 1000 }).notNull(),
  refreshToken: varchar('refresh_token', { length: 1000 }).notNull(),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revokedReason: varchar('revoked_reason', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (table) => [
  index('idx_user_sessions_user_id').on(table.userId),
  index('idx_user_sessions_access_token').on(table.accessToken),
  index('idx_user_sessions_refresh_token').on(table.refreshToken),
]);

export const userLocations = pgTable('user_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 100 }).notNull(),
  coordinates: point('coordinates').notNull(),
  address: varchar('address', { length: 500 }),
  isSaved: boolean('is_saved').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_user_locations_user_id').on(table.userId),
]);

export const otpRecords = pgTable('otp_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 20 }).notNull(),
  otpCode: varchar('otp_code', { length: 10 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  isUsed: boolean('is_used').notNull().default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_otp_records_phone').on(table.phone),
]);

export const rides = pgTable('rides', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  riderId: uuid('rider_id').references(() => riders.id, { onDelete: 'set null' }),
  pickupCoordinates: point('pickup_coordinates').notNull(),
  dropoffCoordinates: point('dropoff_coordinates').notNull(),
  pickupAddress: varchar('pickup_address', { length: 500 }).notNull(),
  dropoffAddress: varchar('dropoff_address', { length: 500 }).notNull(),
  distanceKm: numeric('distance_km', { precision: 10, scale: 3 }),
  estimatedDistanceKm: numeric('estimated_distance_km', { precision: 10, scale: 3 }),
  fareAmount: numeric('fare_amount', { precision: 10, scale: 2 }),
  estimatedFare: numeric('estimated_fare', { precision: 10, scale: 2 }),
  actualFare: numeric('actual_fare', { precision: 10, scale: 2 }),
  promoCode: varchar('promo_code', { length: 50 }),
  promoDiscountAmount: numeric('promo_discount_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  platformFee: numeric('platform_fee', { precision: 10, scale: 2 }).notNull().default('0'),
  status: varchar('status', { length: 30 }).notNull().default('REQUESTED'),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('CASH'),
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('PENDING'),
  ratingByUser: integer('rating_by_user'),
  ratingByRider: integer('rating_by_rider'),
  reviewByUser: text('review_by_user'),
  reviewByRider: text('review_by_rider'),
  userRatedAt: timestamp('user_rated_at', { withTimezone: true }),
  riderRatedAt: timestamp('rider_rated_at', { withTimezone: true }),
  rideNotes: text('ride_notes'),
  specialRequirements: text('special_requirements'),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  startTime: timestamp('start_time', { withTimezone: true }),
  endTime: timestamp('end_time', { withTimezone: true }),
  durationMinutes: integer('duration_minutes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_rides_user_id').on(table.userId),
  index('idx_rides_rider_id').on(table.riderId),
  index('idx_rides_status').on(table.status),
  index('idx_rides_requested_at').on(table.requestedAt),
  index('idx_rides_created_at').on(table.createdAt),
]);

export const rideLocations = pgTable('ride_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  rideId: uuid('ride_id').notNull().references(() => rides.id, { onDelete: 'cascade' }),
  riderId: uuid('rider_id').references(() => riders.id, { onDelete: 'set null' }),
  coordinates: point('coordinates').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: numeric('longitude', { precision: 11, scale: 8 }).notNull(),
  accuracyMeters: doublePrecision('accuracy_meters'),
  altitude: doublePrecision('altitude'),
  bearing: doublePrecision('bearing'),
  speedKmh: doublePrecision('speed_kmh'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_ride_locations_ride_id').on(table.rideId),
  index('idx_ride_locations_recorded_at').on(table.recordedAt),
]);

export const deliveries = pgTable('deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id').references(() => vendors.id, { onDelete: 'restrict' }),
  riderId: uuid('rider_id').references(() => riders.id, { onDelete: 'set null' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  status: varchar('status', { length: 30 }).notNull().default('REQUESTED'),
  category: varchar('category', { length: 50 }).notNull(),
  description: text('description').notNull(),
  specialRequirements: text('special_requirements'),
  pickupCoordinates: point('pickup_coordinates').notNull(),
  dropoffCoordinates: point('dropoff_coordinates').notNull(),
  pickupAddress: varchar('pickup_address', { length: 500 }).notNull(),
  dropoffAddress: varchar('dropoff_address', { length: 500 }).notNull(),
  distanceKm: numeric('distance_km', { precision: 10, scale: 3 }),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }),
  estimatedDeliveryFee: numeric('estimated_delivery_fee', { precision: 10, scale: 2 }),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('CASH'),
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('PENDING'),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull(),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  pickupTime: timestamp('pickup_time', { withTimezone: true }),
  expectedDeliveryTime: timestamp('expected_delivery_time', { withTimezone: true }),
  actualDeliveryTime: timestamp('actual_delivery_time', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_deliveries_vendor_id').on(table.vendorId),
  index('idx_deliveries_rider_id').on(table.riderId),
  index('idx_deliveries_user_id').on(table.userId),
  index('idx_deliveries_status').on(table.status),
  index('idx_deliveries_requested_at').on(table.requestedAt),
  index('idx_deliveries_created_at').on(table.createdAt),
]);

export const deliveryItems = pgTable('delivery_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  deliveryId: uuid('delivery_id').notNull().references(() => deliveries.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 50 }),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull().default(1),
  weightKg: numeric('weight_kg', { precision: 10, scale: 3 }),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }),
  totalPrice: numeric('total_price', { precision: 15, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_delivery_items_delivery_id').on(table.deliveryId),
]);

export const deliveryStops = pgTable('delivery_stops', {
  id: uuid('id').primaryKey().defaultRandom(),
  deliveryId: uuid('delivery_id').notNull().references(() => deliveries.id, { onDelete: 'cascade' }),
  stopNumber: integer('stop_number').notNull(),
  address: varchar('address', { length: 500 }).notNull(),
  coordinates: point('coordinates').notNull(),
  orderNumber: varchar('order_number', { length: 100 }),
  status: varchar('status', { length: 30 }).notNull().default('PENDING'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_delivery_stops_delivery_id').on(table.deliveryId),
]);

export const deliveryProof = pgTable('delivery_proof', {
  id: uuid('id').primaryKey().defaultRandom(),
  deliveryId: uuid('delivery_id').notNull().unique().references(() => deliveries.id, { onDelete: 'cascade' }),
  photoUrl: varchar('photo_url', { length: 500 }),
  signatureUrl: varchar('signature_url', { length: 500 }),
  notes: text('notes'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: uuid('verified_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_delivery_proof_delivery_id').on(table.deliveryId),
]);

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  rideId: uuid('ride_id').references(() => rides.id, { onDelete: 'set null' }),
  deliveryId: uuid('delivery_id').references(() => deliveries.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 30 }).notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('NGN'),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  paymentProvider: varchar('payment_provider', { length: 50 }),
  providerReference: varchar('provider_reference', { length: 255 }),
  providerMessage: text('provider_message'),
  reference: varchar('reference', { length: 255 }).unique(),
  txMetadata: jsonb('tx_metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_transactions_user_id').on(table.userId),
  index('idx_transactions_type').on(table.type),
  index('idx_transactions_status').on(table.status),
  index('idx_transactions_created_at').on(table.createdAt),
  index('idx_transactions_reference').on(table.reference),
  index('idx_transactions_provider_reference').on(table.providerReference),
]);

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  balance: numeric('balance', { precision: 15, scale: 2 }).notNull().default('0'),
  availableBalance: numeric('available_balance', { precision: 15, scale: 2 }).notNull().default('0'),
  pendingBalance: numeric('pending_balance', { precision: 15, scale: 2 }).notNull().default('0'),
  currency: varchar('currency', { length: 3 }).notNull().default('NGN'),
  lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_wallets_user_id').on(table.userId),
]);

export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').notNull().references(() => wallets.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 10 }).notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description').notNull(),
  reference: varchar('reference', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_wallet_transactions_wallet_id').on(table.walletId),
]);

export const payouts = pgTable('payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  riderId: uuid('rider_id').notNull().references(() => riders.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  bankAccount: varchar('bank_account', { length: 50 }),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  reference: varchar('reference', { length: 255 }).unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
}, (table) => [
  index('idx_payouts_rider_id').on(table.riderId),
  index('idx_payouts_status').on(table.status),
]);

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  rideId: uuid('ride_id').references(() => rides.id, { onDelete: 'set null' }),
  deliveryId: uuid('delivery_id').references(() => deliveries.id, { onDelete: 'set null' }),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  method: varchar('method', { length: 50 }),
  reference: varchar('reference', { length: 255 }).unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_payments_user_id').on(table.userId),
  index('idx_payments_status').on(table.status),
  index('idx_payments_reference').on(table.reference),
]);

export const refunds = pgTable('refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  rideId: uuid('ride_id').references(() => rides.id, { onDelete: 'set null' }),
  deliveryId: uuid('delivery_id').references(() => deliveries.id, { onDelete: 'set null' }),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  reason: varchar('reason', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  initiatedAt: timestamp('initiated_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => [
  index('idx_refunds_transaction_id').on(table.transactionId),
]);

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  rideId: uuid('ride_id').notNull().references(() => rides.id, { onDelete: 'cascade' }),
  riderId: uuid('rider_id').notNull().references(() => riders.id, { onDelete: 'cascade' }),
  fromUserId: uuid('from_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id, { onDelete: 'set null' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  rating: integer('rating').notNull(),
  reviewText: text('review_text'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_reviews_ride_id').on(table.rideId),
  index('idx_reviews_rider_id').on(table.riderId),
  index('idx_reviews_from_user_id').on(table.fromUserId),
]);

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  body: text('body').notNull(),
  data: jsonb('data'),
  imageUrl: varchar('image_url', { length: 500 }),
  deepLink: varchar('deep_link', { length: 500 }),
  channel: varchar('channel', { length: 50 }).notNull().default('FCM'),
  status: varchar('status', { length: 20 }).notNull().default('SENT'),
  provider: varchar('provider', { length: 50 }),
  providerId: varchar('provider_id', { length: 255 }),
  readAt: timestamp('read_at', { withTimezone: true }),
  deliveryStatus: varchar('delivery_status', { length: 20 }).notNull().default('PENDING'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_notifications_user_id').on(table.userId),
  index('idx_notifications_type').on(table.type),
  index('idx_notifications_created_at').on(table.createdAt),
]);

export const notificationEvents = pgTable('notification_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  notificationId: uuid('notification_id').notNull().references(() => notifications.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  deliveryStatus: varchar('delivery_status', { length: 20 }),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_notification_events_notification_id').on(table.notificationId),
]);

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromUserId: uuid('from_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  toUserId: uuid('to_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).notNull().default('TEXT'),
  rideId: uuid('ride_id').references(() => rides.id, { onDelete: 'set null' }),
  deliveryId: uuid('delivery_id').references(() => deliveries.id, { onDelete: 'set null' }),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_messages_from_user_id').on(table.fromUserId),
  index('idx_messages_to_user_id').on(table.toUserId),
  index('idx_messages_created_at').on(table.createdAt),
]);

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  rideId: uuid('ride_id').references(() => rides.id, { onDelete: 'set null' }),
  deliveryId: uuid('delivery_id').references(() => deliveries.id, { onDelete: 'set null' }),
  properties: jsonb('properties'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_analytics_events_event_type').on(table.eventType),
  index('idx_analytics_events_user_id').on(table.userId),
  index('idx_analytics_events_timestamp').on(table.timestamp),
  index('idx_analytics_events_created_at').on(table.createdAt),
]);

export const demandHeatmap = pgTable('demand_heatmap', {
  id: uuid('id').primaryKey().defaultRandom(),
  geohash: varchar('geohash', { length: 12 }).notNull(),
  hourOfDay: integer('hour_of_day'),
  dayOfWeek: integer('day_of_week'),
  demandCount: integer('demand_count').notNull().default(0),
  averageFare: numeric('average_fare', { precision: 10, scale: 2 }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_demand_heatmap_geohash').on(table.geohash),
  index('idx_demand_heatmap_recorded_at').on(table.recordedAt),
]);

export const riderMetrics = pgTable('rider_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  riderId: uuid('rider_id').notNull().unique().references(() => riders.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week'),
  totalEarnings: numeric('total_earnings', { precision: 15, scale: 2 }),
  averageRating: numeric('average_rating', { precision: 3, scale: 2 }),
  completionRate: numeric('completion_rate', { precision: 5, scale: 2 }),
  cancellationRate: numeric('cancellation_rate', { precision: 5, scale: 2 }),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_rider_metrics_rider_id').on(table.riderId),
]);

export const userBehavior = pgTable('user_behavior', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  lastRideTime: timestamp('last_ride_time', { withTimezone: true }),
  totalRides: integer('total_rides').notNull().default(0),
  avgRatingGiven: numeric('avg_rating_given', { precision: 3, scale: 2 }),
  preferredCategories: jsonb('preferred_categories'),
  churnRiskScore: numeric('churn_risk_score', { precision: 3, scale: 2 }),
  ltvScore: numeric('ltv_score', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_user_behavior_user_id').on(table.userId),
]);

export const mlPredictions = pgTable('ml_predictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(),
  targetId: uuid('target_id').notNull(),
  prediction: jsonb('prediction').notNull(),
  confidenceScore: numeric('confidence_score', { precision: 3, scale: 2 }),
  inputFeatures: jsonb('input_features'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  validUntil: timestamp('valid_until', { withTimezone: true }).notNull(),
}, (table) => [
  index('idx_ml_predictions_target_id').on(table.targetId),
  index('idx_ml_predictions_type').on(table.type),
]);

export const trafficPatterns = pgTable('traffic_patterns', {
  id: uuid('id').primaryKey().defaultRandom(),
  areaGeohash: varchar('area_geohash', { length: 12 }).notNull(),
  hourOfDay: integer('hour_of_day').notNull(),
  congestionLevel: varchar('congestion_level', { length: 20 }).notNull(),
  avgDurationMinutes: integer('avg_duration_minutes'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_traffic_patterns_geohash').on(table.areaGeohash),
  index('idx_traffic_patterns_recorded_at').on(table.recordedAt),
]);

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }).notNull(),
  resourceId: varchar('resource_id', { length: 255 }),
  changes: jsonb('changes'),
  status: varchar('status', { length: 20 }).notNull().default('SUCCESS'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_audit_logs_user_id').on(table.userId),
  index('idx_audit_logs_action').on(table.action),
  index('idx_audit_logs_created_at').on(table.createdAt),
]);

export const securityEvents = pgTable('security_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  description: text('description').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_security_events_event_type').on(table.eventType),
  index('idx_security_events_severity').on(table.severity),
  index('idx_security_events_created_at').on(table.createdAt),
]);

export const apiLogs = pgTable('api_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  method: varchar('method', { length: 10 }).notNull(),
  statusCode: integer('status_code').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  responseTimeMs: integer('response_time_ms').notNull(),
  requestSize: integer('request_size'),
  responseSize: integer('response_size'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_api_logs_endpoint').on(table.endpoint),
  index('idx_api_logs_status_code').on(table.statusCode),
  index('idx_api_logs_created_at').on(table.createdAt),
]);

export const fraudAlerts = pgTable('fraud_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  rideId: uuid('ride_id').references(() => rides.id, { onDelete: 'set null' }),
  deliveryId: uuid('delivery_id').references(() => deliveries.id, { onDelete: 'set null' }),
  flagType: varchar('flag_type', { length: 100 }).notNull(),
  confidenceScore: numeric('confidence_score', { precision: 3, scale: 2 }).notNull(),
  description: text('description'),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  actionTaken: varchar('action_taken', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull().default('OPEN'),
}, (table) => [
  index('idx_fraud_alerts_type').on(table.flagType),
  index('idx_fraud_alerts_status').on(table.status),
]);

export const offlineSyncQueue = pgTable('offline_sync_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: varchar('device_id', { length: 255 }).notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  operationType: varchar('operation_type', { length: 20 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 255 }),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  lastSyncAttemptAt: timestamp('last_sync_attempt_at', { withTimezone: true }),
  retryCount: integer('retry_count').notNull().default(0),
  errorMessage: text('error_message'),
  conflictResolution: varchar('conflict_resolution', { length: 50 }),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  syncedAt: timestamp('synced_at', { withTimezone: true }),
}, (table) => [
  index('idx_offline_sync_queue_user_id').on(table.userId),
  index('idx_offline_sync_queue_status').on(table.status),
  index('idx_offline_sync_queue_device_id').on(table.deviceId),
]);

export const offlineSyncConflicts = pgTable('offline_sync_conflicts', {
  id: uuid('id').primaryKey().defaultRandom(),
  syncQueueId: uuid('sync_queue_id').notNull().references(() => offlineSyncQueue.id, { onDelete: 'cascade' }),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 255 }).notNull(),
  localVersion: integer('local_version').notNull(),
  serverVersion: integer('server_version').notNull(),
  localData: jsonb('local_data').notNull(),
  serverData: jsonb('server_data').notNull(),
  conflictFields: varchar('conflict_fields', { length: 50 }).array().notNull(),
  resolutionStrategy: varchar('resolution_strategy', { length: 50 }).notNull(),
  resolvedData: jsonb('resolved_data'),
  resolvedBy: varchar('resolved_by', { length: 50 }),
  resolvedByUserId: uuid('resolved_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  resolutionTimestamp: timestamp('resolution_timestamp', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_offline_sync_conflicts_sync_queue_id').on(table.syncQueueId),
]);

export const syncMetadata = pgTable('sync_metadata', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: varchar('device_id', { length: 255 }).notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastSyncTimestamp: timestamp('last_sync_timestamp', { withTimezone: true }),
  lastFullSyncTimestamp: timestamp('last_full_sync_timestamp', { withTimezone: true }),
  serverTimestampOffset: integer('server_timestamp_offset').notNull().default(0),
  syncStatus: varchar('sync_status', { length: 20 }).notNull().default('IDLE'),
  pendingOperationsCount: integer('pending_operations_count').notNull().default(0),
  failedOperationsCount: integer('failed_operations_count').notNull().default(0),
  needsFullSync: boolean('needs_full_sync').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_sync_metadata_user_id').on(table.userId),
]);

export const systemConfig = pgTable('system_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: jsonb('value').notNull(),
  dataType: varchar('data_type', { length: 50 }).notNull(),
  description: text('description'),
  environment: varchar('environment', { length: 50 }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_system_config_key').on(table.key),
]);

export const regionSettings = pgTable('region_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  region: varchar('region', { length: 100 }).notNull().unique(),
  currency: varchar('currency', { length: 3 }).notNull(),
  timezone: varchar('timezone', { length: 50 }).notNull(),
  minFare: numeric('min_fare', { precision: 10, scale: 2 }).notNull(),
  perKmRate: numeric('per_km_rate', { precision: 10, scale: 2 }).notNull(),
  perMinuteRate: numeric('per_minute_rate', { precision: 10, scale: 2 }).notNull(),
  deliveryBaseFee: numeric('delivery_base_fee', { precision: 10, scale: 2 }).notNull(),
  deliveryPerKm: numeric('delivery_per_km', { precision: 10, scale: 2 }).notNull(),
  commissionPercentage: numeric('commission_percentage', { precision: 5, scale: 2 }).notNull(),
  insuranceEnabled: boolean('insurance_enabled').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_region_settings_region').on(table.region),
  index('idx_region_settings_is_active').on(table.isActive),
]);

export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('OPEN'),
  priority: varchar('priority', { length: 10 }).notNull().default('MEDIUM'),
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_support_tickets_user_id').on(table.userId),
  index('idx_support_tickets_status').on(table.status),
]);

export const restaurants = pgTable('restaurants', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  cuisineType: varchar('cuisine_type', { length: 100 }),
  address: varchar('address', { length: 500 }),
  coordinates: point('coordinates'),
  coverImage: varchar('cover_image', { length: 500 }),
  logoUrl: varchar('logo_url', { length: 500 }),
  openingHours: jsonb('opening_hours'),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('0'),
  totalOrders: integer('total_orders').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
  estimatedDeliveryTime: integer('estimated_delivery_time'),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }),
  minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_restaurants_vendor_id').on(table.vendorId),
  index('idx_restaurants_cuisine_type').on(table.cuisineType),
  index('idx_restaurants_status').on(table.status),
  index('idx_restaurants_is_active').on(table.isActive),
]);

export const menuItems = pgTable('menu_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('NGN'),
  image: varchar('image', { length: 500 }),
  category: varchar('category', { length: 100 }),
  isAvailable: boolean('is_available').notNull().default(true),
  isPopular: boolean('is_popular').notNull().default(false),
  preparationTime: integer('preparation_time'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_menu_items_restaurant_id').on(table.restaurantId),
  index('idx_menu_items_category').on(table.category),
  index('idx_menu_items_is_available').on(table.isAvailable),
]);

export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  menuItemId: uuid('menu_item_id').notNull().references(() => menuItems.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  specialInstructions: text('special_instructions'),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_cart_items_user_id').on(table.userId),
  index('idx_cart_items_restaurant_id').on(table.restaurantId),
]);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'restrict' }),
  riderId: uuid('rider_id').references(() => riders.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 30 }).notNull().default('PENDING'),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).notNull().default('0'),
  platformFee: numeric('platform_fee', { precision: 10, scale: 2 }).notNull().default('0'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  promoCode: varchar('promo_code', { length: 50 }),
  promoDiscount: numeric('promo_discount', { precision: 10, scale: 2 }).notNull().default('0'),
  deliveryAddress: varchar('delivery_address', { length: 500 }).notNull(),
  deliveryCoordinates: point('delivery_coordinates'),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('CARD'),
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('PENDING'),
  notes: text('notes'),
  estimatedDeliveryTime: timestamp('estimated_delivery_time', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  preparedAt: timestamp('prepared_at', { withTimezone: true }),
  pickedUpAt: timestamp('picked_up_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelledReason: varchar('cancelled_reason', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_orders_user_id').on(table.userId),
  index('idx_orders_restaurant_id').on(table.restaurantId),
  index('idx_orders_rider_id').on(table.riderId),
  index('idx_orders_status').on(table.status),
  index('idx_orders_created_at').on(table.createdAt),
]);

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  menuItemId: uuid('menu_item_id').notNull().references(() => menuItems.id, { onDelete: 'restrict' }),
  menuItemName: varchar('menu_item_name', { length: 200 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
  specialInstructions: text('special_instructions'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_order_items_order_id').on(table.orderId),
]);

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 30 }).notNull(),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_order_status_history_order_id').on(table.orderId),
]);

export const referrals = pgTable('referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  referrerId: uuid('referrer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refereeId: uuid('referee_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  referralCode: varchar('referral_code', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  rewardAmount: numeric('reward_amount', { precision: 10, scale: 2 }),
  rewardPaidAt: timestamp('reward_paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_referrals_referrer_id').on(table.referrerId),
  index('idx_referrals_referral_code').on(table.referralCode),
  index('idx_referrals_status').on(table.status),
]);

export const kycDocuments = pgTable('kyc_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  documentNumber: varchar('document_number', { length: 100 }),
  frontImage: varchar('front_image', { length: 500 }),
  backImage: varchar('back_image', { length: 500 }),
  selfieImage: varchar('selfie_image', { length: 500 }),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  rejectionReason: text('rejection_reason'),
  verifiedBy: uuid('verified_by').references(() => users.id, { onDelete: 'set null' }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_kyc_documents_user_id').on(table.userId),
  index('idx_kyc_documents_document_type').on(table.documentType),
  index('idx_kyc_documents_status').on(table.status),
]);

export const promoRedemptions = pgTable('promo_redemptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rideId: uuid('ride_id').references(() => rides.id, { onDelete: 'set null' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  code: varchar('code', { length: 50 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_promo_redemptions_user_id').on(table.userId),
  index('idx_promo_redemptions_code').on(table.code),
]);

export const serviceAreas = pgTable('service_areas', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  region: varchar('region', { length: 100 }).notNull(),
  coordinates: jsonb('coordinates').notNull(),
  centerLatitude: numeric('center_latitude', { precision: 10, scale: 8 }),
  centerLongitude: numeric('center_longitude', { precision: 11, scale: 8 }),
  radiusKm: numeric('radius_km', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  priority: integer('priority').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_service_areas_region').on(table.region),
  index('idx_service_areas_is_active').on(table.isActive),
]);

export const promoCodes = pgTable('promo_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  discountType: varchar('discount_type', { length: 20 }).notNull(),
  discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
  maxDiscount: numeric('max_discount', { precision: 10, scale: 2 }),
  minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }),
  maxUsage: integer('max_usage'),
  currentUsage: integer('current_usage').notNull().default(0),
  perUserLimit: integer('per_user_limit').notNull().default(1),
  applicableTo: varchar('applicable_to', { length: 50 }),
  validFrom: timestamp('valid_from', { withTimezone: true }).notNull(),
  validUntil: timestamp('valid_until', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_promo_codes_code').on(table.code),
  index('idx_promo_codes_is_active').on(table.isActive),
  index('idx_promo_codes_valid_from').on(table.validFrom),
]);

export const fleet = pgTable('fleet', {
  id: uuid('id').primaryKey().defaultRandom(),
  plateNumber: varchar('plate_number', { length: 20 }).notNull().unique(),
  model: varchar('model', { length: 100 }).notNull(),
  make: varchar('make', { length: 100 }).notNull(),
  year: integer('year'),
  color: varchar('color', { length: 30 }),
  vehicleType: varchar('vehicle_type', { length: 50 }).notNull().default('SEDAN'),
  capacity: integer('capacity').notNull().default(4),
  driverId: uuid('driver_id').references(() => users.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
  lastLocation: point('last_location'),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const vehicleTracking = pgTable('vehicle_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id').notNull().references(() => fleet.id, { onDelete: 'cascade' }),
  coordinates: point('coordinates').notNull(),
  speed: numeric('speed', { precision: 6, scale: 2 }),
  heading: numeric('heading', { precision: 5, scale: 2 }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
});

export const transportRoutes = pgTable('transport_routes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  origin: varchar('origin', { length: 200 }).notNull(),
  destination: varchar('destination', { length: 200 }).notNull(),
  distanceKm: numeric('distance_km', { precision: 8, scale: 2 }),
  estimatedDuration: integer('estimated_duration'),
  fare: numeric('fare', { precision: 10, scale: 2 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
