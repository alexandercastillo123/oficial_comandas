// backend/src/services/upSync.service.js
/**
 * Sincronización ascendente: local -> nube.
 * Sube TODO el operativo local (usuarios, mesas, comandas, detalles).
 * Usa claves naturales para evitar colisiones de ID entre sucursales:
 *   - usuario: username (UNIQUE)
 *   - usuario_tienda: (id_usuario, id_tienda) uniqueness
 *   - mesa: (id_tienda, numero) uniqueness
 *   - comanda_cab: nro_ticket (UNIQUE)
 *   - comanda_det: (id_comanda_cab_cloud, id_producto, observacion_item)
 * sync_estado (0=pending,1=ok,2=error) controla la cola de reintento.
 */

const sql = require('mssql');
const { getLocalPool, getCloudPool } = require('../config/db');

const INTERVAL_MS = parseInt(process.env.SYNC_UP_INTERVAL_MS, 10) || 5 * 60 * 1000;
const ID_TIENDA = parseInt(process.env.ID_TIENDA, 10) || 1;

const UP_TABLES = [
  { name: 'usuario', pk: 'id_usuario' },
  { name: 'usuario_tienda', pk: 'id_usuario_tienda' },
  { name: 'mesa', pk: 'id_mesa' },
  { name: 'comanda_cab', pk: 'id_comanda_cab' },
  { name: 'comanda_det', pk: 'id_comanda_det' },
];

async function getPending(local, table) {
  const res = await local.request()
    .input('estado', sql.TinyInt, 0)
    .input('tabla', sql.NVarChar, table.name)
    .query(`
      SELECT * FROM ${table.name}
      WHERE sync_estado = @estado
        AND (sync_intentos < 5 OR sync_intentos IS NULL)
    `);
  return res.recordset;
}

async function markSynced(local, table, ids) {
  if (!ids.length) return;
  await local.request()
    .input('tabla', sql.NVarChar, table.name)
    .input('fecha', sql.DateTime2, new Date())
    .input('estado', sql.TinyInt, 1)
    .input('ids', ids)
    .query(`
      UPDATE ${table.name}
      SET sync_estado = @estado, sync_fecha = @fecha
      WHERE (${table.pk} IN (SELECT value FROM STRING_SPLIT(@ids, ',')))
    `);
}

async function markError(local, table, ids) {
  if (!ids.length) return;
  await local.request()
    .input('tabla', sql.NVarChar, table.name)
    .input('ids', ids)
    .query(`
      UPDATE ${table.name}
      SET sync_intentos = ISNULL(sync_intentos,0) + 1,
          sync_estado = CASE WHEN ISNULL(sync_intentos,0) + 1 >= 5 THEN 2 ELSE sync_estado END
      WHERE (${table.pk} IN (SELECT value FROM STRING_SPLIT(@ids, ',')))
    `);
}

async function upsertUsuario(cloud, row) {
  const columns = Object.keys(row).filter(c => c !== 'id_usuario');
  const setClause = columns.map(col => `[${col}] = @${col}`).join(', ');
  const req = cloud.request();
  for (const col of columns) {
    const val = row[col];
    if (val instanceof Date) req.input(col, sql.DateTime2, val);
    else if (typeof val === 'number') req.input(col, sql.Int, val);
    else req.input(col, sql.NVarChar, val);
  }
  req.input('usuario', sql.NVarChar, row.usuario);
  await req.query(`
    MERGE INTO usuario AS target
    USING (SELECT ${columns.map(c => `@${c} AS ${c}`).join(', ')}, @usuario AS usuario) AS src
    ON target.usuario = src.usuario
    WHEN MATCHED THEN UPDATE SET ${setClause}
    WHEN NOT MATCHED THEN INSERT (${columns.join(', ')}, usuario) VALUES (${columns.map(c => `src.${c}`).join(', ')}, src.usuario);
  `);
}

