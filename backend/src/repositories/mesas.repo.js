const sql = require('mssql');
const { getLocalPool } = require('../config/db');

async function listByTienda(tiendaId) {
  const pool = await getLocalPool();
  const query = `
    SELECT m.id_mesa, m.id_tienda, m.numero, m.capacidad, m.estado_mesa, m.estado,
           COUNT(cc.id_comanda_cab) as comandas_activas
    FROM mesa m 
    LEFT JOIN comanda_cab cc ON cc.id_mesa = m.id_mesa AND cc.estado_comanda NOT IN ('CERRADO')
    WHERE m.id_tienda = @tiendaId
    GROUP BY m.id_mesa, m.id_tienda, m.numero, m.capacidad, m.estado_mesa, m.estado
    ORDER BY m.numero ASC
  `;
  const result = await pool.request()
    .input('tiendaId', sql.Int, tiendaId)
    .query(query);
  return result.recordset;
}

async function listByTiendaActivas(tiendaId) {
  const pool = await getLocalPool();
  const query = `
    SELECT m.id_mesa, m.id_tienda, m.numero, m.capacidad, m.estado_mesa, m.estado,
           COUNT(cc.id_comanda_cab) as comandas_activas
    FROM mesa m 
    LEFT JOIN comanda_cab cc ON cc.id_mesa = m.id_mesa AND cc.estado_comanda NOT IN ('CERRADO')
    WHERE m.id_tienda = @tiendaId AND m.estado = 1
    GROUP BY m.id_mesa, m.id_tienda, m.numero, m.capacidad, m.estado_mesa, m.estado
    ORDER BY m.numero ASC
  `;
  const result = await pool.request()
    .input('tiendaId', sql.Int, tiendaId)
    .query(query);
  return result.recordset;
}

async function getById(mesaId) {
  const pool = await getLocalPool();
  const query = `
    SELECT id_mesa, id_tienda, numero, capacidad, estado_mesa, estado 
    FROM mesa 
    WHERE id_mesa = @mesaId
  `;
  const result = await pool.request()
    .input('mesaId', sql.Int, mesaId)
    .query(query);
  return result.recordset[0] || null;
}

async function create(mesaData) {
  const pool = await getLocalPool();
  const query = `
    INSERT INTO mesa (id_tienda, numero, capacidad, estado_mesa, estado, usuario_creacion)
    OUTPUT INSERTED.id_mesa
    VALUES (@id_tienda, @numero, @capacidad, 'LIBRE', 1, @usuario_creacion)
  `;
  const result = await pool.request()
    .input('id_tienda', sql.Int, mesaData.id_tienda)
    .input('numero', sql.VarChar, mesaData.numero)
    .input('capacidad', sql.Int, mesaData.capacidad || 4)
    .input('usuario_creacion', sql.Int, mesaData.usuario_creacion || null)
    .query(query);
  return result.recordset[0].id_mesa;
}

async function update(mesaId, mesaData) {
  const pool = await getLocalPool();
  let query = `
    UPDATE mesa 
    SET numero = @numero, 
        capacidad = @capacidad
  `;
  
  const req = pool.request()
    .input('mesaId', sql.Int, mesaId)
    .input('numero', sql.VarChar, mesaData.numero)
    .input('capacidad', sql.Int, mesaData.capacidad);
  
  if (mesaData.estado !== undefined) {
    query += `, estado = @estado`;
    req.input('estado', sql.Bit, mesaData.estado);
  }
  
  query += ` WHERE id_mesa = @mesaId`;
  await req.query(query);
}

async function deleteMesa(mesaId) {
  const pool = await getLocalPool();
  const result = await pool.request()
    .input('mesaId', sql.Int, mesaId)
    .query(`
      DELETE FROM comanda_det WHERE id_comanda_cab IN (SELECT id_comanda_cab FROM comanda_cab WHERE id_mesa = @mesaId);
      DELETE FROM comanda_cab WHERE id_mesa = @mesaId;
      DELETE FROM mesa WHERE id_mesa = @mesaId;
    `);
  // rowsAffected is an array with a count for each statement; sum them to know if any rows were deleted
  const affected = (result.rowsAffected && result.rowsAffected.reduce((sum, val) => sum + (val || 0), 0)) || 0;
  return affected > 0;
}

async function updateEstado(mesaId, estadoMesa) {
  const pool = await getLocalPool();
  const query = `
    UPDATE mesa 
    SET estado_mesa = @estadoMesa 
    WHERE id_mesa = @mesaId
  `;
  await pool.request()
    .input('mesaId', sql.Int, mesaId)
    .input('estadoMesa', sql.VarChar, estadoMesa)
    .query(query);
}

async function getActiveComandasCount(mesaId) {
  const pool = await getLocalPool();
  const query = `
    SELECT COUNT(*) as count 
    FROM comanda_cab 
    WHERE id_mesa = @mesaId AND estado_comanda NOT IN ('CERRADO')
  `;
  const result = await pool.request()
    .input('mesaId', sql.Int, mesaId)
    .query(query);
  return result.recordset[0].count;
}

async function toggleActivo(mesaId, nuevoEstado) {
  const pool = await getLocalPool();
  const query = `
    UPDATE mesa 
    SET estado = @nuevoEstado 
    WHERE id_mesa = @mesaId
  `;
  await pool.request()
    .input('mesaId', sql.Int, mesaId)
    .input('nuevoEstado', sql.Bit, nuevoEstado)
    .query(query);
}

module.exports = {
  listByTienda,
  listByTiendaActivas,
  getById,
  create,
  update,
  deleteMesa,
  updateEstado,
  getActiveComandasCount,
  toggleActivo
};
