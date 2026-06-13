import { api } from './api';

export const authService = {
  async getMe() {
    const res = await api.get('/auth/me');
    return res.data.data;
  }
};
