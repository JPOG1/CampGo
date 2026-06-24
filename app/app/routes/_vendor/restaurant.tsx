import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../../../shared/lib/api';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_type: string;
  address: string;
  cover_image: string | null;
  delivery_fee: number;
  estimated_delivery_time: number;
  min_order_amount: number;
}

export function VendorRestaurant() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', cuisine_type: '', address: '', delivery_fee: '', estimated_delivery_time: '', min_order_amount: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/food/vendor/restaurant');
        if (res.data) {
          setRestaurant(res.data);
          setForm({
            name: res.data.name || '',
            description: res.data.description || '',
            cuisine_type: res.data.cuisine_type || '',
            address: res.data.address || '',
            delivery_fee: res.data.delivery_fee?.toString() || '',
            estimated_delivery_time: res.data.estimated_delivery_time?.toString() || '',
            min_order_amount: res.data.min_order_amount?.toString() || '',
          });
        }
      } catch { /* no restaurant yet */ }
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        delivery_fee: parseFloat(form.delivery_fee) || 0,
        estimated_delivery_time: parseInt(form.estimated_delivery_time) || 30,
        min_order_amount: parseFloat(form.min_order_amount) || 0,
      };
      if (restaurant) {
        await api.put(`/food/restaurants/${restaurant.id}`, payload);
        toast.success('Restaurant updated');
      } else {
        await api.post('/food/restaurants', payload);
        toast.success('Restaurant created');
      }
    } catch { toast.error('Failed to save restaurant'); }
    setSaving(false);
  };

  if (loading) return <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{restaurant ? 'My Restaurant' : 'Create Restaurant'}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Type</label>
            <select value={form.cuisine_type} onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Select cuisine</option>
              {['Nigerian', 'Chinese', 'Italian', 'Mexican', 'Indian', 'American', 'Japanese', 'Other'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (₦)</label>
            <input type="number" step="0.01" value={form.delivery_fee} onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Est. Delivery (min)</label>
            <input type="number" value={form.estimated_delivery_time} onChange={(e) => setForm({ ...form, estimated_delivery_time: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₦)</label>
            <input type="number" step="0.01" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn btn-primary px-6 py-2 text-sm">
          {saving ? 'Saving...' : restaurant ? 'Update Restaurant' : 'Create Restaurant'}
        </button>
      </form>
    </div>
  );
}
