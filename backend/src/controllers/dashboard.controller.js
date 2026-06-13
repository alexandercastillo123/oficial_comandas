const dashboardService = require('../services/dashboard.service');
const { ok } = require('../utils/response');

async function getStats(req, res, next) {
  try {
    const tiendaId = req.user.id_tienda;
    const { fecha } = req.query; // YYYY-MM-DD
    const data = await dashboardService.getDashboardStats(tiendaId, fecha);
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStats
};
