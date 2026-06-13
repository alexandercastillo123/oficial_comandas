const dashboardRepo = require('../repositories/dashboard.repo');

async function getDashboardStats(tiendaId, fecha) {
  return await dashboardRepo.getStats(tiendaId, fecha);
}

module.exports = {
  getDashboardStats
};
