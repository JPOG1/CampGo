import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/auth';
import api from '../../../shared/lib/api';

export function VendorDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ total_orders: 0, active_orders: 0, revenue: 0, rating: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/food/vendor/dashboard');
        setStats(res.data);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Total Orders', value: stats.total_orders, color: 'bg-blue-500' },
    { label: 'Active Orders', value: stats.active_orders, color: 'bg-green-500' },
    { label: 'Revenue', value: `₦${stats.revenue.toLocaleString()}`, color: 'bg-primary' },
    { label: 'Rating', value: `${stats.rating.toFixed(1)} ★`, color: 'bg-yellow-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Welcome, {user?.first_name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className={`w-10 h-10 ${c.color} rounded-lg flex items-center justify-center mb-3`}>
              <span className="text-white font-bold text-lg">{c.label[0]}</span>
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-sm text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
