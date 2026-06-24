import { useEffect, useState } from 'react';
import api from '../../../shared/lib/api';
import { DataTable } from '../../components/common/DataTable';

export function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get('/admin/payments');
        setPayments(res.data);
      } catch (err) {
        console.error('Failed to fetch payments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const statusColors: Record<string, string> = {
    SUCCESS: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    REFUNDED: 'bg-purple-100 text-purple-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };

  const columns = [
    { key: 'reference', label: 'Reference', render: (v: string) => v || '-' },
    { key: 'amount', label: 'Amount', render: (v: number) => `₦${(v || 0).toLocaleString()}` },
    { key: 'method', label: 'Method', render: (v: string) => v || '-' },
    { key: 'status', label: 'Status', render: (v: string) => (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[v] || 'bg-gray-100 text-gray-800'}`}>{v}</span>
    )},
    { key: 'created_at', label: 'Date', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payments</h2>
      <div className="card">
        <DataTable columns={columns} data={payments} />
      </div>
    </div>
  );
}
