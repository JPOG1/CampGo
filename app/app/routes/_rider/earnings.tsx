import { useEffect, useState } from 'react';
import api from '../../../shared/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function RiderEarnings() {
  const [period, setPeriod] = useState('WEEK');
  const [earnings, setEarnings] = useState({ total_earnings: 0, total_rides: 0, avg_rating: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await api.get('/rider/earnings', { params: { period } });
        setEarnings(res.data);
      } catch (err) {
        console.error('Failed to fetch earnings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, [period]);

  const mockChartData = [
    { day: 'Mon', earnings: 12000 },
    { day: 'Tue', earnings: 8500 },
    { day: 'Wed', earnings: 15000 },
    { day: 'Thu', earnings: 10200 },
    { day: 'Fri', earnings: 18000 },
    { day: 'Sat', earnings: 22000 },
    { day: 'Sun', earnings: 16500 },
  ];

  const periods = ['WEEK', 'MONTH', 'YEAR'];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Earnings</h2>

      <div className="flex gap-2 mb-6">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p.charAt(0) + p.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Total Earnings</p>
          <p className="text-3xl font-bold text-success">₦{Number(earnings.total_earnings).toLocaleString()}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Total Rides</p>
          <p className="text-3xl font-bold text-primary">{earnings.total_rides}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Avg Rating</p>
          <p className="text-3xl font-bold text-warning">{earnings.avg_rating?.toFixed(1) || 'N/A'}</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Daily Earnings</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="earnings" fill="#FF6B35" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
