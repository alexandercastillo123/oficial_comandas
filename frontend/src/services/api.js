import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from '../constants/config';

export const api = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

let currentBaseURL = '';

const updateBaseURL = async () => {
  try {
    const newBase = await getBaseUrl();
    if (newBase !== currentBaseURL) {
      currentBaseURL = newBase;
      api.defaults.baseURL = newBase;
    }
  } catch (e) {
    console.error('Error actualizando baseURL en Axios:', e);
  }
};

api.interceptors.request.use(
  async (config) => {
    await updateBaseURL();
    try {
      const stored = await AsyncStorage.getItem('@la_ideal_auth_state');
      if (stored) {
        const { token } = JSON.parse(stored);
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch (e) {
      console.error('Error inyectando token JWT en Axios:', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const refreshBaseURL = async () => {
  await updateBaseURL();
};
