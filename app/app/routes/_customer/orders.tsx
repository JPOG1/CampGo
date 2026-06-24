import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import api from '../../../shared/lib/api';
import { ErrorState } from '../../components/common/ErrorState';

interface OrderItem {
  id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

interface Order {
  id: string;
  restaurant_id: string;
  status: string;
  subtotal: string;
  delivery_fee: string;
  total_amount: string;
  payment_method: string;
  payment_status: string;
  delivery_address: string;
  created_at: string;
  items: OrderItem[];
}

const TABS = [
  { key: '', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'DELIVERED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_TIMELINE: Record<string, string[]> = {
  PENDING: ['Order placed', 'Waiting for acceptance'],
  ACCEPTED: ['Order placed', 'Accepted by restaurant'],
  PREPARING: ['Order placed', 'Accepted', 'Being prepared'],
  READY: ['Order placed', 'Accepted', 'Prepared', 'Ready for pickup'],
  PICKED_UP: ['Order placed', 'Accepted', 'Prepared', 'Picked up', 'On the way'],
  DELIVERED: ['Order placed', 'Accepted', 'Prepared', 'Picked up', 'Delivered'],
};

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('');

  const buildParams = () => {
    if (!activeTab) return {};
    if (activeTab === 'ACTIVE') return { status: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP'] };
    return { status: activeTab };
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams();
      const res = await api.get('/food/orders', { params });
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const statusColors: Record<string, string> = {
    PENDING: 'badge-warning',
    ACCEPTED: 'badge-info',
    PREPARING: 'badge-info',
    READY: 'badge',
    PICKED_UP: 'badge',
    DELIVERED: 'badge-success',
    CANCELLED: 'badge-error',
  };

  const isActiveStatus = (status: string) => !['DELIVERED', 'CANCELLED'].includes(status);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h2>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-32 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOrders} />
      ) : orders.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-gray-500 mb-4">No orders yet</p>
          <Link to="/restaurants" className="btn btn-primary">Order Food</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} to="/orders/$id" params={{ id: order.id }} className="card block hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`inline-block badge ${statusColors[order.status] || 'badge'}`}>{order.status}</span>
                  <span className="ml-2 text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <span className="text-lg font-bold text-primary">₦{Number(order.total_amount).toLocaleString()}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {order.items?.slice(0, 3).map((item) => (
                  <p key={item.id}>{item.quantity}x {item.menu_item_name}</p>
                ))}
                {(order.items?.length || 0) > 3 && (
                  <p className="text-gray-400">+{order.items.length - 3} more items</p>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Payment: {order.payment_method} • {order.payment_status}
              </div>
              {isActiveStatus(order.status) && STATUS_TIMELINE[order.status] && (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  {STATUS_TIMELINE[order.status].map((step, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${i < STATUS_TIMELINE[order.status]!.length - 1 ? 'bg-primary' : 'bg-gray-300'}`} />
                      <span className={i < STATUS_TIMELINE[order.status]!.length - 1 ? 'text-primary' : 'text-gray-400'}>{step}</span>
                      {i < STATUS_TIMELINE[order.status]!.length - 1 && <span className="text-gray-300 mx-1">—</span>}
                    </div>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
