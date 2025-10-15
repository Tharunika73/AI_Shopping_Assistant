import { configureStore } from '@reduxjs/toolkit';
import authSlice from './authSlice';
import cartSlice from './cartSlice';
import uiSlice from './uiSlice';
import wishlistSlice from './wishlistSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    cart: cartSlice,
    ui: uiSlice,
    wishlist: wishlistSlice, 
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});
