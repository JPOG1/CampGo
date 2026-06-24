import { useEffect, useState } from 'react';
import api from '../../../shared/lib/api';
import { toast } from 'sonner';
import { ImageUpload } from '../../components/ui/ImageUpload';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  image: string;
  category: string;
  stock_quantity: number;
  is_available: boolean;
}

const emptyForm = {
  name: '',
  description: '',
  price: '',
  currency: 'NGN',
  image: '',
  category: '',
  stock_quantity: 0,
  is_available: true,
};

export function ManageProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [shop, setShop] = useState<any>(null);

  const fetchProducts = async () => {
    try {
      const shopRes = await api.get('/vendor/shop');
      if (!shopRes.data) {
        setShop(null);
        setProducts([]);
        return;
      }
      setShop(shopRes.data);
      const res = await api.get('/vendor/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const res = await api.put(`/vendor/products/${editingId}`, form);
        setProducts((prev) => prev.map((p) => (p.id === editingId ? res.data : p)));
        toast.success('Product updated');
      } else {
        const res = await api.post('/vendor/products', form);
        setProducts((prev) => [...prev, res.data]);
        toast.success('Product added');
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      currency: product.currency,
      image: product.image || '',
      category: product.category || '',
      stock_quantity: product.stock_quantity,
      is_available: product.is_available,
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/vendor/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Product removed');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to remove product');
    }
  };

  const toggleAvailability = async (product: Product) => {
    try {
      const res = await api.put(`/vendor/products/${product.id}`, { is_available: !product.is_available });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? res.data : p)));
    } catch (err: any) {
      toast.error('Failed to toggle availability');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-200 rounded" />)}
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl">🏪</span>
        <h3 className="text-lg font-semibold mt-4">No Shop Yet</h3>
        <p className="text-gray-500 mt-2">Create your shop first before adding products</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
          className="btn btn-primary"
        >
          Add Product
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Product' : 'Add Product'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <ImageUpload
              label="Product Image"
              currentUrl={form.image}
              onUpload={(url) => setForm((f) => ({ ...f, image: url }))}
              type="general"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Beverages, Snacks"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock_quantity}
                  onChange={(e) => setForm((f) => ({ ...f, stock_quantity: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_available"
                checked={form.is_available}
                onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="is_available" className="text-sm text-gray-700">Available for sale</label>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add Product'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {products.length === 0 ? (
        <div className="card text-center py-8 text-gray-500">
          No products yet. Click "Add Product" to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Image</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Price</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Stock</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Available</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">📦</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">{product.name}</td>
                  <td className="py-3 px-4 text-gray-500">{product.category || '-'}</td>
                  <td className="py-3 px-4 text-right font-medium">₦{Number(product.price).toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">{product.stock_quantity}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleAvailability(product)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        product.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {product.is_available ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(product)} className="text-primary hover:underline text-xs">Edit</button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                    </div>
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
