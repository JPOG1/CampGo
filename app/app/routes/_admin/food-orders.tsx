import { useEffect, useState } from 'react';
import api from '../../../shared/lib/api';
import { DataTable } from '../../components/common/DataTable';

export function AdminFoodOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/admin/food/orders');
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to fetch food orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PREPARING: 'bg-indigo-100 text-indigo-800',
    READY: 'bg-purple-100 text-purple-800',
    OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-green-100 text-green-800',
  };

  const columns = [
    { key: 'id', label: 'Order ID', render: (v: string) => v?.slice(0, 8) + '...' },
    { key: 'customer', label: 'Customer', render: (_: any, row: any) => row.customer_name || row.user?.first_name ? `${row.user?.first_name || ''} ${row.user?.last_name || ''}`.trim() : row.user_id?.slice(0, 8) + '...' || '-' },
    { key: 'restaurant', label: 'Restaurant', render: (_: any, row: any) => row.restaurant_name || row.restaurant?.name || '-' },
    { key: 'total', label: 'Amount', render: (v: number, row: any) => `₦${((v || row.total_amount || 0)).toLocaleString()}` },
    { key: 'status', label: 'Status', render: (v: string) => (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[v] || 'bg-gray-100 text-gray-800'}`}>{v?.replace(/_/g, ' ')}</span>
    )},
    { key: 'created_at', label: 'Date', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Food Orders</h2>
      <p className="text-gray-600 mb-6">Manage food delivery orders</p>
      <div className="card">
        <DataTable columns={columns} data={orders} />
      </div>
    </div>
  );
}
