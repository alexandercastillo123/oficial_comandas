import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_IP = '192.168.1.10';
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

export const syncConfig = async () => {
  // Las URLs ahora se resuelven dinámicamente llamando a getBaseUrl() y getSseBaseUrl(),
  // eliminando la necesidad de cachear valores primitivos en constantes estáticas.
};

