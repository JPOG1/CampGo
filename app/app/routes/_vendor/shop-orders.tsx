import { useEffect, useState } from 'react';
import api from '../../../shared/lib/api';
import { toast } from 'sonner';

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PROCESSING',
  PROCESSING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

interface Order {
  id: string;
  customer_name: string;
  status: string;
  total_amount: string;
  delivery_address: string;
  payment_method: string;
  notes: string;
  created_at: string;
  items: OrderItem[];
}

export function ShopOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/vendor/shop-orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      const res = await api.patch(`/vendor/shop-orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data : o)));
      toast.success(`Order ${status.toLowerCase()}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update order');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      CONFIRMED: 'bg-blue-100 text-blue-700',
      PROCESSING: 'bg-purple-100 text-purple-700',
      SHIPPED: 'bg-indigo-100 text-indigo-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 rounded" />)}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="card text-center py-8 text-gray-500">
        No shop orders yet.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop Orders</h2>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">
                    Order #{order.id.slice(0, 8)}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {order.customer_name} &middot; {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <span className="text-lg font-bold text-primary">₦{Number(order.total_amount).toLocaleString()}</span>
            </div>

            <div className="border-t border-gray-100 pt-3 mb-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm py-1">
                  <span className="text-gray-600">{item.product_name} × {item.quantity}</span>
                  <span className="font-medium">₦{Number(item.subtotal).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-500 mb-3">
              <p>Delivery: {order.delivery_address}</p>
              {order.notes && <p>Notes: {order.notes}</p>}
              <p>Payment: {order.payment_method}</p>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-100">
              {NEXT_STATUS[order.status] && (
                <button
                  onClick={() => handleUpdateStatus(order.id, NEXT_STATUS[order.status])}
                  disabled={updating === order.id}
                  className="btn btn-primary text-sm disabled:opacity-60"
                >
                  {updating === order.id ? 'Updating...' : `Mark as ${NEXT_STATUS[order.status]}`}
                </button>
              )}
              {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                <button
                  onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                  disabled={updating === order.id}
                  className="btn btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-60"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
