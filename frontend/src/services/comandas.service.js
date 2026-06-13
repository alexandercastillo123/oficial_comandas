import { api } from './api';

export const comandasService = {
  async getComandas(mesaId) {
    const res = await api.get(`/comandas?id_mesa=${mesaId}`);
    return res.data.data;
  },

  async getComandasTienda(estado) {
    let url = '/comandas';
    if (estado) url += `?estado=${estado}`;
    const res = await api.get(url);
    return res.data.data;
  },

  async getComandasCocina() {
    const res = await api.get('/comandas/cocina');
    return res.data.data;
  },

  async getComanda(id) {
    const res = await api.get(`/comandas/${id}`);
    return res.data.data;
  },

  async crearComanda(comandaData) {
    const res = await api.post('/comandas', comandaData);
    return res.data.data;
  },

  async entregarComanda(id) {
    const res = await api.patch(`/comandas/${id}/entregar`);
    return res.data.data;
  },

  async preCuentaComanda(id) {
    const res = await api.patch(`/comandas/${id}/pre-cuenta`);
    return res.data.data;
  },

  async cerrarComanda(id) {
    const res = await api.patch(`/comandas/${id}/cerrar`);
    return res.data.data;
  },

  async reimprimirComanda(id) {
    const res = await api.post(`/comandas/${id}/reimprimir`);
    return res.data.data;
  }
};
