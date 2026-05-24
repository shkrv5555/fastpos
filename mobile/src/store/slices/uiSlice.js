import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { statsPeriod: 'today' },
  reducers: {
    setStatsPeriod(state, action) { state.statsPeriod = action.payload; },
  },
});

export const { setStatsPeriod } = uiSlice.actions;
export default uiSlice.reducer;
