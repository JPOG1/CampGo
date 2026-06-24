import { useEffect, useRef, useState } from 'react';
import api from '../../../shared/lib/api';
import { getSocket } from '../../../shared/lib/socket';
import { LiveMap } from '../../components/tracking/LiveMap';
import type { Ride } from '../../../shared/types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';

interface PriceEstimate {
  estimated_fare: number;
  distance_km: number;
  duration_minutes: number;
}

interface RiderInfo {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  rating: number;
  vehicle_type: string;
  vehicle_color: string;
  vehicle_plate: string;
}

export function RidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [dropoffLat, setDropoffLat] = useState('');
  const [dropoffLng, setDropoffLng] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [showForm, setShowForm] = useState(true);

  const [trackingRide, setTrackingRide] = useState<Ride | null>(null);
  const [driverInfo, setDriverInfo] = useState<RiderInfo | null>(null);
  const [driverLat, setDriverLat] = useState<number | undefined>();
  const [driverLng, setDriverLng] = useState<number | undefined>();
  const trackRef = useRef<HTMLDivElement | null>(null);

  const fetchRides = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filter !== 'ALL' ? { status: filter } : {};
      const res = await api.get('/rides', { params });
      setRides(res.data);
    } catch (err) {
      console.error('Failed to fetch rides:', err);
      setError('Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [filter]);

  useEffect(() => {
    const socket = getSocket();
    const handler = (data: any) => {
      setRides((prev) => prev.map((r) => r.id === data.id ? { ...r, ...data } : r));
      if (trackingRide?.id === data.id) {
        setTrackingRide((prev) => prev ? { ...prev, ...data } : prev);
      }
    };
    socket.on('ride:status', handler);
    return () => { socket.off('ride:status', handler); };
  }, [trackingRide?.id]);

  useEffect(() => {
    if (!trackingRide?.id) return;
    const socket = getSocket();
    socket.emit('join-ride', trackingRide.id);
    const locHandler = (data: any) => {
      if (data.rideId === trackingRide.id) {
        setDriverLat(data.latitude);
        setDriverLng(data.longitude);
      }
    };
    socket.on('RIDER_LOCATION', locHandler);
    return () => {
      socket.off('RIDER_LOCATION', locHandler);
      socket.emit('leave-ride', trackingRide.id);
    };
  }, [trackingRide?.id]);

  useEffect(() => {
    if (!pickupAddress || !dropoffAddress) { setPriceEstimate(null); return; }
    const timer = setTimeout(async () => {
      setEstimating(true);
      try {
        const res = await api.get('/rides/estimate', {
          params: {
            pickup_latitude: pickupLat || 6.5244,
            pickup_longitude: pickupLng || 3.3792,
            dropoff_latitude: dropoffLat || 6.5010,
            dropoff_longitude: dropoffLng || 3.3480,
          },
        });
        setPriceEstimate(res.data);
      } catch {
        setPriceEstimate(null);
      } finally {
        setEstimating(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [pickupAddress, dropoffAddress, pickupLat, pickupLng, dropoffLat, dropoffLng]);

  const handleRequestRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupAddress.trim() || !dropoffAddress.trim()) return;
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
      setRides((prev) => [res.data, ...prev]);
      setPickupAddress('');
      setDropoffAddress('');
      setPickupLat('');
      setPickupLng('');
      setDropoffLat('');
      setDropoffLng('');
      setPriceEstimate(null);
      setShowForm(false);
    } catch (err: any) {
      console.error('Failed to request ride:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackRide = (ride: Ride) => {
    setTrackingRide(ride);
    setDriverInfo(null);
    setDriverLat(ride.pickup_latitude);
    setDriverLng(ride.pickup_longitude);
    if (ride.rider_id) {
      api.get(`/rides/${ride.id}/driver`).then((res) => setDriverInfo(res.data)).catch(() => {});
    }
    setTimeout(() => {
      trackRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const filters = ['ALL', 'REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  const statusColors: Record<string, string> = {
    REQUESTED: 'badge',
    ACCEPTED: 'badge-info',
    RIDER_ARRIVING: 'badge-info',
    RIDER_ARRIVED: 'badge-info',
    IN_PROGRESS: 'badge-warning',
    COMPLETED: 'badge-success',
    CANCELLED: 'badge-error',
    NO_SHOW: 'badge-error',
  };

  return (
    <div>
      <div ref={trackRef} />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Rides</h2>
        <button onClick={() => setShowForm((v) => !v)} className="btn btn-primary text-sm">
          {showForm ? 'Close' : 'Request Ride'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
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

            {estimating && <p className="text-sm text-gray-500">Estimating price...</p>}
            {priceEstimate && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Estimated fare</span><span className="font-bold text-primary">₦{priceEstimate.estimated_fare.toLocaleString()}</span></div>
                <div className="flex justify-between text-gray-500"><span>Distance</span><span>{priceEstimate.distance_km.toFixed(1)} km</span></div>
                <div className="flex justify-between text-gray-500"><span>Duration</span><span>{priceEstimate.duration_minutes} min</span></div>
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn btn-primary w-full disabled:opacity-60">
              {submitting ? 'Requesting...' : 'Find a Rider'}
            </button>
          </form>
        </div>
      )}

      {trackingRide && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Live Tracking</h3>
            <button onClick={() => setTrackingRide(null)} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
          </div>
          {driverInfo && (
            <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {driverInfo.first_name[0]}{driverInfo.last_name[0]}
              </div>
              <div className="text-sm">
                <p className="font-medium">{driverInfo.first_name} {driverInfo.last_name}</p>
                <p className="text-gray-500">{driverInfo.vehicle_color} {driverInfo.vehicle_type} • {driverInfo.vehicle_plate}</p>
              </div>
              <div className="ml-auto flex items-center gap-1 text-sm text-yellow-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                {driverInfo.rating?.toFixed(1)}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 mb-2">{trackingRide.pickup_address} → {trackingRide.dropoff_address}</p>
          <LiveMap
            pickupLat={trackingRide.pickup_latitude}
            pickupLng={trackingRide.pickup_longitude}
            dropoffLat={trackingRide.dropoff_latitude}
            dropoffLng={trackingRide.dropoff_longitude}
            driverLat={driverLat}
            driverLng={driverLng}
          />
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0) + f.slice(1).toLowerCase().replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchRides} />
      ) : rides.length > 0 ? (
        <div className="space-y-4">
          {rides.map((ride) => (
            <div key={ride.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <span className={`badge ${statusColors[ride.status] || 'badge'}`}>{ride.status}</span>
                <span className="text-sm text-gray-500">{new Date(ride.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">From:</span> {ride.pickup_address}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">To:</span> {ride.dropoff_address}
              </p>
              {ride.fare && (
                <p className="text-lg font-bold text-primary mt-2">₦{ride.fare.toLocaleString()}</p>
              )}
              {ride.status === 'IN_PROGRESS' && (
                <button onClick={() => handleTrackRide(ride)} className="btn btn-primary text-sm mt-3">
                  Track Live
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-8 text-gray-500">No rides found</div>
      )}
    </div>
  );
}
