import { useEffect, useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import api from '../../../shared/lib/api';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  image: string;
  category: string;
  is_available: boolean;
  stock_quantity: number;
}

interface Shop {
  id: string;
  name: string;
  description: string;
  category: string;
  cover_image: string;
  vendor_name: string;
  products: Product[];
}

export function ShopDetailPage() {
  const { id } = useParams({ from: '/marketplace/$id' as any });
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [adding, setAdding] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [shopRes, cartRes] = await Promise.all([
          api.get(`/shop/${id}`),
          api.get('/shop/cart').catch(() => ({ data: { items: [] } })),
        ]);
        setShop(shopRes.data);
        setCartCount(cartRes.data.items?.length || 0);
      } catch (err) {
        console.error('Failed to fetch shop:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleAddToCart = async (productId: string) => {
    const quantity = quantities[productId] || 1;
    setAdding(productId);
    try {
      await api.post('/shop/cart', { product_id: productId, quantity });
      toast.success('Added to cart');
      setQuantities((prev) => ({ ...prev, [productId]: 1 }));
      setCartCount((c) => c + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to add to cart');
    } finally {
      setAdding(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse max-w-4xl mx-auto">
        <div className="h-48 bg-gray-200 rounded-lg mb-6" />
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-8" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded mb-3" />
        ))}
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Shop not found</p>
        <Link to="/marketplace" className="text-primary hover:underline mt-2 inline-block">Back to marketplace</Link>
      </div>
    );
  }

  const grouped = shop.products.reduce<Record<string, Product[]>>((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/marketplace" className="text-sm text-gray-500 hover:text-gray-700">&larr; Back to marketplace</Link>
      </div>

      <div className="relative h-48 rounded-lg overflow-hidden mb-6 bg-gradient-to-br from-primary/20 to-primary/5">
        {shop.cover_image ? (
          <img src={shop.cover_image} alt={shop.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-6xl">🏪</span>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{shop.name}</h1>
          <p className="text-gray-500 mt-1">{shop.description}</p>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium text-xs">
              {shop.category}
            </span>
            <span>Sold by {shop.vendor_name}</span>
          </div>
        </div>
        <Link to="/shop-cart" className="btn btn-primary relative">
          View Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((item) => (
                <div key={item.id} className="card flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">{item.name}</h4>
                        {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                      </div>
                      <span className="text-lg font-bold text-primary whitespace-nowrap ml-4">₦{Number(item.price).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setQuantities((prev) => ({ ...prev, [item.id]: Math.max(1, (prev[item.id] || 1) - 1) }))}
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 text-sm"
                        >-</button>
                        <span className="px-2.5 py-1 font-medium min-w-[2rem] text-center text-sm">{quantities[item.id] || 1}</span>
                        <button
                          type="button"
                          onClick={() => setQuantities((prev) => ({ ...prev, [item.id]: (prev[item.id] || 1) + 1 }))}
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 text-sm"
                        >+</button>
                      </div>
                      <button
                        onClick={() => handleAddToCart(item.id)}
                        disabled={adding === item.id || !item.is_available || item.stock_quantity < 1}
                        className="btn btn-primary text-xs disabled:opacity-60"
                      >
                        {!item.is_available ? 'Unavailable' : item.stock_quantity < 1 ? 'Out of Stock' : adding === item.id ? 'Adding...' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
