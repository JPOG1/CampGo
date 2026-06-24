import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import api from '../../../shared/lib/api';
import { ErrorState } from '../../components/common/ErrorState';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_type: string;
  rating: string;
  total_orders: number;
  cover_image: string;
  estimated_delivery_time: number;
  delivery_fee: string;
  min_order_amount: string;
  is_active: boolean;
}

const CUISINES = ['Nigerian', 'Chinese', 'Italian', 'Fast Food', 'Mexican', 'Japanese', 'Indian'];

export function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [popular, setPopular] = useState<Restaurant[]>([]);
  const [recommended, setRecommended] = useState<Restaurant[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: any = {};
        if (search) params.search = search;
        if (cuisine) params.cuisine = cuisine;
        const res = await api.get('/food/restaurants', { params });
        setRestaurants(res.data);
      } catch (err) {
        console.error('Failed to fetch restaurants:', err);
        setError('Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetch, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, cuisine]);

  useEffect(() => {
    api.get('/food/popular').then((res) => setPopular(res.data)).catch(() => {});
    api.get('/food/recommendations').then((res) => setRecommended(res.data)).catch(() => {});
  }, []);

  const sectionHeader = (title: string) => (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <span className="text-xs text-gray-400">Scroll →</span>
    </div>
  );

  const horizontalScroll = (items: Restaurant[]) => (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory scrollbar-hide">
      {items.map((r) => (
        <Link key={r.id} to="/restaurants/$id" params={{ id: r.id }} className="snap-start flex-shrink-0 w-56 card overflow-hidden hover:shadow-lg transition-shadow">
          <div className="h-28 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            {r.cover_image ? <img src={r.cover_image} alt={r.name} className="w-full h-full object-cover" /> : <span className="text-3xl">🍽️</span>}
          </div>
          <div className="p-3">
            <h4 className="font-semibold text-sm truncate">{r.name}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-0.5 text-yellow-600">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                {Number(r.rating).toFixed(1)}
              </span>
              <span>{r.cuisine_type}</span>
              {r.estimated_delivery_time && <span>{r.estimated_delivery_time} min</span>}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Restaurants</h2>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search restaurants..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setCuisine('')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            cuisine === '' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {CUISINES.map((c) => (
          <button
            key={c}
            onClick={() => setCuisine(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              cuisine === c ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {(() => {
        if (loading) {
          return (
            <div className="space-y-6">
              <div>
                {sectionHeader('Popular')}
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-56 card animate-pulse flex-shrink-0">
                      <div className="h-28 bg-gray-200" />
                      <div className="p-3 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="h-40 bg-gray-200 rounded-t-lg" />
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        if (error) {
          return <ErrorState message={error} onRetry={() => window.location.reload()} />;
        }
        if (restaurants.length === 0 && popular.length === 0 && recommended.length === 0) {
          return (
            <div className="card text-center py-8 text-gray-500">
              No restaurants found. Try a different search.
            </div>
          );
        }
        return (
          <div>
            {popular.length > 0 && (
              <div className="mb-8">
                {sectionHeader('Popular')}
                {horizontalScroll(popular)}
              </div>
            )}
            {recommended.length > 0 && (
              <div className="mb-8">
                {sectionHeader('Recommended for you')}
                {horizontalScroll(recommended)}
              </div>
            )}
            <h3 className="text-xl font-semibold text-gray-900 mb-4">All Restaurants</h3>
            {restaurants.length === 0 ? (
              <p className="text-gray-500 text-sm">No results for this filter.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((r) => (
                  <Link key={r.id} to="/restaurants/$id" params={{ id: r.id }} className="card overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      {r.cover_image ? (
                        <img src={r.cover_image} alt={r.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">🍽️</span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold">{r.name}</h3>
                        <span className="flex items-center gap-1 text-sm text-yellow-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          {Number(r.rating).toFixed(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{r.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{r.cuisine_type}</span>
                        {r.estimated_delivery_time && <span>⏱️ {r.estimated_delivery_time} min</span>}
                        {Number(r.delivery_fee) > 0 ? <span>🚚 ₦{Number(r.delivery_fee).toLocaleString()}</span> : <span>🚚 Free</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