async function upsertUsuarioTienda(cloud, row) {
  const exists = await cloud.request()
    .input('id_usuario', sql.Int, row.id_usuario)
    .input('id_tienda', sql.Int, row.id_tienda)
    .query(`SELECT 1 FROM usuario_tienda WHERE id_usuario = @id_usuario AND id_tienda = @id_tienda`);

  if (exists.recordset.length) {
    const cols = Object.keys(row).filter(c => !['id_usuario_tienda', 'id_usuario', 'id_tienda'].includes(c));
    if (!cols.length) return;
    const setClause = cols.map(col => `[${col}] = @${col}`).join(', ');
    const req = cloud.request();
    for (const col of cols) {
      const val = row[col];
      if (val instanceof Date) req.input(col, sql.DateTime2, val);
      else if (typeof val === 'number') req.input(col, sql.Int, val);
      else req.input(col, sql.NVarChar, val);
    }
    req.input('id_usuario', sql.Int, row.id_usuario);
    req.input('id_tienda', sql.Int, row.id_tienda);
    await req.query(`UPDATE usuario_tienda SET ${setClause} WHERE id_usuario = @id_usuario AND id_tienda = @id_tienda`);
  } else {
    const columns = Object.keys(row);
    const cols = columns.join(', ');
    const params = columns.map(col => `@${col}`).join(', ');
    const req = cloud.request();
    for (const col of columns) {
      const val = row[col];
      if (val instanceof Date) req.input(col, sql.DateTime2, val);
      else if (typeof val === 'number') req.input(col, sql.Int, val);
      else req.input(col, sql.NVarChar, val);
    }
    await req.query(`INSERT INTO usuario_tienda (${cols}) VALUES (${params})`);
  }
}

async function upsertMesa(cloud, row) {
  const exists = await cloud.request()
    .input('id_tienda', sql.Int, row.id_tienda)
    .input('numero', sql.NVarChar, row.numero)
    .query(`SELECT id_mesa FROM mesa WHERE id_tienda = @id_tienda AND numero = @numero`);

  const columns = Object.keys(row).filter(c => c !== 'id_mesa');
  const setClause = columns.map(col => `[${col}] = @${col}`).join(', ');

  if (exists.recordset.length) {
    const cloudIdMesa = exists.recordset[0].id_mesa;
    if (!columns.length) return;
    const req = cloud.request();
    for (const col of columns) {
      const val = row[col];
      if (val instanceof Date) req.input(col, sql.DateTime2, val);
      else if (typeof val === 'number') req.input(col, sql.Int, val);
      else req.input(col, sql.NVarChar, val);
    }
    req.input('id_mesa', sql.Int, cloudIdMesa);
    await req.query(`UPDATE mesa SET ${setClause} WHERE id_mesa = @id_mesa`);
  } else {
    const cols = columns.join(', ');
    const params = columns.map(col => `@${col}`).join(', ');
    const req = cloud.request();
    for (const col of columns) {
      const val = row[col];
      if (val instanceof Date) req.input(col, sql.DateTime2, val);
      else if (typeof val === 'number') req.input(col, sql.Int, val);
      else req.input(col, sql.NVarChar, val);
    }
    await req.query(`INSERT INTO mesa (${cols}) VALUES (${params})`);
  }
}

async function upsertComandaCab(cloud, row) {
  const exists = await cloud.request()
    .input('nro_ticket', sql.NVarChar, row.nro_ticket)
    .query(`SELECT id_comanda_cab FROM comanda_cab WHERE nro_ticket = @nro_ticket`);

  const columns = Object.keys(row).filter(c => c !== 'id_comanda_cab');
  const setClause = columns.map(col => `[${col}] = @${col}`).join(', ');

  if (exists.recordset.length) {
    const cloudId = exists.recordset[0].id_comanda_cab;
    if (!columns.length) return cloudId;
    const req = cloud.request();
    for (const col of columns) {
      const val = row[col];
      if (val instanceof Date) req.input(col, sql.DateTime2, val);
      else if (typeof val === 'number') req.input(col, sql.Int, val);
      else req.input(col, sql.NVarChar, val);
    }
    req.input('id_comanda_cab', sql.Int, cloudId);
    await req.query(`UPDATE comanda_cab SET ${setClause} WHERE id_comanda_cab = @id_comanda_cab`);
    return cloudId;
  } else {
    const cols = columns.join(', ');
    const params = columns.map(col => `@${col}`).join(', ');
    const req = cloud.request();
    for (const col of columns) {
      const val = row[col];
      if (val instanceof Date) req.input(col, sql.DateTime2, val);
      else if (typeof val === 'number') req.input(col, sql.Int, val);
      else req.input(col, sql.NVarChar, val);
    }
    const result = await req.query(`INSERT INTO comanda_cab (${cols}) OUTPUT INSERTED.id_comanda_cab VALUES (${params})`);
    return result.recordset[0].id_comanda_cab;
  }
}

