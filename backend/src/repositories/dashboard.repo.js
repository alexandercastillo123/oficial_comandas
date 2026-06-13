const sql = require('mssql');
const { getLocalPool } = require('../config/db');

async function getStats(tiendaId, dateStr) {
  const pool = await getLocalPool();

  const fechaFiltro = dateStr || null;

  // 1. Total ventas y tickets del día (solo CERRADO)
  const queryVentas = `
    SELECT COALESCE(SUM(total), 0) as total_ventas, COUNT(*) as total_tickets 
    FROM comanda_cab 
    WHERE id_tienda = @tiendaId AND estado_comanda = 'CERRADO'
      AND CONVERT(DATE, fecha_creacion) = ${fechaFiltro ? '@fechaFiltro' : 'CONVERT(DATE, GETDATE())'}
  `;
  const reqVentas = pool.request().input('tiendaId', sql.Int, tiendaId);
  if (fechaFiltro) {
    reqVentas.input('fechaFiltro', sql.Date, fechaFiltro);
  }
  const resVentas = await reqVentas.query(queryVentas);

  // 2. Mesas ocupadas (solo mesas activas con comandas no cerradas)
  const queryMesas = `
    SELECT COUNT(DISTINCT m.id_mesa) as mesas_ocupadas 
    FROM mesa m 
    INNER JOIN comanda_cab cc ON cc.id_mesa = m.id_mesa 
    WHERE m.id_tienda = @tiendaId 
      AND m.estado = 1
      AND cc.estado_comanda NOT IN ('CERRADO')
  `;
  const resMesas = await pool.request()
    .input('tiendaId', sql.Int, tiendaId)
    .query(queryMesas);

  // 3. Comandas en cocina
  const queryCocina = `
    SELECT COUNT(*) as comandas_en_cocina 
    FROM comanda_cab 
    WHERE id_tienda = @tiendaId AND estado_comanda = 'EN_COCINA'
  `;
  const resCocina = await pool.request()
    .input('tiendaId', sql.Int, tiendaId)
    .query(queryCocina);

  // 4. Producto más vendido del día (solo CERRADO)
  const queryProductoTop = `
    SELECT TOP 1 p.nombre, SUM(cd.cantidad) as total_cantidad
    FROM comanda_det cd
    JOIN comanda_cab cc ON cd.id_comanda_cab = cc.id_comanda_cab
    JOIN producto p ON cd.id_producto = p.id_producto
    WHERE cc.id_tienda = @tiendaId AND cc.estado_comanda = 'CERRADO'
      AND CONVERT(DATE, cc.fecha_creacion) = ${fechaFiltro ? '@fechaFiltro' : 'CONVERT(DATE, GETDATE())'}
    GROUP BY p.nombre
    ORDER BY total_cantidad DESC
  `;
  const reqProducto = pool.request().input('tiendaId', sql.Int, tiendaId);
  if (fechaFiltro) {
    reqProducto.input('fechaFiltro', sql.Date, fechaFiltro);
  }
  const resProducto = await reqProducto.query(queryProductoTop);

  // 5. Top 5 productos más vendidos del día (solo CERRADO)
  const queryTop5 = `
    SELECT TOP 5 p.nombre, SUM(cd.cantidad) as total_cantidad
    FROM comanda_det cd
    JOIN comanda_cab cc ON cd.id_comanda_cab = cc.id_comanda_cab
    JOIN producto p ON cd.id_producto = p.id_producto
    WHERE cc.id_tienda = @tiendaId AND cc.estado_comanda = 'CERRADO'
      AND CONVERT(DATE, cc.fecha_creacion) = ${fechaFiltro ? '@fechaFiltro' : 'CONVERT(DATE, GETDATE())'}
    GROUP BY p.nombre
    ORDER BY total_cantidad DESC
  `;
  const reqTop5 = pool.request().input('tiendaId', sql.Int, tiendaId);
  if (fechaFiltro) {
    reqTop5.input('fechaFiltro', sql.Date, fechaFiltro);
  }
  const resTop5 = await reqTop5.query(queryTop5);

  // 6. Ventas por hora del día (solo CERRADO)
  const queryVentasPorHora = `
    SELECT DATEPART(HOUR, cc.fecha_creacion) as hora, SUM(cc.total) as total_monto
    FROM comanda_cab cc
    WHERE cc.id_tienda = @tiendaId AND cc.estado_comanda = 'CERRADO'
      AND CONVERT(DATE, cc.fecha_creacion) = ${fechaFiltro ? '@fechaFiltro' : 'CONVERT(DATE, GETDATE())'}
    GROUP BY DATEPART(HOUR, cc.fecha_creacion)
    ORDER BY hora ASC
  `;
  const reqVentasPorHora = pool.request().input('tiendaId', sql.Int, tiendaId);
  if (fechaFiltro) {
    reqVentasPorHora.input('fechaFiltro', sql.Date, fechaFiltro);
  }
  const resVentasPorHora = await reqVentasPorHora.query(queryVentasPorHora);

  return {
    total_ventas: resVentas.recordset[0].total_ventas,
    total_tickets: resVentas.recordset[0].total_tickets,
    mesas_ocupadas: resMesas.recordset[0].mesas_ocupadas,
    comandas_en_cocina: resCocina.recordset[0].comandas_en_cocina,
    producto_mas_vendido: resProducto.recordset[0] ? resProducto.recordset[0].nombre : 'N/A',
    productos_top_5: resTop5.recordset,
    ventas_por_hora: resVentasPorHora.recordset
  };
}

module.exports = {
  getStats
};
