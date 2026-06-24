import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import api from '../../../shared/lib/api';
import { ErrorState } from '../../components/common/ErrorState';

interface Shop {
  id: string;
  name: string;
  description: string;
  category: string;
  cover_image: string;
  created_at: string;
}

export function MarketplacePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    api.get('/shop/categories').then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: any = {};
        if (search) params.search = search;
        if (category) params.category = category;
        const res = await api.get('/shop', { params });
        setShops(res.data);
      } catch (err) {
        console.error('Failed to fetch shops:', err);
        setError('Failed to load shops');
      } finally {
        setLoading(false);
      }
    };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetch, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, category]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Marketplace</h2>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search shops..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setCategory('')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            category === '' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              category === c ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {(() => {
        if (loading) {
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-40 bg-gray-200 rounded-t-lg" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          );
        }
        if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
        if (shops.length === 0) {
          return (
            <div className="card text-center py-8 text-gray-500">
              No shops found. Try a different search.
            </div>
          );
        }
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((s) => (
              <Link key={s.id} to="/marketplace/$id" params={{ id: s.id }} className="card overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  {s.cover_image ? (
                    <img src={s.cover_image} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">🏪</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold">{s.name}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {s.category}
                    </span>
                  </div>
                  {s.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{s.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
