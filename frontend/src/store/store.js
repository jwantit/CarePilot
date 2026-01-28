import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import careTargetReducer from './slices/careTargetSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    careTarget: careTargetReducer
  },
});

export default store;