async function upsertComandaDet(cloud, row, cloudIdComandaCab) {
  const exists = await cloud.request()
    .input('id_comanda_cab', sql.Int, cloudIdComandaCab)
    .input('id_producto', sql.Int, row.id_producto)
    .input('observacion_item', sql.NVarChar, row.observacion_item)
    .query(`SELECT id_comanda_det FROM comanda_det WHERE id_comanda_cab = @id_comanda_cab AND id_producto = @id_producto AND observacion_item = @observacion_item`);

  const columns = Object.keys(row).filter(c => !['id_comanda_det', 'id_comanda_cab'].includes(c));
  const setClause = columns.map(col => `[${col}] = @${col}`).join(', ');

  if (exists.recordset.length) {
    if (!columns.length) return;
    const req = cloud.request();
    for (const col of columns) {
      const val = row[col];
      if (val instanceof Date) req.input(col, sql.DateTime2, val);
      else if (typeof val === 'number') req.input(col, sql.Int, val);
      else req.input(col, sql.NVarChar, val);
    }
    req.input('id_comanda_det', sql.Int, exists.recordset[0].id_comanda_det);
    await req.query(`UPDATE comanda_det SET ${setClause} WHERE id_comanda_det = @id_comanda_det`);
  } else {
    const insertCols = ['id_comanda_cab', ...columns];
    const insertRow = { id_comanda_cab: cloudIdComandaCab, ...row };
    const cols = insertCols.join(', ');
    const params = insertCols.map(c => `@${c}`).join(', ');
    const req = cloud.request();
    for (const col of insertCols) {
      const val = insertRow[col];
      if (val instanceof Date) req.input(col, sql.DateTime2, val);
      else if (typeof val === 'number') req.input(col, sql.Int, val);
      else req.input(col, sql.NVarChar, val);
    }
    await req.query(`INSERT INTO comanda_det (${cols}) VALUES (${params})`);
  }
}

async function syncTable(local, cloud, table) {
  const rows = await getPending(local, table);
  if (!rows.length) return;

  const ids = rows.map(r => r[table.pk]).join(',');
  try {
    for (const row of rows) {
      switch (table.name) {
        case 'usuario':
          await upsertUsuario(cloud, row);
          break;
        case 'usuario_tienda':
          await upsertUsuarioTienda(cloud, row);
          break;
        case 'mesa':
          await upsertMesa(cloud, row);
          break;
        case 'comanda_cab':
          await upsertComandaCab(cloud, row);
          break;
        case 'comanda_det': {
          // Buscar el id_comanda_cab en la nube por nro_ticket del local
          const localCab = await local.request()
            .input('id_comanda_cab', sql.Int, row.id_comanda_cab)
            .query(`SELECT nro_ticket FROM comanda_cab WHERE id_comanda_cab = @id_comanda_cab`);
          const nroTicket = localCab.recordset[0]?.nro_ticket;
          if (nroTicket) {
            const cloudCab = await cloud.request()
              .input('nro_ticket', sql.NVarChar, nroTicket)
              .query(`SELECT id_comanda_cab FROM comanda_cab WHERE nro_ticket = @nro_ticket`);
            const cloudId = cloudCab.recordset[0]?.id_comanda_cab;
            if (cloudId) {
              await upsertComandaDet(cloud, { ...row, id_comanda_cab: cloudId }, cloudId);
            }
          }
          break;
        }
      }
    }

    await markSynced(local, table, ids);
    console.log(`⬆️ ${table.name}: ${rows.length} registros subidos.`);
  } catch (err) {
    console.warn(`⚠️ Error subiendo ${table.name}:`, err?.message || err);
    await markError(local, table, ids);
  }
}

async function runUpSync() {
  try {
    const local = await getLocalPool();
    const cloud = getCloudPool();
    if (!cloud) {
      console.log('ℍ️ upSync omitido: nube no disponible.');
      return;
    }

    for (const table of UP_TABLES) {
      try {
        await syncTable(local, cloud, table);
      } catch (err) {
        console.warn(`⚠️ upSync omitido para ${table.name}:`, err?.message || err);
      }
    }
  } catch (err) {
    console.warn('⚠️ upSync omitido:', err?.message || err);
  }
}

setInterval(runUpSync, INTERVAL_MS);
runUpSync();

module.exports = { runUpSync };
