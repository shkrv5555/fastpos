import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '@api/endpoints';

export const ownerLogin = createAsyncThunk('auth/ownerLogin', async (creds, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.ownerLogin(creds);
    localStorage.setItem('fp_token', data.token);
    localStorage.setItem('fp_user', JSON.stringify(data.user));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'LOGIN_FAILED');
  }
});

export const employeeLogin = createAsyncThunk('auth/employeeLogin', async (creds, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.employeeLogin(creds);
    localStorage.setItem('fp_token', data.token);
    localStorage.setItem('fp_user', JSON.stringify(data.user));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'LOGIN_FAILED');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null, loading: false, error: null },
  reducers: {
    restoreAuth(state) {
      const token = localStorage.getItem('fp_token');
      const user  = localStorage.getItem('fp_user');
      if (token && user) {
        state.token = token;
        state.user  = JSON.parse(user);
      }
    },
    logout(state) {
      state.user  = null;
      state.token = null;
      localStorage.removeItem('fp_token');
      localStorage.removeItem('fp_user');
    },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    const handleLogin = (state, action) => {
      state.loading = false;
      state.token   = action.payload.token;
      state.user    = action.payload.user;
    };
    builder
      .addCase(ownerLogin.pending,    (s) => { s.loading = true; s.error = null; })
      .addCase(ownerLogin.fulfilled,  handleLogin)
      .addCase(ownerLogin.rejected,   (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(employeeLogin.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(employeeLogin.fulfilled, handleLogin)
      .addCase(employeeLogin.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const { restoreAuth, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
