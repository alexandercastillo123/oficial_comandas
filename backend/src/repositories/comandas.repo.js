const sql = require('mssql');
const { getLocalPool } = require('../config/db');
const { generateTicketNumber } = require('../utils/ticket');

async function listByMesa(mesaId, estado) {
  const pool = await getLocalPool();
  let query = `
    SELECT cc.id_comanda_cab, cc.nro_ticket, cc.id_mesa, cc.id_tienda, cc.id_usuario_mozo,
           cc.nombre_cliente, cc.estado_comanda, cc.subtotal, cc.igv, cc.total,
           cc.reimpresiones, cc.observacion,
           CONVERT(varchar(33), cc.fecha_creacion AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 127) as fecha_creacion,
           u.nombre as mozo
    FROM comanda_cab cc
    JOIN usuario u ON cc.id_usuario_mozo = u.id_usuario
    WHERE cc.id_mesa = @mesaId
      AND cc.estado_comanda <> 'CERRADO'
  `;
  
  const req = pool.request().input('mesaId', sql.Int, mesaId);
  if (estado) {
    query += ` AND cc.estado_comanda = @estado`;
    req.input('estado', sql.VarChar, estado);
  }
  query += ` ORDER BY cc.fecha_creacion DESC`;

  const result = await req.query(query);
  return result.recordset;
}

async function listCocina(tiendaId) {
  const pool = await getLocalPool();
  const query = `
    SELECT cc.id_comanda_cab, cc.nro_ticket, cc.id_mesa, cc.id_tienda, cc.id_usuario_mozo,
           cc.nombre_cliente, cc.estado_comanda, cc.observacion,
           CONVERT(varchar(33), cc.fecha_creacion AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 127) as fecha_creacion,
           m.numero as numero_mesa, u.nombre as mozo
    FROM comanda_cab cc
    JOIN mesa m ON cc.id_mesa = m.id_mesa
    JOIN usuario u ON cc.id_usuario_mozo = u.id_usuario
    WHERE cc.id_tienda = @tiendaId AND cc.estado_comanda = 'EN_COCINA'
    ORDER BY cc.fecha_creacion ASC
  `;
  
  const result = await pool.request()
    .input('tiendaId', sql.Int, tiendaId)
    .query(query);
  return result.recordset;
}

async function getDetailsByCabId(cabId) {
  const pool = await getLocalPool();
  const query = `
    SELECT cd.id_comanda_det, cd.id_producto, cd.cantidad, cd.precio_unitario,
           cd.descuento, cd.subtotal, cd.observacion_item, cd.estado_item,
           p.nombre as nombre_producto
    FROM comanda_det cd
    JOIN producto p ON cd.id_producto = p.id_producto
    WHERE cd.id_comanda_cab = @cabId
  `;
  const result = await pool.request()
    .input('cabId', sql.Int, cabId)
    .query(query);
  return result.recordset;
}

async function getById(cabId) {
  const pool = await getLocalPool();
  const query = `
    SELECT cc.id_comanda_cab, cc.nro_ticket, cc.id_mesa, cc.id_tienda, cc.id_usuario_mozo,
           cc.nombre_cliente, cc.estado_comanda, cc.subtotal, cc.igv, cc.total,
           cc.reimpresiones, cc.observacion, CONVERT(varchar(33), cc.fecha_creacion AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 127) as fecha_creacion, m.numero as numero_mesa,
           u.nombre as mozo
    FROM comanda_cab cc
    JOIN mesa m ON cc.id_mesa = m.id_mesa
    JOIN usuario u ON cc.id_usuario_mozo = u.id_usuario
    WHERE cc.id_comanda_cab = @cabId
  `;
  const result = await pool.request()
    .input('cabId', sql.Int, cabId)
    .query(query);
  
  if (!result.recordset[0]) return null;
  
  const items = await getDetailsByCabId(cabId);
  return {
    ...result.recordset[0],
    items
  };
}

