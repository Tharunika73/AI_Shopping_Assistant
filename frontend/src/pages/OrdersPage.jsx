import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { setShowAuthModal } from '../store/uiSlice';
import { toast } from 'sonner';
import { 
  Package, 
  ShoppingBag, 
  Calendar, 
  MapPin,
  Phone,
  CheckCircle,
  Truck
} from 'lucide-react';
import api from '../utils/api';

const OrdersPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(setShowAuthModal(true));
      navigate('/');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, dispatch, navigate]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
              <Card key={index} className="mb-6">
                <CardHeader>
                  <div className="h-6 bg-slate-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
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
    <div className="min-h-screen bg-slate-50 pt-6" data-testid="orders-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3 mb-8">
          <Package className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
          <span className="text-slate-500">({orders.length} orders)</span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">No orders yet</h2>
            <p className="text-slate-600 mb-6">When you place orders, they will appear here</p>
            <Button 
              onClick={() => navigate('/products')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="start-shopping"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden" data-testid={`order-${order.id}`}>
                <CardHeader className="bg-slate-50">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>Order #{order.id.slice(-8).toUpperCase()}</span>
                        <Badge 
                          variant={order.status === 'completed' ? 'default' : 'secondary'}
                          className={order.status === 'completed' ? 'bg-green-600' : ''}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {order.status}
                        </Badge>
                      </CardTitle>
                      <p className="text-slate-600 flex items-center mt-1">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        ${order.total_amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-slate-600">{order.items.length} items</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Order Items */}
                  <div className="space-y-3 mb-6">
                    <h4 className="font-semibold text-slate-900">Items Ordered</h4>
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 py-2 border-b border-slate-100 last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{item.title}</p>
                          <p className="text-sm text-slate-600">
                            Quantity: {item.quantity} × ${item.price} = ${item.item_total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Information */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Shipping Address
                      </h4>
                      <div className="text-slate-600 space-y-1">
                        <p>{order.shipping_address.fullName}</p>
                        <p>{order.shipping_address.address}</p>
                        <p>{order.shipping_address.city}, {order.shipping_address.zipCode}</p>
                        <p className="flex items-center">
                          <Phone className="w-3 h-3 mr-2" />
                          {order.shipping_address.phone}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                        <Truck className="w-4 h-4 mr-2" />
                        Delivery Status
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-slate-600">Order Confirmed</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-slate-600">Payment Processed</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          <span className="text-slate-600">Order Delivered ✅</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-6 pt-6 border-t">
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/products')}
                      data-testid={`reorder-${order.id}`}
                    >
                      Order Again
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => toast.info('Order tracking feature coming soon!')}
                      data-testid={`track-${order.id}`}
                    >
                      Track Package
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="text-center pt-6">
              <Button 
                onClick={() => navigate('/products')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="continue-shopping-orders"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;