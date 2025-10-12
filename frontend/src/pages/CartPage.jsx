import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { fetchCart, updateCartItem, removeFromCart } from '../store/cartSlice';
import { setShowAuthModal } from '../store/uiSlice';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Package,
  CheckCircle
} from 'lucide-react';
import api from '../utils/api';

const CartPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items, subtotal, isLoading } = useSelector((state) => state.cart);

  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    address: '',
    city: '',
    zipCode: '',
    phone: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(setShowAuthModal(true));
      navigate('/');
      return;
    }
    dispatch(fetchCart());
  }, [isAuthenticated, dispatch, navigate]);

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      await dispatch(removeFromCart(productId));
      toast.success('Item removed from cart');
    } else {
      await dispatch(updateCartItem({ product_id: productId, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = async (productId) => {
    await dispatch(removeFromCart(productId));
    toast.success('Item removed from cart');
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const response = await api.post('/orders/checkout', {
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        shipping_address: shippingInfo,
      });

      toast.success('Order placed successfully! 🎉');
      setShowCheckout(false);
      navigate('/orders');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value,
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-8"></div>
            {[...Array(3)].map((_, index) => (
              <Card key={index} className="mb-4">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-slate-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-6" data-testid="cart-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3 mb-8">
          <ShoppingCart className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-900">Shopping Cart</h1>
          <span className="text-slate-500">({items.length} items)</span>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Your cart is empty</h2>
            <p className="text-slate-600 mb-6">Start shopping to add items to your cart</p>
            <Button 
              onClick={() => navigate('/products')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="continue-shopping"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden" data-testid={`cart-item-${item.product.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        className="w-20 h-20 object-cover rounded cursor-pointer"
                        onClick={() => navigate(`/products/${item.product.id}`)}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-semibold text-slate-900 cursor-pointer hover:text-blue-600 line-clamp-2"
                          onClick={() => navigate(`/products/${item.product.id}`)}
                        >
                          {item.product.title}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">{item.product.category}</p>
                        <p className="text-xl font-bold text-blue-600 mt-2">${item.product.price}</p>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          data-testid={`remove-item-${item.product.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                            data-testid={`decrease-qty-${item.product.id}`}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          
                          <span className="w-12 text-center font-medium" data-testid={`quantity-${item.product.id}`}>
                            {item.quantity}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                            data-testid={`increase-qty-${item.product.id}`}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <p className="font-semibold text-slate-900" data-testid={`item-total-${item.product.id}`}>
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({items.length} items)</span>
                    <span className="font-semibold" data-testid="subtotal-amount">${subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-semibold text-green-600">Free</span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-blue-600" data-testid="total-amount">${subtotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6"
                        data-testid="checkout-button"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Proceed to Checkout
                      </Button>
                    </DialogTrigger>
                    
                    <DialogContent className="sm:max-w-md" data-testid="checkout-modal">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <Package className="w-5 h-5 text-blue-600" />
                          <span>Shipping Information</span>
                        </DialogTitle>
                      </DialogHeader>

                      <form onSubmit={handleCheckout} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            name="fullName"
                            value={shippingInfo.fullName}
                            onChange={handleInputChange}
                            required
                            data-testid="shipping-name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            name="address"
                            value={shippingInfo.address}
                            onChange={handleInputChange}
                            required
                            data-testid="shipping-address"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              name="city"
                              value={shippingInfo.city}
                              onChange={handleInputChange}
                              required
                              data-testid="shipping-city"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="zipCode">ZIP Code</Label>
                            <Input
                              id="zipCode"
                              name="zipCode"
                              value={shippingInfo.zipCode}
                              onChange={handleInputChange}
                              required
                              data-testid="shipping-zip"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={shippingInfo.phone}
                            onChange={handleInputChange}
                            required
                            data-testid="shipping-phone"
                          />
                        </div>

                        <div className="border-t pt-4 mt-6">
                          <div className="flex justify-between mb-4">
                            <span className="font-semibold">Total Amount:</span>
                            <span className="text-xl font-bold text-blue-600">
                              ${subtotal.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          disabled={isProcessing}
                          data-testid="place-order-button"
                        >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Place Order - ${subtotal.toFixed(2)}
                            </>
                          )}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => navigate('/products')}
                    data-testid="continue-shopping-bottom"
                  >
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;