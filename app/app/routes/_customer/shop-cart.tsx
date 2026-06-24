import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import api from '../../../shared/lib/api';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  unit_price: string;
  quantity: number;
  shop_name: string;
  shop_id: string;
}

export function ShopCartPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [notes, setNotes] = useState('');

  const fetchCart = async () => {
    try {
      const res = await api.get('/shop/cart');
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      const res = await api.put(`/shop/cart/${id}`, { quantity });
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await api.delete(`/shop/cart/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotal((prev) => {
        const item = items.find((i) => i.id === id);
        return item ? prev - Number(item.unit_price) * item.quantity : prev;
      });
      toast.success('Item removed');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to remove');
    }
  };

  const handleCheckout = async () => {
    if (!deliveryAddress.trim()) {
      toast.error('Please enter your delivery address');
      return;
    }
    setOrdering(true);
    try {
      const res = await api.post('/shop/checkout', {
        delivery_address: deliveryAddress,
        payment_method: paymentMethod,
        notes,
      });
      toast.success('Order placed successfully!');
      navigate({ to: '/orders' as any });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Checkout failed');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse max-w-3xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-200 rounded" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 max-w-3xl mx-auto">
        <span className="text-6xl">🛒</span>
        <h2 className="text-2xl font-bold text-gray-900 mt-4">Your cart is empty</h2>
        <p className="text-gray-500 mt-2">Browse the marketplace to add items</p>
        <Link to="/marketplace" className="btn btn-primary mt-6 inline-block">Browse Marketplace</Link>
      </div>
    );
  }

  const shopNames = [...new Set(items.map((i) => i.shop_name))];

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h2>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.id} className="card flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {item.product_image ? (
                <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">📦</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">{item.product_name}</h4>
              <p className="text-xs text-gray-500">{item.shop_name}</p>
              <p className="text-sm font-bold text-primary mt-1">₦{Number(item.unit_price).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-100 text-sm"
                >-</button>
                <span className="px-2 py-1 font-medium text-sm min-w-[2rem] text-center">{item.quantity}</span>
                <button
                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-100 text-sm"
                >+</button>
              </div>
              <button onClick={() => handleRemove(item.id)} className="text-red-500 hover:text-red-700 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <div className="text-right mb-4">
          <span className="text-lg font-bold">Total: ₦{total.toLocaleString()}</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Enter your delivery address"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="CARD">Card Payment</option>
              <option value="CASH">Cash on Delivery</option>
              <option value="TRANSFER">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions?"
              rows={2}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <button
            onClick={handleCheckout}
            disabled={ordering || !deliveryAddress.trim()}
            className="btn btn-primary w-full py-3 disabled:opacity-60"
          >
            {ordering ? 'Placing Order...' : `Place Order — ₦${total.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
