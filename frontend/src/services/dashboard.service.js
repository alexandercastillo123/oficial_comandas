import { api } from './api';

export const dashboardService = {
  async getStats(fecha) {
    const hoy = new Date();
    const fechaStr = fecha || new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(hoy);
    const res = await api.get('/dashboard', { params: { fecha: fechaStr } });
    return res.data.data;
  }
};
