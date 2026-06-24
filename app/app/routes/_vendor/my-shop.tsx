import { useEffect, useState } from 'react';
import api from '../../../shared/lib/api';
import { toast } from 'sonner';
import { ImageUpload } from '../../components/ui/ImageUpload';

const SHOP_CATEGORIES = [
  'Groceries', 'Provisions', 'Fashion', 'Electronics', 'Home & Kitchen',
  'Health & Beauty', 'Stationery', 'Toys', 'Sports', 'Automotive', 'Other',
];

export function MyShopPage() {
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    cover_image: '',
    logo_url: '',
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/vendor/shop');
        if (res.data) {
          setShop(res.data);
          setForm({
            name: res.data.name || '',
            description: res.data.description || '',
            category: res.data.category || '',
            cover_image: res.data.cover_image || '',
            logo_url: res.data.logo_url || '',
          });
        }
      } catch (err) {
        console.error('Failed to fetch shop:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category) {
      toast.error('Name and category are required');
      return;
    }
    setSaving(true);
    try {
      if (shop) {
        const res = await api.put('/vendor/shop', form);
        setShop(res.data);
        toast.success('Shop updated');
      } else {
        const res = await api.post('/vendor/shop', form);
        setShop(res.data);
        toast.success('Shop created');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save shop');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse max-w-2xl mx-auto space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-48 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {shop ? 'My Shop' : 'Create Your Shop'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <ImageUpload
            label="Cover Image"
            currentUrl={form.cover_image}
            onUpload={(url) => setForm((f) => ({ ...f, cover_image: url }))}
            type="cover"
          />
          <ImageUpload
            label="Logo"
            currentUrl={form.logo_url}
            onUpload={(url) => setForm((f) => ({ ...f, logo_url: url }))}
            type="logo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. John's Provision Store"
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Tell customers about your shop..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">Select a category</option>
            {SHOP_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary w-full py-3 disabled:opacity-60"
        >
          {saving ? 'Saving...' : shop ? 'Update Shop' : 'Create Shop'}
        </button>
      </form>
    </div>
  );
}
