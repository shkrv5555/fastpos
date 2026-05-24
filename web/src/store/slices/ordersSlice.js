import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ordersAPI } from '@api/endpoints';

export const createOrder = createAsyncThunk('orders/create', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await ordersAPI.create(payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'ORDER_FAILED');
  }
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    // Müştərinin cari sifarişi
    currentOrder: null,
    loading: false,
    error: null,
    // İşçi dashboardı
    activeOrders: [],
  },
  reducers: {
    setActiveOrders(state, action)  { state.activeOrders = action.payload; },
    addActiveOrder(state, action)   { state.activeOrders.unshift(action.payload); },
    updateOrderStatus(state, action) {
      const { orderId, status } = action.payload;
      const order = state.activeOrders.find(o => o.id === orderId);
      if (order) order.status = status;
      // Müştərinin öz sifarişi
      if (state.currentOrder?.id === orderId) {
        state.currentOrder.status = status;
      }
    },
    clearCurrentOrder(state) { state.currentOrder = null; },
    clearError(state)        { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(createOrder.fulfilled, (s, a) => { s.loading = false; s.currentOrder = a.payload; })
      .addCase(createOrder.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const {
  setActiveOrders, addActiveOrder, updateOrderStatus,
  clearCurrentOrder, clearError,
} = ordersSlice.actions;
export default ordersSlice.reducer;
