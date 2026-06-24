import { useEffect, useState } from 'react';
import api from '../../../shared/lib/api';
import { DataTable } from '../../components/common/DataTable';

export function AdminRides() {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const res = await api.get('/admin/rides');
        setRides(res.data);
      } catch (err) {
        console.error('Failed to fetch rides:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, []);

  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-indigo-100 text-indigo-800',
    REQUESTED: 'bg-purple-100 text-purple-800',
  };

  const statuses = ['ALL', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  const filtered = statusFilter === 'ALL' ? rides : rides.filter((r) => r.status === statusFilter);

  const columns = [
    { key: 'route', label: 'Pickup → Dropoff', render: (_: any, row: any) => {
      const pickup = row.pickup_location || row.pickup_address || '-';
      const dropoff = row.dropoff_location || row.dropoff_address || '-';
      return <span className="text-sm">{pickup} → {dropoff}</span>;
    }},
    { key: 'status', label: 'Status', render: (v: string) => (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[v] || 'bg-gray-100 text-gray-800'}`}>{v}</span>
    )},
    { key: 'fare', label: 'Fare', render: (v: number | null) => v ? `₦${v.toLocaleString()}` : '-' },
    { key: 'created_at', label: 'Date', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Rides Management</h2>

      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'ALL' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="card">
        <DataTable columns={columns} data={filtered} />
      </div>
    </div>
  );
}
