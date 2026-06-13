import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
const { getBaseUrl, STORAGE_KEY_IP } = require('../constants/config');

export const api = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

let currentBaseURL = '';

const getStoredIP = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_IP);
    return stored || '192.168.1.16';
  } catch (e) {
    return '192.168.1.16';
  }
};

const updateBaseURL = async () => {
  try {
    const ip = await getStoredIP();
    const newBase = `http://${ip}:3000/api/v1`;
    if (newBase !== currentBaseURL) {
      currentBaseURL = newBase;
      api.defaults.baseURL = newBase;
    }
  } catch (e) {
    const fallback = 'http://192.168.1.16:3000/api/v1';
    if (fallback !== currentBaseURL) {
      currentBaseURL = fallback;
      api.defaults.baseURL = fallback;
    }
  }
};

api.interceptors.request.use(
  async (config) => {
    await updateBaseURL();
    try {
      const stored = await AsyncStorage.getItem('@deleite_auth_state');
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
