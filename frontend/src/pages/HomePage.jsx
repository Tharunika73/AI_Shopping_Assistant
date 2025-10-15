import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { setShowAuthModal, setShowAIAssistant } from '../store/uiSlice';
import { addToCart } from '../store/cartSlice';
import { addToWishlist } from '../store/wishlistSlice';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  Mic, 
  Star, 
  TrendingUp, 
  Zap,
  Bot,
  Heart,
  Send,
  Loader2
} from 'lucide-react';
import api from '../utils/api';

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await api.get('/products?limit=6&sort=rating');
      setFeaturedProducts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      dispatch(setShowAuthModal(true));
      return;
    }

    try {
      await dispatch(addToCart({ product_id: productId, quantity: 1 })).unwrap();
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  // MOVED: The handleAddToWishlist function now lives INSIDE the component
  const handleAddToWishlist = async (productId) => {
    if (!isAuthenticated) {
      dispatch(setShowAuthModal(true));
      return;
    }

    try {
      const result = await dispatch(addToWishlist({ product_id: productId })).unwrap();
      if (result.message === "Item already in wishlist") {
          toast.info('This item is already in your wishlist!');
      } else {
          toast.success('Added to wishlist!');
      }
    } catch (error) {
      toast.error('Failed to add to wishlist.');
    }
  };

  const handleAIAssistant = () => {
    if (!isAuthenticated) {
      dispatch(setShowAuthModal(true));
      return;
    }
    dispatch(setShowAIAssistant(true));
  };
  
  const handleContactChange = (e) => {
    const { id, value } = e.target;
    setContactForm(prev => ({ ...prev, [id]: value }));
  };
  
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error("Please fill out all fields.");
      return;
    }
    
    setIsSending(true);

    try {
      const response = await api.post('/contact', contactForm);
      toast.success(response.data.message || "Message sent successfully!");
      setContactForm({ name: '', email: '', message: '' });
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Failed to send message.";
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Shop Smarter with
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                AI Voice Assistant
              </span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Experience the future of shopping with our AI-powered voice assistant. 
              Just speak what you need, and let AI find the perfect products for you.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={handleAIAssistant}
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-4 text-lg"
                data-testid="try-ai-assistant"
              >
                <Bot className="w-5 h-5 mr-2" />
                Try AI Assistant
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/products')}
                className="border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-4 text-lg"
                data-testid="browse-products"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Browse Products
              </Button>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Why Choose VoiceCart?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Revolutionary shopping experience powered by cutting-edge AI technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="card-hover text-center p-6">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Voice Search</h3>
                <p className="text-slate-600">
                  Simply speak what you need. Our AI understands natural language 
                  and finds exactly what you're looking for.
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover text-center p-6">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Recommendations</h3>
                <p className="text-slate-600">
                  AI-powered semantic search finds products based on context, 
                  not just keywords. Discover items you'll love.
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover text-center p-6">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Shopping</h3>
                <p className="text-slate-600">
                  Add to cart, manage wishlist, and place orders seamlessly. 
                  Your AI assistant handles everything.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Featured Products
              </h2>
              <p className="text-slate-600">
                Discover our top-rated products loved by customers
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/products')}
              data-testid="view-all-products"
            >
              View All
            </Button>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="loading">
                  <div className="h-48 bg-slate-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3 mb-4"></div>
                    <div className="h-8 bg-slate-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className="card-hover overflow-hidden cursor-pointer group"
                  onClick={() => navigate(`/products/${product.id}`)}
                  data-testid={`product-card-${product.id}`}
                >
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.rating && (
                      <Badge className="absolute top-2 right-2 bg-white text-slate-900">
                        <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                        {product.rating.rate}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <Badge variant="secondary" className="mb-2">
                      {product.category}
                    </Badge>
                    <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-2xl font-bold text-blue-600 mb-3">
                      ${product.price}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product.id);
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        data-testid={`add-to-cart-btn-${product.id}`}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddToWishlist(product.id);
                        }}
                        data-testid={`wishlist-btn-${product.id}`}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                    Get In Touch
                </h2>
                <p className="text-lg text-slate-600">
                    Have a question or feedback? We'd love to hear from you.
                </p>
            </div>
            <Card>
              <CardContent className="p-8">
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        placeholder="John Doe" 
                        value={contactForm.name}
                        onChange={handleContactChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="you@example.com"
                        value={contactForm.email}
                        onChange={handleContactChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Your Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Let us know how we can help..." 
                      rows={5}
                      value={contactForm.message}
                      onChange={handleContactChange}
                    />
                  </div>
                  <div className="text-center pt-2">
                    <Button 
                      type="submit" 
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8"
                      disabled={isSending}
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {isSending ? "Sending..." : "Send Message"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
        </div>
      </section>
    </div>
  );
};

export default HomePage;