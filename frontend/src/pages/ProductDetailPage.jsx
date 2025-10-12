import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { setShowAuthModal } from '../store/uiSlice';
import { addToCart } from '../store/cartSlice';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  ArrowLeft,
  Plus,
  Minus,
  Truck,
  Shield,
  RotateCcw
} from 'lucide-react';
import api from '../utils/api';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
    if (isAuthenticated) {
      checkWishlistStatus();
    }
  }, [id, isAuthenticated]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setIsLoading(false);
    }
  };

  const checkWishlistStatus = async () => {
    try {
      const response = await api.get('/wishlist');
      const wishlistItems = response.data.items || [];
      setIsInWishlist(wishlistItems.some(item => item.product.id === parseInt(id)));
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      dispatch(setShowAuthModal(true));
      return;
    }

    setIsAddingToCart(true);
    try {
      await dispatch(addToCart({ product_id: parseInt(id), quantity })).unwrap();
      toast.success(`Added ${quantity} item(s) to cart!`);
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      dispatch(setShowAuthModal(true));
      return;
    }

    try {
      if (isInWishlist) {
        await api.delete(`/wishlist/${id}`);
        setIsInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post('/wishlist', { product_id: parseInt(id) });
        setIsInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-96 bg-slate-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                <div className="h-32 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-6" data-testid="product-detail-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Button
          variant="ghost"
          onClick={() => navigate('/products')}
          className="mb-6"
          data-testid="back-to-products"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-96 object-cover"
                data-testid="product-image"
              />
            </Card>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-3">
                {product.category}
              </Badge>
              <h1 className="text-3xl font-bold text-slate-900 mb-4" data-testid="product-title">
                {product.title}
              </h1>
              
              {product.rating && (
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 font-semibold" data-testid="product-rating">
                      {product.rating.rate}
                    </span>
                  </div>
                  <span className="text-slate-500">
                    ({product.rating.count} reviews)
                  </span>
                </div>
              )}

              <div className="mb-6">
                <span className="text-4xl font-bold text-blue-600" data-testid="product-price">
                  ${product.price}
                </span>
                <p className="text-slate-600 mt-2">Free shipping on orders over $50</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Description</h3>
              <p className="text-slate-600 leading-relaxed" data-testid="product-description">
                {product.description}
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-900 mb-2 block">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    data-testid="decrease-quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center font-medium" data-testid="quantity-display">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    data-testid="increase-quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
                  data-testid="add-to-cart-detail"
                >
                  {isAddingToCart ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleWishlistToggle}
                  className={`py-3 ${isInWishlist ? 'text-red-600 border-red-600' : ''}`}
                  data-testid="wishlist-toggle"
                >
                  <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-red-600' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Features */}
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Truck className="w-5 h-5 text-green-600" />
                  <span className="text-slate-700">Free shipping on orders over $50</span>
                </div>
                <div className="flex items-center space-x-3">
                  <RotateCcw className="w-5 h-5 text-blue-600" />
                  <span className="text-slate-700">30-day return policy</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span className="text-slate-700">2-year warranty included</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Related Products Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">You might also like</h2>
          <div className="text-center py-8">
            <p className="text-slate-500 mb-4">Discover more products in this category</p>
            <Button 
              variant="outline"
              onClick={() => navigate(`/products?category=${product.category}`)}
              data-testid="view-category"
            >
              View All {product.category}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;