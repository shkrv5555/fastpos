import { configureStore } from '@reduxjs/toolkit';
import authReducer  from './slices/authSlice';
import cartReducer  from './slices/cartSlice';
import ordersReducer from './slices/ordersSlice';
import uiReducer    from './slices/uiSlice';

const store = configureStore({
  reducer: {
    auth:   authReducer,
    cart:   cartReducer,
    orders: ordersReducer,
    ui:     uiReducer,
  },
});

export default store;
