import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import api from '../../../shared/lib/api';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  menu_item_id: string;
  name: string;
  image: string;
  category: string;
  quantity: number;
  unit_price: string;
  restaurant_name: string;
  restaurant_id: string;
  special_instructions: string;
}

export function CartPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLat, setDeliveryLat] = useState('');
  const [deliveryLng, setDeliveryLng] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);

  const fetchCart = async () => {
    try {
      const res = await api.get('/food/cart');
      setItems(res.data.items);
      setTotal(res.data.total);
      setDeliveryFee(res.data.delivery_fee || 0);
      setPlatformFee(res.data.platform_fee || 0);
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
      const res = await api.put(`/food/cart/${id}`, { quantity });
      setItems(res.data.items);
      setTotal(res.data.total);
      setDeliveryFee(res.data.delivery_fee || 0);
      setPlatformFee(res.data.platform_fee || 0);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update');
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      const res = await api.delete(`/food/cart/${id}`);
      setItems(res.data.items);
      setTotal(res.data.total);
      setDeliveryFee(res.data.delivery_fee || 0);
      setPlatformFee(res.data.platform_fee || 0);
      toast.success('Item removed');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    try {
      await api.delete('/food/cart');
      setItems([]);
      setTotal(0);
      setDeliveryFee(0);
      setPlatformFee(0);
      toast.success('Cart cleared');
    } catch {
      toast.error('Failed to clear cart');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryAddress.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }
    setOrdering(true);
    try {
      const res = await api.post('/food/orders', {
        delivery_address: deliveryAddress,
        delivery_latitude: deliveryLat ? Number(deliveryLat) : undefined,
        delivery_longitude: deliveryLng ? Number(deliveryLng) : undefined,
        payment_method: paymentMethod,
        notes: notes,
      });
      toast.success('Order placed successfully!');
      navigate({ to: '/orders/$id', params: { id: res.data.id } });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to place order');
    } finally {
      setOrdering(false);
    }
  };

  const grandTotal = total + deliveryFee + platformFee;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h2>
        <div className="space-y-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="card h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Cart</h2>
        {items.length > 0 && (
          <button onClick={handleClearCart} className="text-sm text-red-500 hover:text-red-700">Clear Cart</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-4">🛒</p>
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Link to="/restaurants" className="btn btn-primary">Browse Restaurants</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const lineTotal = Number(item.unit_price) * item.quantity;
              return (
                <div key={item.id} className="card flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="w-full sm:w-16 h-32 sm:h-16 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">🍕</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.restaurant_name}</p>
                    <p className="text-sm font-bold text-primary mt-1">₦{Number(item.unit_price).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100">-</button>
                      <span className="px-3 py-1 font-medium">{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100">+</button>
                    </div>
                    <p className="font-semibold text-right whitespace-nowrap">₦{lineTotal.toLocaleString()}</p>
                    <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-500 p-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">₦{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span className="font-medium">₦{deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform Fee</span>
                  <span className="font-medium">₦{platformFee.toLocaleString()}</span>
                </div>
                <hr />
                <div className="flex justify-between text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">₦{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <form onSubmit={handleCheckout} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address *</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter delivery address"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      type="text"
                      value={deliveryLat}
                      onChange={(e) => setDeliveryLat(e.target.value)}
                      placeholder="6.5244"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="text"
                      value={deliveryLng}
                      onChange={(e) => setDeliveryLng(e.target.value)}
                      placeholder="3.3792"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['CASH', 'CARD', 'WALLET'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          paymentMethod === method
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {method === 'CASH' ? 'Cash' : method === 'CARD' ? 'Card' : 'Wallet'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions?"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
                <button type="submit" disabled={ordering || items.length === 0} className="btn btn-primary w-full disabled:opacity-60">
                  {ordering ? 'Placing Order...' : `Place Order — ₦${grandTotal.toLocaleString()}`}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
