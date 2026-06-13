import { api } from './api';

export const mesasService = {
  async getMesas(id_tienda) {
    const params = id_tienda ? { id_tienda } : undefined;
    const res = await api.get('/mesas', { params });
    return res.data.data;
  },

  async getMesa(id) {
    const res = await api.get(`/mesas/${id}`);
    return res.data.data;
  },

  async crearMesa(mesaData) {
    const res = await api.post('/mesas', mesaData);
    return res.data.data;
  },

  async editarMesa(id, mesaData) {
    const res = await api.put(`/mesas/${id}`, mesaData);
    return res.data.data;
  },

  async eliminarMesa(id) {
    const res = await api.delete(`/mesas/${id}`);
    return res.data;
  },

  async toggleActivo(id) {
    const res = await api.patch(`/mesas/${id}/toggle-activo`);
    return res.data.data;
  },

  async cambiarEstado(id, estadoMesa) {
    const res = await api.patch(`/mesas/${id}/estado`, { estado_mesa: estadoMesa });
    return res.data.data;
  }
};
