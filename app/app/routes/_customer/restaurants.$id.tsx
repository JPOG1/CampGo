import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from '@tanstack/react-router';
import api from '../../../shared/lib/api';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  image: string;
  category: string;
  is_available: boolean;
  is_popular: boolean;
  preparation_time: number;
}

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
  menu: MenuItem[];
}

export function RestaurantDetailPage() {
  const { id } = useParams({ from: '/restaurants/$id' as any });
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [adding, setAdding] = useState<string | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [restRes, revRes, cartRes] = await Promise.all([
          api.get(`/food/restaurants/${id}`),
          api.get(`/food/reviews/${id}`).catch(() => ({ data: [] })),
          api.get('/food/cart').catch(() => ({ data: { items: [] } })),
        ]);
        setRestaurant(restRes.data);
        setReviews(revRes.data);
        setCartCount(cartRes.data.items?.length || 0);
      } catch (err) {
        console.error('Failed to fetch restaurant:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleAddToCart = async (menuItemId: string) => {
    const quantity = quantities[menuItemId] || 1;
    setAdding(menuItemId);
    try {
      await api.post('/food/cart', {
        restaurant_id: id,
        menu_item_id: menuItemId,
        quantity,
        special_instructions: specialInstructions,
      });
      toast.success('Added to cart');
      setQuantities((prev) => ({ ...prev, [menuItemId]: 1 }));
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

  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Restaurant not found</p>
        <Link to="/restaurants" className="text-primary hover:underline mt-2 inline-block">Back to restaurants</Link>
      </div>
    );
  }

  const groupedMenu = restaurant.menu.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/restaurants" className="text-sm text-gray-500 hover:text-gray-700">&larr; Back to restaurants</Link>
      </div>

      <div className="relative h-48 rounded-lg overflow-hidden mb-6 bg-gradient-to-br from-primary/20 to-primary/5">
        {restaurant.cover_image ? (
          <img src={restaurant.cover_image} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-6xl">🍽️</span>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
          <p className="text-gray-500 mt-1">{restaurant.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              {Number(restaurant.rating).toFixed(1)}
            </span>
            <span>{restaurant.cuisine_type}</span>
            {restaurant.estimated_delivery_time && <span>⏱️ {restaurant.estimated_delivery_time} min</span>}
            {Number(restaurant.delivery_fee) > 0 ? <span>🚚 ₦{Number(restaurant.delivery_fee).toLocaleString()}</span> : <span>🚚 Free delivery</span>}
            {Number(restaurant.min_order_amount) > 0 && <span>Min. ₦{Number(restaurant.min_order_amount).toLocaleString()}</span>}
          </div>
        </div>
        <Link to="/cart" className="btn btn-primary relative">
          View Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{cartCount}</span>
          )}
        </Link>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedMenu).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">{category}</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="card flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🍕</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        {item.description && <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>}
                      </div>
                      <span className="text-lg font-bold text-primary whitespace-nowrap ml-4">₦{Number(item.price).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setQuantities((prev) => ({ ...prev, [item.id]: Math.max(1, (prev[item.id] || 1) - 1) }))}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                        >-</button>
                        <span className="px-3 py-1 font-medium min-w-[2rem] text-center">{quantities[item.id] || 1}</span>
                        <button
                          type="button"
                          onClick={() => setQuantities((prev) => ({ ...prev, [item.id]: (prev[item.id] || 1) + 1 }))}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                        >+</button>
                      </div>
                      <button
                        onClick={() => handleAddToCart(item.id)}
                        disabled={adding === item.id || !item.is_available}
                        className="btn btn-primary text-sm disabled:opacity-60"
                      >
                        {!item.is_available ? 'Unavailable' : adding === item.id ? 'Adding...' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {reviews.length > 0 && (
        <div className="card mt-8">
          <h3 className="text-lg font-semibold mb-4">Reviews ({reviews.length})</h3>
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{review.user_name || 'Anonymous'}</span>
                  <span className="flex items-center gap-0.5 text-yellow-600 text-xs">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    {Number(review.rating).toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
