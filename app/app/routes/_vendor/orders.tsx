import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../../../shared/lib/api';

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  customer_name: string;
  items: { name: string; quantity: number; price: number }[];
}

export function VendorOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/food/vendor/orders');
      setOrders(res.data);
    } catch { toast.error('Failed to load orders'); }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/food/vendor/orders/${id}`, { status });
      toast.success(`Order ${status.toLowerCase().replace(/_/g, ' ')}`);
      fetchOrders();
    } catch { toast.error('Failed to update order'); }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    PREPARING: 'bg-indigo-100 text-indigo-700',
    READY_FOR_PICKUP: 'bg-green-100 text-green-700',
    DELIVERED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  if (loading) return <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm mt-1">Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
                  <p className="font-medium mt-1">{order.customer_name}</p>
                </div>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span>{item.name} × {item.quantity}</span>
                    <span className="text-gray-600">₦{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2 mt-2">
                  <span>Total</span>
                  <span>₦{order.total_amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                {order.status === 'PENDING' && (
                  <>
                    <button onClick={() => updateStatus(order.id, 'CONFIRMED')} className="btn btn-primary px-4 py-1.5 text-sm">Accept</button>
                    <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="btn px-4 py-1.5 text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Decline</button>
                  </>
                )}
                {order.status === 'CONFIRMED' && (
                  <button onClick={() => updateStatus(order.id, 'PREPARING')} className="btn btn-primary px-4 py-1.5 text-sm">Start Preparing</button>
                )}
                {order.status === 'PREPARING' && (
                  <button onClick={() => updateStatus(order.id, 'READY_FOR_PICKUP')} className="btn btn-primary px-4 py-1.5 text-sm">Mark Ready</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
