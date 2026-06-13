// backend/src/services/downSync.service.js
/**
 * Sincronización descendente: nube -> local.
 * Catálogos generales sin filtro de sucursal.
 * Datos de sucursal (usuarios, mesas) SOLO de la sucursal local.
 */

const sql = require('mssql');
const { getLocalPool, getCloudPool } = require('../config/db');

const INTERVAL_MS = parseInt(process.env.SYNC_DOWN_INTERVAL_MS, 10) || 30 * 60 * 1000;
const ID_TIENDA = parseInt(process.env.ID_TIENDA, 10) || 1;

// Tablas que se sincronizan desde la nube hacia el local.
// 'sucursal: true' = se filtra por id_tienda (solo registros de esta sucursal).
// 'sucursal: false' = catálogo general, se baja completo.
const TABLES = [
  { name: 'tienda', pk: 'id_tienda', sucursal: false },
  { name: 'cargo', pk: 'id_cargo', sucursal: false },
  { name: 'usuario', pk: 'id_usuario', sucursal: true },
  { name: 'usuario_tienda', pk: 'id_usuario_tienda', sucursal: true },
  { name: 'grupo', pk: 'id_grupo', sucursal: false },
  { name: 'categoria', pk: 'id_categoria', sucursal: true },
  { name: 'producto', pk: 'id_producto', sucursal: true },
  { name: 'moneda', pk: 'id_moneda', sucursal: false },
  { name: 'unidad_medida', pk: 'id_unidad_medida', sucursal: false },
  { name: 'mesa', pk: 'id_mesa', sucursal: true },
];

async function getLastSync(local, tabla) {
  const res = await local.request()
    .input('id_tienda', sql.Int, ID_TIENDA)
    .input('tabla', sql.NVarChar, tabla)
    .query('SELECT ultima_descarga FROM sync_control WHERE id_tienda = @id_tienda AND tabla = @tabla');
  return res.recordset[0]?.ultima_descarga || new Date(0);
}

async function markSynced(local, tabla) {
  await local.request()
    .input('id_tienda', sql.Int, ID_TIENDA)
    .input('tabla', sql.NVarChar, tabla)
    .input('fecha', sql.DateTime2, new Date())
    .query("UPDATE sync_control SET ultima_descarga = @fecha, estado = 'OK' WHERE id_tienda = @id_tienda AND tabla = @tabla");
}

async function syncTable(local, cloud, table) {
  const lastDownload = await getLastSync(local, table.name);

  let cloudRes;
  if (table.sucursal) {
    // Tablas atadas a sucursal: solo traer registros de ESTA sucursal
    cloudRes = await cloud.request()
      .input('id_tienda', sql.Int, ID_TIENDA)
      .input('fecha_mod', sql.DateTime2, lastDownload)
      .query(`SELECT * FROM ${table.name} WHERE id_tienda = @id_tienda AND fecha_modificacion > @fecha_mod`);
  } else {
    // Catálogos generales: traer todo lo modificado
    cloudRes = await cloud.request()
      .input('fecha_mod', sql.DateTime2, lastDownload)
      .query(`SELECT * FROM ${table.name} WHERE fecha_modificacion > @fecha_mod`);
  }

  const rows = cloudRes.recordset;
  if (!rows.length) {
    await markSynced(local, table.name);
    return;
  }

  for (const row of rows) {
    const columns = Object.keys(row);
    const pk = table.pk;
    const setClause = columns.map(col => `[${col}] = @${col}`).join(', ');
    const mergeSql = `
      MERGE INTO ${table.name} AS target
      USING (SELECT ${columns.map(col => `@${col} AS ${col}`).join(', ')}) AS src
      ON target.${pk} = src.${pk}
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

  await markSynced(local, table.name);
}

async function runDownSync() {
  try {
    const local = await getLocalPool();
    const cloud = getCloudPool();
    if (!cloud) {
      console.log('ℹ️ downSync omitido: nube no disponible.');
      return;
    }

    for (const table of TABLES) {
      try {
        await syncTable(local, cloud, table);
      } catch (err) {
        console.warn(`⚠️ downSync omitido para ${table.name}:`, err?.message || err);
      }
    }

    console.log('🔄 Down sync completado en', new Date().toISOString());
  } catch (err) {
    console.warn('⚠️ downSync omitido:', err?.message || err);
  }
}

setInterval(runDownSync, INTERVAL_MS);
runDownSync();

module.exports = { runDownSync };
