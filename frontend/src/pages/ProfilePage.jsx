import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { setShowAuthModal } from '../store/uiSlice';
import { logout } from '../store/authSlice';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Calendar,
  LogOut,
  Edit
} from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  // ✅ Load user info properly on mount and Redux update
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(setShowAuthModal(true));
      navigate('/');
      return;
    }

    // Try to load user from Redux or localStorage
    const storedUser = user || JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setFormData({
        name: storedUser.name || '',
        email: storedUser.email || '',
      });
    }
  }, [isAuthenticated, user, dispatch, navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    // In a real app, you would make an API call to update the user
    toast.success('Profile updated successfully!');
    setIsEditing(false);
  };

  const handleCancel = () => {
    const storedUser = user || JSON.parse(localStorage.getItem('user'));
    setFormData({
      name: storedUser?.name || '',
      email: storedUser?.email || '',
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-6" data-testid="profile-page">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3 mb-8">
          <User className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                data-testid="edit-profile-button"
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    data-testid="name-input"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 rounded-md" data-testid="name-display">
                    {formData.name || 'N/A'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    data-testid="email-input"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 rounded-md flex items-center" data-testid="email-display">
                    <Mail className="w-4 h-4 mr-2 text-slate-500" />
                    {formData.email || 'N/A'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Member Since</Label>
                <div className="px-3 py-2 bg-slate-50 rounded-md flex items-center" data-testid="member-since">
                  <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Unknown'}
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-3 pt-4">
                  <Button 
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="save-profile"
                  >
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    data-testid="cancel-edit"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/orders')}
                data-testid="view-orders"
              >
                View My Orders
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/wishlist')}
                data-testid="view-wishlist"
              >
                View My Wishlist
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/cart')}
                data-testid="view-cart"
              >
                View My Cart
              </Button>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full"
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
