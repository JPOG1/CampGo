import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../../../shared/lib/api';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  image_url: string | null;
}

export function VendorMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: 'Main', is_available: true });

  const fetchMenu = async () => {
    try {
      const res = await api.get('/food/vendor/menu');
      setItems(res.data);
    } catch { toast.error('Failed to load menu'); }
    setLoading(false);
  };

  useEffect(() => { fetchMenu(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/food/vendor/menu', { ...form, price: parseFloat(form.price) });
      toast.success('Menu item added');
      setShowForm(false);
      setForm({ name: '', description: '', price: '', category: 'Main', is_available: true });
      fetchMenu();
    } catch { toast.error('Failed to add item'); }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      await api.patch(`/food/vendor/menu/${id}`, { is_available: !current });
      fetchMenu();
    } catch { toast.error('Failed to update item'); }
  };

  if (loading) return <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Menu Items</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary px-4 py-2 text-sm">
          {showForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-primary/20">
                {['Main', 'Appetizer', 'Dessert', 'Drink', 'Side'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary px-6 py-2 text-sm">Save Item</button>
        </form>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No menu items yet</p>
          <p className="text-sm mt-1">Click "Add Item" to create your first menu item</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Category</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Price</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                  <td className="px-4 py-3 text-sm">₦{item.price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleAvailability(item.id, item.is_available)} className="text-sm text-primary hover:underline">
                      {item.is_available ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