async function createComanda(comandaData, totales) {
  const pool = await getLocalPool();
  const transaction = new sql.Transaction(pool);
   
  try {
    await transaction.begin();
     
    // Generar número de ticket
    const reqTicket = new sql.Request(transaction);
    const nro_ticket = await generateTicketNumber(reqTicket);
     
    // Insertar cabecera
    const queryCab = `
      INSERT INTO comanda_cab (nro_ticket, id_mesa, id_tienda, id_usuario_mozo, nombre_cliente,
                               estado_comanda, subtotal, igv, total, observacion, fecha_creacion, usuario_creacion)
      OUTPUT INSERTED.id_comanda_cab
      VALUES (@nro_ticket, @id_mesa, @id_tienda, @id_usuario_mozo, @nombre_cliente,
              'EN_COCINA', @subtotal, @igv, @total, @observacion, GETDATE(), @id_usuario_mozo)
    `;
     
    const reqCab = new sql.Request(transaction);
    const resultCab = await reqCab
      .input('nro_ticket', sql.VarChar, nro_ticket)
      .input('id_mesa', sql.Int, comandaData.id_mesa)
      .input('id_tienda', sql.Int, comandaData.id_tienda)
      .input('id_usuario_mozo', sql.Int, comandaData.id_usuario_mozo)
      .input('nombre_cliente', sql.VarChar, comandaData.nombre_cliente || null)
      .input('subtotal', sql.Decimal(10, 2), totales.subtotal)
      .input('igv', sql.Decimal(10, 2), totales.igv)
      .input('total', sql.Decimal(10, 2), totales.total)
      .input('observacion', sql.VarChar, comandaData.observacion || null)
      .query(queryCab);
      
    const cabId = resultCab.recordset[0].id_comanda_cab;
     
    // Insertar detalles
    for (const item of comandaData.items) {
      const subtotalItem = (item.cantidad * item.precio_unitario) - (item.descuento || 0);
      const queryDet = `
        INSERT INTO comanda_det (id_comanda_cab, id_producto, cantidad, precio_unitario,
                                 descuento, subtotal, observacion_item, estado_item, fecha_creacion)
        VALUES (@cabId, @id_producto, @cantidad, @precio_unitario,
                @descuento, @subtotal, @observacion_item, 'PENDIENTE', GETDATE())
      `;
       
      const reqDet = new sql.Request(transaction);
      await reqDet
        .input('cabId', sql.Int, cabId)
        .input('id_producto', sql.Int, item.id_producto)
        .input('cantidad', sql.Decimal(10, 2), item.cantidad)
        .input('precio_unitario', sql.Decimal(10, 2), item.precio_unitario)
        .input('descuento', sql.Decimal(10, 2), item.descuento || 0)
        .input('subtotal', sql.Decimal(10, 2), subtotalItem)
        .input('observacion_item', sql.VarChar, item.observacion_item || null)
        .query(queryDet);
    }
    
    // Cambiar estado de la mesa a 'OCUPADA'
    const queryMesa = `
      UPDATE mesa 
      SET estado_mesa = 'OCUPADA' 
      WHERE id_mesa = @id_mesa
    `;
    const reqMesa = new sql.Request(transaction);
    await reqMesa
      .input('id_mesa', sql.Int, comandaData.id_mesa)
      .query(queryMesa);
       
    await transaction.commit();
    return cabId;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function updateEstado(cabId, estadoComanda) {
  const pool = await getLocalPool();
  const query = `
    UPDATE comanda_cab 
    SET estado_comanda = @estadoComanda,
        fecha_actualizacion = GETDATE()
    WHERE id_comanda_cab = @cabId
  `;
  await pool.request()
    .input('cabId', sql.Int, cabId)
    .input('estadoComanda', sql.VarChar, estadoComanda)
    .query(query);
}

async function incrementarReimpresion(cabId) {
  const pool = await getLocalPool();
  const query = `
    UPDATE comanda_cab 
    SET reimpresiones = reimpresiones + 1 
    WHERE id_comanda_cab = @cabId
  `;
  await pool.request()
    .input('cabId', sql.Int, cabId)
    .query(query);
}

async function listByTienda(tiendaId, estado) {
  const pool = await getLocalPool();
  let query = `
    SELECT cc.id_comanda_cab, cc.nro_ticket, cc.id_mesa, cc.id_tienda, cc.id_usuario_mozo,
           cc.nombre_cliente, cc.estado_comanda, cc.subtotal, cc.igv, cc.total,
           cc.reimpresiones, cc.observacion,
           CONVERT(varchar(33), cc.fecha_creacion AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 127) as fecha_creacion,
           u.nombre as mozo, m.numero as numero_mesa
    FROM comanda_cab cc
    JOIN usuario u ON cc.id_usuario_mozo = u.id_usuario
    JOIN mesa m ON cc.id_mesa = m.id_mesa
    WHERE cc.id_tienda = @tiendaId
  `;
  
  const req = pool.request().input('tiendaId', sql.Int, tiendaId);
  if (estado) {
    query += ` AND cc.estado_comanda = @estado`;
    req.input('estado', sql.VarChar, estado);
  }
  query += ` ORDER BY cc.fecha_creacion DESC`;

  const result = await req.query(query);
  return result.recordset;
}

module.exports = {
  listByMesa,
  listCocina,
  getDetailsByCabId,
  getById,
  createComanda,
  updateEstado,
  incrementarReimpresion,
  listByTienda
};
