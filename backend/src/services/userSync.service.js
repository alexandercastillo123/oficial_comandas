// backend/src/services/userSync.service.js
/**
 * Sincronización de usuarios desde la nube hacia el local.
 * Trae usuarios activos de la sucursal y los mergea sin duplicados.
 * Usa 'usuario' (username UNIQUE) como clave natural para evitar colisiones de id_usuario entre sucursales.
 */

const sql = require('mssql');
const { getLocalPool, getCloudPool } = require('../config/db');

const INTERVAL_MS = parseInt(process.env.SYNC_USER_INTERVAL_MS, 10) || 15 * 60 * 1000;
const ID_TIENDA = parseInt(process.env.ID_TIENDA, 10) || 1;

async function syncUsers(local, cloud) {
  const lastSync = await local.request()
    .input('id_tienda', sql.Int, ID_TIENDA)
    .input('tabla', sql.NVarChar, 'usuario')
    .query('SELECT ultima_descarga FROM sync_control WHERE id_tienda = @id_tienda AND tabla = @tabla');

  const lastDownload = lastSync.recordset[0]?.ultima_descarga || new Date(0);

  const cloudRes = await cloud.request()
    .input('id_tienda', sql.Int, ID_TIENDA)
    .input('fecha_mod', sql.DateTime2, lastDownload)
    .query(`
      SELECT u.id_usuario, u.nombre, u.direccion, u.telefono, u.documento_identidad,
             u.usuario, u.clave, u.estado, u.avatar_url, u.fecha_creacion,
             u.usuario_creacion, c.id_cargo, c.descripcion as cargo, c.rol_app
      FROM usuario u
      LEFT JOIN cargo c ON u.id_cargo = c.id_cargo
      WHERE u.estado = 1
        AND EXISTS (SELECT 1 FROM usuario_tienda ut WHERE ut.id_usuario = u.id_usuario AND ut.id_tienda = @id_tienda)
        AND u.fecha_modificacion > @fecha_mod
    `);

  const rows = cloudRes.recordset;
  if (!rows.length) {
    await local.request()
      .input('id_tienda', sql.Int, ID_TIENDA)
      .input('tabla', sql.NVarChar, 'usuario')
      .input('fecha', sql.DateTime2, new Date())
      .query('UPDATE sync_control SET ultima_descarga = @fecha WHERE id_tienda = @id_tienda AND tabla = @tabla');
    return;
  }

  for (const row of rows) {
    const columns = Object.keys(row);
    const setClause = columns.map(col => `[${col}] = @${col}`).join(', ');

    // Merge por clave natural 'usuario' (UNIQUE), no por id_usuario
    const mergeSql = `
      MERGE INTO usuario AS target
      USING (SELECT ${columns.map(col => `@${col} AS ${col}`).join(', ')}) AS src
      ON target.usuario = src.usuario
      WHEN MATCHED THEN UPDATE SET ${setClause}
      WHEN NOT MATCHED THEN INSERT (${columns.join(', ')}) VALUES (${columns.map(col => `src.${col}`).join(', ')});
    `;

    const req = local.request();
    for (const col of columns) {
      const val = row[col];
      if (val instanceof Date) req.input(col, sql.DateTime2, val);
      else if (typeof val === 'number') req.input(col, sql.Int, val);
      else req.input(col, sql.NVarChar, val);
    }
    await req.query(mergeSql);
  }

  await local.request()
    .input('id_tienda', sql.Int, ID_TIENDA)
    .input('tabla', sql.NVarChar, 'usuario')
    .input('fecha', sql.DateTime2, new Date())
    .query('UPDATE sync_control SET ultima_descarga = @fecha WHERE id_tienda = @id_tienda AND tabla = @tabla');
}

async function runUserSync() {
  try {
    const local = await getLocalPool();
    const cloud = getCloudPool();
    if (!cloud) {
      console.log('ℹ️ userSync omitido: nube no disponible.');
      return;
    }

    await syncUsers(local, cloud);
    console.log('🔄 User sync completado en', new Date().toISOString());
  } catch (err) {
    console.warn('⚠️ userSync omitido:', err?.message || err);
  }
}

setInterval(runUserSync, INTERVAL_MS);
runUserSync();

module.exports = { runUserSync };
