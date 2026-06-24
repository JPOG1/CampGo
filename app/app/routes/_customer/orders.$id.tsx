import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from '@tanstack/react-router';
import api from '../../../shared/lib/api';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

interface StatusHistory {
  id: string;
  status: string;
  notes: string;
  created_at: string;
}

interface Order {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  status: string;
  subtotal: string;
  delivery_fee: string;
  platform_fee: string;
  total_amount: string;
  promo_discount: string;
  delivery_address: string;
  payment_method: string;
  payment_status: string;
  notes: string;
  estimated_delivery_time: string;
  accepted_at: string;
  prepared_at: string;
  picked_up_at: string;
  delivered_at: string;
  cancelled_at: string;
  cancelled_reason: string;
  created_at: string;
  items: OrderItem[];
  status_history: StatusHistory[];
}

export function OrderDetailPage() {
  const { id } = useParams({ from: '/orders/$id' as any });
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/food/orders/${id}`);
        setOrder(res.data);
      } catch (err) {
        console.error('Failed to fetch order:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleReorder = async () => {
    setReordering(true);
    try {
      if (!order) return;
      for (const item of order.items) {
        await api.post('/food/cart', {
          restaurant_id: order.restaurant_id,
          menu_item_id: item.id,
          quantity: item.quantity,
        });
      }
      toast.success('Items added to cart');
      navigate({ to: '/cart' });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to reorder');
    } finally {
      setReordering(false);
    }
  };

  const statusSteps = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED'];

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-48 bg-gray-200 rounded" />
        <div className="h-24 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
        <Link to="/orders" className="text-primary hover:underline mt-2 inline-block">Back to orders</Link>
      </div>
    );
  }

  const currentStep = statusSteps.indexOf(order.status);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/orders" className="text-sm text-gray-500 hover:text-gray-700">&larr; Back to orders</Link>
        <div className="flex gap-2">
          {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
            <button onClick={handleReorder} disabled={reordering} className="btn btn-outline text-sm disabled:opacity-60">
              {reordering ? 'Adding...' : 'Reorder'}
            </button>
          )}
          {order.status === 'DELIVERED' && (
            <Link to="/restaurants/$id" params={{ id: order.restaurant_id }} className="btn btn-primary text-sm">
              Write a Review
            </Link>
          )}
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(0, 8)}</h2>
            {order.restaurant_name && <p className="text-sm text-gray-500">{order.restaurant_name}</p>}
            <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <span className={`text-lg font-bold ${
            order.status === 'DELIVERED' ? 'text-success' :
            order.status === 'CANCELLED' ? 'text-red-500' : 'text-primary'
          }`}>
            {order.status}
          </span>
        </div>

        {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              {statusSteps.map((step, i) => (
                <div key={step} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i <= currentStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {i < currentStep ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : i + 1}
                  </div>
                  <span className={`text-xs mt-1 ${i <= currentStep ? 'text-primary font-medium' : 'text-gray-400'}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
            <div className="relative mt-2">
              <div className="absolute top-0 left-4 right-4 h-0.5 bg-gray-200" />
              <div className="absolute top-0 left-4 h-0.5 bg-primary transition-all" style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.quantity}x {item.menu_item_name}</p>
                  <p className="text-xs text-gray-500">₦{Number(item.unit_price).toLocaleString()} each</p>
                </div>
                <span className="font-semibold">₦{Number(item.subtotal).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <hr className="my-4" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₦{Number(order.subtotal).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Delivery Fee</span><span>₦{Number(order.delivery_fee).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Platform Fee</span><span>₦{Number(order.platform_fee).toLocaleString()}</span></div>
            {Number(order.promo_discount) > 0 && (
              <div className="flex justify-between text-success"><span>Promo Discount</span><span>-₦{Number(order.promo_discount).toLocaleString()}</span></div>
            )}
            <hr />
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">₦{Number(order.total_amount).toLocaleString()}</span></div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Delivery Details</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Address</p>
              <p className="font-medium">{order.delivery_address}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Payment</p>
              <p className="font-medium">{order.payment_method} • {order.payment_status}</p>
            </div>
            {order.notes && (
              <div>
                <p className="text-gray-500 text-xs">Notes</p>
                <p className="font-medium">{order.notes}</p>
              </div>
            )}
            {order.cancelled_reason && (
              <div>
                <p className="text-gray-500 text-xs">Cancellation Reason</p>
                <p className="font-medium text-red-500">{order.cancelled_reason}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Status History</h3>
        <div className="space-y-3">
          {order.status_history.map((h) => (
            <div key={h.id} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">{h.status}</p>
                {h.notes && <p className="text-xs text-gray-500">{h.notes}</p>}
                <p className="text-xs text-gray-400">{new Date(h.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
