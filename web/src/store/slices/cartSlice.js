import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],          // { productId, name, image_url, unit_price, final_price, quantity }
    sessionId: null,    // anonim müştəri üçün
  },
  reducers: {
    setSessionId(state, action) {
      state.sessionId = action.payload;
    },

    addItem(state, action) {
      const product = action.payload;
      const existing = state.items.find(i => i.productId === product.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({
          productId:   product.id,
          name:        product.name,
          image_url:   product.image_url,
          unit_price:  parseFloat(product.base_price),
          final_price: parseFloat(product.final_price),
          quantity:    1,
        });
      }
    },

    removeItem(state, action) {
      const productId = action.payload;
      const idx = state.items.findIndex(i => i.productId === productId);
      if (idx === -1) return;
      if (state.items[idx].quantity > 1) {
        state.items[idx].quantity -= 1;
      } else {
        state.items.splice(idx, 1);
      }
    },

    deleteItem(state, action) {
      state.items = state.items.filter(i => i.productId !== action.payload);
    },

    clearCart(state) {
      state.items = [];
    },
  },
});

// Hesablama selector-ları
export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.final_price * i.quantity, 0);

export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0);

export const { setSessionId, addItem, removeItem, deleteItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
