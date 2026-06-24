import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/auth';
import api from '../../../shared/lib/api';
import { toast } from 'sonner';
import type { Ride } from '../../../shared/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';

export function CustomerDashboard() {
  const { user } = useAuthStore();
  const [activeRides, setActiveRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [dropoffLat, setDropoffLat] = useState('');
  const [dropoffLng, setDropoffLng] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const fetchRides = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/rides', { params: { status: 'ACTIVE' } });
      setActiveRides(res.data);
    } catch (err) {
      console.error('Failed to fetch rides:', err);
      setError('Failed to load active rides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const handleRequestRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      toast.error('Please fill in pickup and dropoff addresses');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/rides', {
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        pickup_latitude: pickupLat ? Number(pickupLat) : 6.5244,
        pickup_longitude: pickupLng ? Number(pickupLng) : 3.3792,
        dropoff_latitude: dropoffLat ? Number(dropoffLat) : 6.5010,
        dropoff_longitude: dropoffLng ? Number(dropoffLng) : 3.3480,
        payment_method: paymentMethod,
      });
      setActiveRides((prev) => [res.data, ...prev]);
      setPickupAddress('');
      setDropoffAddress('');
      toast.success('Ride requested! A rider will be assigned soon.');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to request ride');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Welcome, {user?.first_name || 'User'}!
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Request a Ride</h3>
          <form onSubmit={handleRequestRide} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
              <input type="text" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="Enter pickup address" required className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={pickupLat} onChange={(e) => setPickupLat(e.target.value)} placeholder="Lat (optional)" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              <input type="text" value={pickupLng} onChange={(e) => setPickupLng(e.target.value)} placeholder="Lng (optional)" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Address</label>
              <input type="text" value={dropoffAddress} onChange={(e) => setDropoffAddress(e.target.value)} placeholder="Enter destination" required className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={dropoffLat} onChange={(e) => setDropoffLat(e.target.value)} placeholder="Lat (optional)" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              <input type="text" value={dropoffLng} onChange={(e) => setDropoffLng(e.target.value)} placeholder="Lng (optional)" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="WALLET">Wallet</option>
              </select>
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary w-full disabled:opacity-60">
              {submitting ? 'Requesting...' : 'Find a Rider'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Request a Delivery</h3>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); window.location.href = '/rides'; }}>
            <p className="text-sm text-gray-500">Send a parcel, food, or document anywhere.</p>
            <a href="/rides" className="btn btn-outline w-full text-center block">Go to Deliveries</a>
          </form>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} height="h-24" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchRides} />
      ) : activeRides.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold mb-4">Active Rides</h3>
          <div className="space-y-4">
            {activeRides.map((ride) => (
              <div key={ride.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-medium">{ride.pickup_address} → {ride.dropoff_address}</p>
                  <span className={`inline-block mt-1 badge ${
                    ride.status === 'IN_PROGRESS' ? 'badge-warning' :
                    ride.status === 'COMPLETED' ? 'badge-success' :
                    ride.status === 'CANCELLED' ? 'badge-error' : 'badge'
                  }`}>
                    {ride.status}
                  </span>
                </div>
                {ride.fare && <p className="text-lg font-bold text-primary">₦{Number(ride.fare).toLocaleString()}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card text-center py-8 text-gray-500">
          No active rides. Request one above!
        </div>
      )}
    </div>
  );
}
