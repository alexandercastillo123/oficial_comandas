import { api } from './api';

export const asistenciaService = {
  async generarQr(tipo) {
    const res = await api.post('/asistencia/generar-qr', { tipo });
    return res.data;
  },

  async validarQr(token) {
    const res = await api.post('/asistencia/validar-qr', { token });
    return res.data;
  },

  async marcarAsistencia(tipo) {
    const res = await api.post('/asistencia/marcar', { tipo });
    return res.data;
  },

  async marcarAsistenciaManual(idUsuario, idTienda, tipo) {
    const res = await api.post('/asistencia/marcar-manual', { id_usuario: idUsuario, id_tienda: idTienda, tipo });
    return res.data;
  },

  async obtenerTurno(idUsuario) {
    const res = await api.get(`/asistencia/turno/${idUsuario}`);
    return res.data;
  },

  async obtenerEstadoHoy() {
    const res = await api.get('/asistencia/me/estado-hoy');
    return res.data;
  },

  async listarAsistencias(fechaDesde, fechaHasta, idUsuario = null) {
    const params = new URLSearchParams({ fechaDesde, fechaHasta });
    if (idUsuario) params.set('idUsuario', idUsuario);
    const res = await api.get(`/asistencia/listado?${params.toString()}`);
    return res.data.data;
  },

  async miHistorial() {
    const res = await api.get('/asistencia/me/historial');
    return res.data.data;
  }
};
