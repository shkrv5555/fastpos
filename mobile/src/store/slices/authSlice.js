import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../api/endpoints';

export const ownerLogin = createAsyncThunk('auth/ownerLogin', async (creds, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.ownerLogin(creds);
    await SecureStore.setItemAsync('fp_token', data.token);
    await SecureStore.setItemAsync('fp_user', JSON.stringify(data.user));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'LOGIN_FAILED');
  }
});

export const restoreSession = createAsyncThunk('auth/restore', async () => {
  const token = await SecureStore.getItemAsync('fp_token');
  const user  = await SecureStore.getItemAsync('fp_user');
  if (token && user) return { token, user: JSON.parse(user) };
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null, loading: false, error: null },
  reducers: {
    logout(state) {
      state.user = null; state.token = null;
      SecureStore.deleteItemAsync('fp_token');
      SecureStore.deleteItemAsync('fp_user');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(ownerLogin.pending,    (s)    => { s.loading = true; s.error = null; })
      .addCase(ownerLogin.fulfilled,  (s, a) => { s.loading = false; s.token = a.payload.token; s.user = a.payload.user; })
      .addCase(ownerLogin.rejected,   (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(restoreSession.fulfilled, (s, a) => {
        if (a.payload) { s.token = a.payload.token; s.user = a.payload.user; }
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
