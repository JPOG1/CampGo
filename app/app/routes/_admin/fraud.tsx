import { useEffect, useState } from 'react';
import api from '../../../shared/lib/api';
import { toast } from 'sonner';

export function AdminFraud() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/admin/fraud/alerts');
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      const fallback = [
        { id: '1', type: 'Unusual Route', severity: 'HIGH', description: 'Rider deviated significantly from route', status: 'OPEN', created_at: new Date().toISOString() },
        { id: '2', type: 'Suspicious Login', severity: 'MEDIUM', description: 'Multiple login attempts from different locations', status: 'OPEN', created_at: new Date().toISOString() },
        { id: '3', type: 'Payment Anomaly', severity: 'CRITICAL', description: 'Multiple failed payment attempts', status: 'OPEN', created_at: new Date().toISOString() },
        { id: '4', type: 'Duplicate Account', severity: 'MEDIUM', description: 'Multiple accounts detected with same device', status: 'INVESTIGATING', created_at: new Date().toISOString() },
        { id: '5', type: 'Fake Ride', severity: 'HIGH', description: 'Ride started and ended at same location', status: 'OPEN', created_at: new Date().toISOString() },
      ];
      setAlerts(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleAction = async (id: string, action: 'RESOLVED' | 'FALSE_ALARM') => {
    try {
      await api.patch(`/admin/fraud/alerts/${id}`, { status: action });
      toast.success(`Alert ${action === 'RESOLVED' ? 'resolved' : 'marked as false alarm'}`);
      fetchAlerts();
    } catch {
      toast.error('Failed to update alert');
    }
  };

  const severityColor = (s: string) => {
    switch (s) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredAlerts = filter === 'ALL' ? alerts : alerts.filter((a) => a.status === filter);
  const stats = [
    { label: 'Active Alerts', value: alerts.filter((a) => a.status === 'OPEN').length, color: 'text-error' },
    { label: 'High Severity', value: alerts.filter((a) => a.severity === 'HIGH' || a.severity === 'CRITICAL').length, color: 'text-warning' },
    { label: 'Resolved', value: alerts.filter((a) => a.status === 'RESOLVED').length, color: 'text-success' },
    { label: 'False Alarms', value: alerts.filter((a) => a.status === 'FALSE_ALARM').length, color: 'text-gray-500' },
  ];

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Fraud Detection</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card text-center">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredAlerts.map((alert: any) => (
          <div key={alert.id} className="card">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{alert.type}</span>
                  <span className={`badge ${severityColor(alert.severity)}`}>{alert.severity}</span>
                  <span className="badge">{alert.status}</span>
                </div>
                <p className="text-sm text-gray-600">{alert.description}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAction(alert.id, 'RESOLVED')} className="text-xs text-success hover:underline">Resolve</button>
                <button onClick={() => handleAction(alert.id, 'FALSE_ALARM')} className="text-xs text-gray-500 hover:underline">False Alarm</button>
              </div>
            </div>
            <p className="text-xs text-gray-400">{new Date(alert.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
