import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

const client = axios.create({ baseURL: BASE_URL, timeout: 15000 });

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('fp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
