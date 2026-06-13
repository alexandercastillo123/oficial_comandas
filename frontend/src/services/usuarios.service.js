import { api } from './api';

export const usuariosService = {
  async getTrabajadores(rolApp) {
    let url = '/usuarios';
    if (rolApp) url += `?rol_app=${rolApp}`;
    const res = await api.get(url);
    return res.data.data;
  },

  async getTrabajador(id) {
    const res = await api.get(`/usuarios/${id}`);
    return res.data.data;
  },

  async crearTrabajador(userData) {
    const res = await api.post('/usuarios', userData);
    return res.data.data;
  },

  async editarTrabajador(id, userData) {
    const res = await api.put(`/usuarios/${id}`, userData);
    return res.data.data;
  },

  async desactivarTrabajador(id, estado) {
    const res = await api.patch(`/usuarios/${id}/estado`, { estado });
    return res.data.data;
  },

  async actualizarPerfil(id, profileData) {
    const res = await api.put(`/usuarios/${id}/perfil`, profileData);
    return res.data.data;
  },

  async actualizarClave(id, clave) {
    const res = await api.put(`/usuarios/${id}/clave`, { clave });
    return res.data.data;
  },

  async eliminarTrabajador(id) {
    console.log('Frontend: llamando a eliminar trabajador', id);
    const res = await api.delete(`/usuarios/${id}`);
    console.log('Frontend: respuesta eliminar trabajador', res.data);
    return res.data.data;
  }
};
