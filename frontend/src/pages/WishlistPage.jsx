import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { setShowAuthModal } from '../store/uiSlice';
import { addToCart } from '../store/cartSlice';
import { toast } from 'sonner';
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Trash2,
  HeartOff
} from 'lucide-react';
import api from '../utils/api';

const WishlistPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(setShowAuthModal(true));
      navigate('/');
      return;
    }
    fetchWishlist();
  }, [isAuthenticated, dispatch, navigate]);

  const fetchWishlist = async () => {
    try {
      const response = await api.get('/wishlist');
      setWishlistItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await dispatch(addToCart({ product_id: productId, quantity: 1 })).unwrap();
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setWishlistItems(items => items.filter(item => item.product.id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-8"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={index}>
                  <div className="h-48 bg-slate-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3 mb-4"></div>
                    <div className="h-8 bg-slate-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-6" data-testid="wishlist-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3 mb-8">
          <Heart className="w-8 h-8 text-red-500" />
          <h1 className="text-3xl font-bold text-slate-900">My Wishlist</h1>
          <span className="text-slate-500">({wishlistItems.length} items)</span>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <HeartOff className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Your wishlist is empty</h2>
            <p className="text-slate-600 mb-6">Save items you love for later by clicking the heart icon</p>
            <Button 
              onClick={() => navigate('/products')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="browse-products-empty"
            >
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <Card 
                key={item.id} 
                className="card-hover overflow-hidden group"
                data-testid={`wishlist-item-${item.product.id}`}
              >
                <div className="relative">
                  <img
                    src={item.product.image}
                    alt={item.product.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                    onClick={() => navigate(`/products/${item.product.id}`)}
                  />
                  {item.product.rating && (
                    <Badge className="absolute top-2 left-2 bg-white text-slate-900">
                      <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                      {item.product.rating.rate}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveFromWishlist(item.product.id)}
                    data-testid={`remove-wishlist-${item.product.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <CardContent className="p-4">
                  <Badge variant="secondary" className="mb-2">
                    {item.product.category}
                  </Badge>
                  
                  <h3 
                    className="font-semibold text-slate-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600"
                    onClick={() => navigate(`/products/${item.product.id}`)}
                  >
                    {item.product.title}
                  </h3>
                  
                  <p className="text-2xl font-bold text-blue-600 mb-3">
                    ${item.product.price}
                  </p>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleAddToCart(item.product.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid={`add-to-cart-wishlist-${item.product.id}`}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/products/${item.product.id}`)}
                      data-testid={`view-product-${item.product.id}`}
                    >
                      View
                    </Button>
                  </div>
                  
                  <p className="text-xs text-slate-500 mt-3">
                    Added {new Date(item.added_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {wishlistItems.length > 0 && (
          <div className="flex justify-center mt-12">
            <Button 
              onClick={() => navigate('/products')}
              variant="outline"
              className="px-8"
              data-testid="continue-browsing"
            >
              Continue Browsing
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;