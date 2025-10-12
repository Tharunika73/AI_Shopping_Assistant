import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ShoppingCart, 
  Heart, 
  User, 
  Search, 
  Menu, 
  LogOut,
  Package
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { setShowAuthModal } from '../store/uiSlice';
import { logout } from '../store/authSlice';
import { toast } from 'sonner';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);

  const handleAuthClick = () => {
    dispatch(setShowAuthModal(true));
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/');
  };

  const cartItemCount = items?.length || 0;

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">VoiceCart</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-slate-600 hover:text-blue-600 transition-colors font-medium"
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className="text-slate-600 hover:text-blue-600 transition-colors font-medium"
            >
              Products
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/products')}
              data-testid="search-button"
            >
              <Search className="w-4 h-4" />
            </Button>

            {isAuthenticated ? (
              <>
                {/* Wishlist */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/wishlist')}
                  data-testid="wishlist-button"
                >
                  <Heart className="w-4 h-4" />
                </Button>

                {/* Cart */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative"
                  onClick={() => navigate('/cart')}
                  data-testid="cart-button"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {cartItemCount > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-blue-600"
                      data-testid="cart-badge"
                    >
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" data-testid="user-menu">
                      <User className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      <Package className="w-4 h-4 mr-2" />
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button 
                onClick={handleAuthClick}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="login-button"
              >
                Login
              </Button>
            )}

            {/* Mobile Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/')}>
                    Home
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/products')}>
                    Products
                  </DropdownMenuItem>
                  {isAuthenticated && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/wishlist')}>
                        <Heart className="w-4 h-4 mr-2" />
                        Wishlist
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/cart')}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Cart ({cartItemCount})
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;