import { useEffect, useState } from 'react';
import api from '../../../shared/lib/api';
import { Chart } from '../../components/dashboard/Chart';

export function AdminAnalytics() {
  const [revenue, setRevenue] = useState<any>(null);
  const [users, setUsers] = useState<any>(null);
  const [rides, setRides] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [revRes, usrRes, rideRes] = await Promise.all([
          api.get('/admin/analytics/revenue'),
          api.get('/admin/analytics/users'),
          api.get('/admin/analytics/rides'),
        ]);
        setRevenue(revRes.data);
        setUsers(usrRes.data);
        setRides(rideRes.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const dailyRevenue = (revenue?.daily_breakdown || []).slice(-7).map((d: any) => ({
    name: new Date(d.date).toLocaleDateString('en', { weekday: 'short' }),
    revenue: Number(d.revenue),
  }));

  const dailyRides = (rides?.daily_rides || []).slice(-7).map((d: any) => ({
    name: new Date(d.date).toLocaleDateString('en', { weekday: 'short' }),
    rides: Number(d.rides),
  }));

  const dailySignups = (users?.daily_signups || []).slice(-7).map((d: any) => ({
    name: new Date(d.date).toLocaleDateString('en', { weekday: 'short' }),
    users: Number(d.users),
  }));

  const byRole = users?.by_role || {};
  const byStatus = rides?.by_status || {};

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics & Insights</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">₦{(revenue?.total_revenue || 0).toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Ride Revenue</p>
          <p className="text-2xl font-bold text-gray-900">₦{(revenue?.ride_revenue || 0).toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Food Revenue</p>
          <p className="text-2xl font-bold text-gray-900">₦{(revenue?.food_revenue || 0).toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{(users?.total_users || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Chart data={dailyRevenue.length > 0 ? dailyRevenue : fallbackRevenue} type="bar" dataKey="revenue" title="Revenue (7 days)" />
        <Chart data={dailyRides.length > 0 ? dailyRides : fallbackRides} type="line" dataKey="rides" title="Daily Rides (7 days)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart data={dailySignups.length > 0 ? dailySignups : fallbackSignups} type="bar" dataKey="users" title="User Signups (7 days)" />

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Ride Status Distribution</h3>
          {Object.keys(byStatus).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28">{status.replace('_', ' ')}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(Number(count) / Math.max(...Object.values(byStatus).map(Number)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">{String(count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No ride data available</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {Object.keys(byRole).length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Users by Role</h3>
            <div className="space-y-2">
              {Object.entries(byRole).map(([role, count]) => (
                <div key={role} className="flex justify-between">
                  <span className="text-gray-600">{role}</span>
                  <span className="font-semibold">{String(count)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-500">Ride Revenue</span><span className="font-semibold">₦{(revenue?.ride_revenue || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Food Revenue</span><span className="font-semibold">₦{(revenue?.food_revenue || 0).toLocaleString()}</span></div>
            <hr />
            <div className="flex justify-between text-lg"><span className="font-bold">Total</span><span className="font-bold text-primary">₦{(revenue?.total_revenue || 0).toLocaleString()}</span></div>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Total Rides</h3>
          <p className="text-3xl font-bold text-primary">{(rides?.total_rides || revenue?.total_rides || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

const fallbackRevenue = [
  { name: 'Mon', revenue: 0 }, { name: 'Tue', revenue: 0 }, { name: 'Wed', revenue: 0 },
  { name: 'Thu', revenue: 0 }, { name: 'Fri', revenue: 0 }, { name: 'Sat', revenue: 0 }, { name: 'Sun', revenue: 0 },
];

const fallbackRides = [
  { name: 'Mon', rides: 0 }, { name: 'Tue', rides: 0 }, { name: 'Wed', rides: 0 },
  { name: 'Thu', rides: 0 }, { name: 'Fri', rides: 0 }, { name: 'Sat', rides: 0 }, { name: 'Sun', rides: 0 },
];

const fallbackSignups = [
  { name: 'Mon', users: 0 }, { name: 'Tue', users: 0 }, { name: 'Wed', users: 0 },
  { name: 'Thu', users: 0 }, { name: 'Fri', users: 0 }, { name: 'Sat', users: 0 }, { name: 'Sun', users: 0 },
];
