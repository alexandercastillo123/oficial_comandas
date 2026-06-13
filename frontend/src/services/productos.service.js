import { api } from './api';

export const productosService = {
  async getProductos({ categoria, buscar, page, limit }) {
    let url = `/productos?page=${page || 1}&limit=${limit || 10}`;
    if (categoria) url += `&categoria=${categoria}`;
    if (buscar) url += `&buscar=${encodeURIComponent(buscar)}`;
    const res = await api.get(url);
    return res.data.data;
  },

  async getCategorias() {
    const res = await api.get('/productos/categorias');
    return res.data.data;
  }
};
