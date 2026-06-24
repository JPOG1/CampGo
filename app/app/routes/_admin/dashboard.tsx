import { useEffect, useState } from 'react';
import api from '../../../shared/lib/api';
import { StatCard } from '../../components/dashboard/StatCard';
import { DataTable } from '../../components/common/DataTable';

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, ridesRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/rides'),
        ]);
        setStats(statsRes.data);
        setRides(Array.isArray(ridesRes.data) ? ridesRes.data.slice(0, 10) : []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const recentRidesColumns = [
    { key: 'id', label: 'Ride ID', render: (v: string) => v?.slice(0, 8) + '...' },
    { key: 'status', label: 'Status', render: (v: string) => {
      const colors: Record<string, string> = { COMPLETED: 'badge-success', CANCELLED: 'badge-error', PENDING: 'badge-warning', IN_PROGRESS: 'badge-info', ACCEPTED: 'badge-info' };
      return <span className={`badge ${colors[v] || 'badge'}`}>{v}</span>;
    }},
    { key: 'fare', label: 'Fare', render: (v: number | null) => v ? `₦${v.toLocaleString()}` : '-' },
    { key: 'created_at', label: 'Date', render: (v: string) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard title="Total Users" value={stats?.total_users || 0} icon={<UsersIcon />} />
        <StatCard title="Total Riders" value={stats?.total_riders || 0} icon={<TruckIcon />} />
        <StatCard title="Active Rides" value={stats?.active_rides || 0} icon={<ChartIcon />} />
        <StatCard title="Completed Rides" value={stats?.completed_rides || 0} icon={<CheckIcon />} />
        <StatCard title="Total Revenue" value={`₦${(stats?.total_revenue || 0).toLocaleString()}`} icon={<CashIcon />} />
        <StatCard title="Avg Rating" value={stats?.avg_rating ? Number(stats.avg_rating).toFixed(1) : '0.0'} icon={<StarIcon />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Rides</h3>
          <DataTable columns={recentRidesColumns} data={rides} />
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a href="/admin/users" className="btn btn-outline w-full justify-start">Manage Users</a>
            <a href="/admin/rides" className="btn btn-outline w-full justify-start">View Rides</a>
            <a href="/admin/payments" className="btn btn-outline w-full justify-start">View Payments</a>
            <a href="/admin/analytics" className="btn btn-outline w-full justify-start">Full Analytics</a>
            <a href="/admin/food-orders" className="btn btn-outline w-full justify-start">Food Orders</a>
            <a href="/admin/reports" className="btn btn-outline w-full justify-start">Generate Reports</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>); }
function TruckIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>); }
function ChartIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>); }
function CashIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>); }
function CheckIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>); }
function StarIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>); }
