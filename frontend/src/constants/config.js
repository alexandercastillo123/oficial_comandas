import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_IP = '192.168.1.16';
export const BACKEND_PORT = 3000;
export const STORAGE_KEY_IP = '@sucursal_ip';

export const getBaseUrl = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_IP);
    const ip = stored ? stored : DEFAULT_IP;
    return `http://${ip}:${BACKEND_PORT}/api/v1`;
  } catch (e) {
    return `http://${DEFAULT_IP}:${BACKEND_PORT}/api/v1`;
  }
};

export const getSseBaseUrl = async () => {
  const base = await getBaseUrl();
  return base.replace('/api/v1', '/api/v1/sse');
};

let cached = {
  baseURL: `http://${DEFAULT_IP}:${BACKEND_PORT}/api/v1`,
  sseBaseURL: `http://${DEFAULT_IP}:${BACKEND_PORT}/api/v1/sse`,
};

export const API_BASE_URL = cached.baseURL;
export const SSE_BASE_URL = cached.sseBaseURL;

export const syncConfig = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_IP);
    const ip = stored || DEFAULT_IP;
    cached.baseURL = `http://${ip}:${BACKEND_PORT}/api/v1`;
    cached.sseBaseURL = `http://${ip}:${BACKEND_PORT}/api/v1/sse`;
  } catch (e) {
    cached.baseURL = `http://${DEFAULT_IP}:${BACKEND_PORT}/api/v1`;
    cached.sseBaseURL = `http://${DEFAULT_IP}:${BACKEND_PORT}/api/v1/sse`;
  }
};
