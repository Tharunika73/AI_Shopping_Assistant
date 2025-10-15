import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { setShowAuthModal, setAuthMode } from '../store/uiSlice';
import { loginUser, registerUser, clearError } from '../store/authSlice';
import { fetchCart } from '../store/cartSlice';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AuthModal = () => {
  const dispatch = useDispatch();
  const { showAuthModal, authMode } = useSelector((state) => state.ui);
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(setShowAuthModal(false));
      dispatch(fetchCart());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (authMode === 'login') {
      // ✅ FIXED: some backends expect "username" instead of "email"
      const payload = {
        email: formData.email || formData.username,
        password: formData.password,
      };

      dispatch(loginUser(payload));
    } else {
      if (!formData.name.trim()) {
        toast.error('Name is required');
        return;
      }
      dispatch(registerUser(formData));
    }
  };

  const handleClose = () => {
    dispatch(setShowAuthModal(false));
    setFormData({ name: '', email: '', password: '' });
    dispatch(clearError());
  };

  const toggleAuthMode = () => {
    dispatch(setAuthMode(authMode === 'login' ? 'register' : 'login'));
    setFormData({ name: '', email: '', password: '' });
    dispatch(clearError());
  };

  return (
    <Dialog open={showAuthModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="auth-modal">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {authMode === 'login' 
              ? 'Sign in to your account to continue shopping'
              : 'Join VoiceCart and start shopping with AI assistance'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {authMode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
                data-testid="name-input"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email"
              data-testid="email-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
              data-testid="password-input"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading}
            data-testid="auth-submit-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {authMode === 'login' ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              authMode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </Button>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-slate-600">
            {authMode === 'login'
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={toggleAuthMode}
              className="text-blue-600 hover:text-blue-800 font-medium"
              data-testid="toggle-auth-mode"
            >
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
