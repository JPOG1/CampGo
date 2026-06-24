import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/auth';
import api from '../../../shared/lib/api';
import type { Ride, RiderProfile } from '../../../shared/types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';

export function RiderDashboard() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, ridesRes] = await Promise.all([
        api.get('/rider/profile'),
        api.get('/rides', { params: { status: 'COMPLETED' } }),
      ]);
      setProfile(profileRes.data);
      setRecentRides(ridesRes.data.slice(0, 5));
      setOnline(profileRes.data?.is_online || false);
    } catch (err) {
      console.error('Failed to fetch rider data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Rider Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Total Rides</p>
          <p className="text-3xl font-bold text-primary">{profile?.total_rides || 0}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Earnings</p>
          <p className="text-3xl font-bold text-success">₦0</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Rating</p>
          <p className="text-3xl font-bold text-warning">{profile?.average_rating?.toFixed(1) || 'N/A'}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Status</p>
          <button
            onClick={() => setOnline(!online)}
            className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium ${
              online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {online ? 'Online' : 'Offline'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Rides</h3>
        {recentRides.length > 0 ? (
          <div className="space-y-3">
            {recentRides.map((ride) => (
              <div key={ride.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm">{ride.pickup_address} → {ride.dropoff_address}</p>
                  <p className="text-xs text-gray-500">{new Date(ride.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₦{ride.fare?.toLocaleString() || 0}</p>
                  <div className="flex text-yellow-400 text-xs">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>{i < (ride.rating || 0) ? '★' : '☆'}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">No rides yet</p>
        )}
      </div>
    </div>
  );
}
