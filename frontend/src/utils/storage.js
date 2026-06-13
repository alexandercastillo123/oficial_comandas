import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async set(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
      console.error(`Error al guardar clave "${key}" en almacenamiento:`, e);
    }
  },

  async get(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error(`Error al obtener clave "${key}" de almacenamiento:`, e);
      return null;
    }
  },

  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error(`Error al remover clave "${key}" de almacenamiento:`, e);
    }
  },

  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Error al limpiar el almacenamiento local:', e);
    }
  }
};
