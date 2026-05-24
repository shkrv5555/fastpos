import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    cartOpen:       false,
    activeSegment:  'simple',   // 'simple' | 'fast' | 'premium'
    activeCategory: null,
  },
  reducers: {
    toggleCart(state)             { state.cartOpen = !state.cartOpen; },
    openCart(state)               { state.cartOpen = true; },
    closeCart(state)              { state.cartOpen = false; },
    setSegment(state, action)     { state.activeSegment = action.payload; },
    setCategory(state, action)    { state.activeCategory = action.payload; },
  },
});

export const { toggleCart, openCart, closeCart, setSegment, setCategory } = uiSlice.actions;
export default uiSlice.reducer;
