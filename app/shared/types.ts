export interface User {
  id: string;
  phone: string;
  email?: string | null;
  first_name: string;
  last_name: string;
  role: 'CUSTOMER' | 'RIDER' | 'VENDOR' | 'ADMIN';
  is_active: boolean;
  is_verified: boolean;
  profile_image_url?: string | null;
  rating?: number | null;
  region?: string;
  timezone?: string;
  preferred_language?: string;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiderProfile {
  id: string;
  user_id: string;
  driver_license_number?: string | null;
  license_expiry?: string | null;
  vehicle_type?: string | null;
  vehicle_plate?: string | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
  vehicle_color?: string | null;
  documents_verified: boolean;
  rating?: number | null;
  total_rides: number;
  acceptance_rate?: number | null;
  cancellation_rate?: number | null;
  average_rating?: number | null;
  is_online: boolean;
  is_available: boolean;
  online_since?: string | null;
  bank_account?: string | null;
  bank_name?: string | null;
}

export interface Ride {
  id: string;
  user_id: string;
  rider_id?: string | null;
  status: 'REQUESTED' | 'ACCEPTED' | 'RIDER_ARRIVING' | 'RIDER_ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  pickup_address: string;
  dropoff_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_latitude: number;
  dropoff_longitude: number;
  fare?: number | null;
  distance_km?: number | null;
  duration_minutes?: number | null;
  platform_fee?: number | null;
  payment_method?: string | null;
  rating?: number | null;
  review?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface Delivery {
  id: string;
  user_id: string;
  rider_id?: string | null;
  vendor_id?: string | null;
  status: 'REQUESTED' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  category: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_latitude: number;
  dropoff_longitude: number;
  total_fare?: number | null;
  distance_km?: number | null;
  payment_method?: string | null;
  notes?: string | null;
  created_at: string;
  delivered_at?: string | null;
}

export interface Payment {
  id: string;
  user_id: string;
  ride_id?: string | null;
  delivery_id?: string | null;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  method: 'CASH' | 'WALLET' | 'PAYSTACK' | 'FLUTTERWAVE' | 'CARD' | 'USSD';
  reference?: string | null;
  provider_ref?: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  reference?: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at: string;
  updated_at: string;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  attachments?: string[];
  created_at: string;
}

export interface DashboardMetrics {
  total_users: number;
  total_riders: number;
  active_rides: number;
  completed_rides: number;
  total_revenue: number;
  avg_rating: number;
}

export interface FraudAlert {
  id: string;
  user_id: string;
  ride_id?: string | null;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_ALARM';
  created_at: string;
  resolved_at?: string | null;
}

export interface RegionSettings {
  id: string;
  region: string;
  currency: string;
  timezone: string;
  commission_percentage: number;
  minimum_fare: number;
  per_km_rate: number;
  per_minute_rate: number;
  delivery_base_fee: number;
  delivery_per_km_rate: number;
  is_active: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'RIDE' | 'DELIVERY' | 'PAYMENT' | 'SYSTEM';
  is_read: boolean;
  created_at: string;
}

export interface OTPRequest {
  phone_number: string;
}

export interface OTPVerify {
  phone_number: string;
  otp_code: string;
}

export interface UserLogin {
  phone: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string | null;
  token_type: string;
  expires_in: number;
  user: User;
}
