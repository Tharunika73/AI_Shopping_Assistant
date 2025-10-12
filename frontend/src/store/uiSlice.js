import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    showAuthModal: false,
    authMode: 'login', // 'login' or 'register'
    showAIAssistant: false,
    isDarkMode: false,
  },
  reducers: {
    setShowAuthModal: (state, action) => {
      state.showAuthModal = action.payload;
    },
    setAuthMode: (state, action) => {
      state.authMode = action.payload;
    },
    setShowAIAssistant: (state, action) => {
      state.showAIAssistant = action.payload;
    },
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
  },
});

export const { setShowAuthModal, setAuthMode, setShowAIAssistant, toggleDarkMode } = uiSlice.actions;
export default uiSlice.reducer;