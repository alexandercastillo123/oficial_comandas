// backend/src/services/pedidoSync.service.js
/**
 * Alias legacy de upSync.
 * Mantenido por compatibilidad con arranque antiguo.
 */

const { runUpSync } = require('./upSync.service');

const INTERVAL_MS = parseInt(process.env.SYNC_PEDIDO_INTERVAL_MS, 10) || 5 * 60 * 1000;

setInterval(runUpSync, INTERVAL_MS);
runUpSync();

module.exports = { runPedidoSync: runUpSync };
