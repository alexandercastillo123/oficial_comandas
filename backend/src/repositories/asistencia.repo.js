const sql = require('mssql');
const { getLocalPool } = require('../config/db');

async function createTurno(data) {
  const pool = await getLocalPool();
  
  const ensureDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'string') {
      const parts = val.split(':');
      if (parts.length >= 2) {
        const d = new Date();
        d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), parts.length > 2 ? parseInt(parts[2].split('.')[0], 10) : 0, 0);
        return d;
      }
    }
    return null;
  };

  const query = `
    INSERT INTO turno_usuario (id_usuario, id_tienda, hora_entrada, hora_salida, tolerancia_min, estado, usuario_creacion)
    OUTPUT INSERTED.id_turno_usuario
    VALUES (@id_usuario, @id_tienda, @hora_entrada, @hora_salida, @tolerancia_min, 1, @usuario_creacion)
  `;
  const result = await pool.request()
    .input('id_usuario', sql.Int, data.id_usuario)
    .input('id_tienda', sql.Int, data.id_tienda)
    .input('hora_entrada', sql.Time, ensureDate(data.hora_entrada))
    .input('hora_salida', sql.Time, ensureDate(data.hora_salida))
    .input('tolerancia_min', sql.Int, data.tolerancia_min || 15)
    .input('usuario_creacion', sql.Int, data.usuario_creacion || null)
    .query(query);
  return result.recordset[0].id_turno_usuario;
}

async function getByUsuario(idUsuario) {
  const pool = await getLocalPool();
  const query = `
    SELECT id_turno_usuario, id_usuario, id_tienda, hora_entrada, hora_salida, tolerancia_min, estado
    FROM turno_usuario
    WHERE id_usuario = @id_usuario AND estado = 1
  `;
  const result = await pool.request()
    .input('id_usuario', sql.Int, idUsuario)
    .query(query);
  return result.recordset[0] || null;
}

async function createAsistencia(data) {
  const pool = await getLocalPool();
  const query = `
    INSERT INTO asistencia (id_usuario, id_tienda, tipo, qr_token, observacion, usuario_creacion)
    OUTPUT INSERTED.id_asistencia
    VALUES (@id_usuario, @id_tienda, @tipo, @qr_token, @observacion, @usuario_creacion)
  `;
  const result = await pool.request()
    .input('id_usuario', sql.Int, data.id_usuario)
    .input('id_tienda', sql.Int, data.id_tienda)
    .input('tipo', sql.VarChar, data.tipo)
    .input('qr_token', sql.VarChar, data.qr_token)
    .input('observacion', sql.VarChar, data.observacion || null)
    .input('usuario_creacion', sql.Int, data.usuario_creacion || null)
    .query(query);
  return result.recordset[0].id_asistencia;
}

async function getAsistenciasByTienda(tiendaId, { fechaDesde, fechaHasta, idUsuario } = {}) {
  const pool = await getLocalPool();
  let query = `
    SELECT a.id_asistencia, a.id_usuario, a.id_tienda, a.tipo, a.fecha_hora, a.estado, a.qr_token, a.observacion,
           u.nombre, u.usuario
    FROM asistencia a
    JOIN usuario u ON a.id_usuario = u.id_usuario
    WHERE a.id_tienda = @tiendaId
      AND a.fecha_hora >= @fechaDesde
      AND a.fecha_hora < DATEADD(day, 1, @fechaHasta)
  `;
  const req = pool.request()
    .input('tiendaId', sql.Int, tiendaId)
    .input('fechaDesde', sql.DateTime2, fechaDesde)
    .input('fechaHasta', sql.DateTime2, fechaHasta);

  if (idUsuario) {
    query += ` AND a.id_usuario = @idUsuario`;
    req.input('idUsuario', sql.Int, idUsuario);
  }

  query += ` ORDER BY a.fecha_hora DESC`;
  const result = await req.query(query);
  return result.recordset;
}

async function getUltimasAsistenciasByUsuario(idUsuario, limit = 5) {
  const pool = await getLocalPool();
  const query = `
    SELECT TOP (@limit) id_asistencia, tipo, fecha_hora, estado, observacion
    FROM asistencia
    WHERE id_usuario = @id_usuario
    ORDER BY fecha_hora DESC
  `;
  const result = await pool.request()
    .input('id_usuario', sql.Int, idUsuario)
    .input('limit', sql.Int, limit)
    .query(query);
  return result.recordset;
}

async function getQrValido(token) {
  const pool = await getLocalPool();
  const query = `
    SELECT TOP 1 id_asistencia, id_usuario, id_tienda, tipo, fecha_hora, estado
    FROM asistencia
    WHERE qr_token = @qr_token
    ORDER BY fecha_hora DESC
  `;
  const result = await pool.request()
    .input('qr_token', sql.VarChar, token)
    .query(query);
  return result.recordset[0] || null;
}

async function updateAsistenciaEstado(idAsistencia, estado, observacion = null) {
  const pool = await getLocalPool();
  const query = `
    UPDATE asistencia
    SET estado = @estado,
        observacion = @observacion
    WHERE id_asistencia = @id_asistencia
  `;
  await pool.request()
    .input('id_asistencia', sql.Int, idAsistencia)
    .input('estado', sql.VarChar, estado)
    .input('observacion', sql.VarChar, observacion)
    .query(query);
}

async function obtenerAsistenciasHoy(idUsuario) {
  const pool = await getLocalPool();
  const query = `
    SELECT id_asistencia, tipo, fecha_hora, estado, qr_token, observacion
    FROM asistencia
    WHERE id_usuario = @idUsuario
      AND estado = 'VALIDADO'
      AND CAST(fecha_hora AS DATE) = CAST(GETDATE() AS DATE)
    ORDER BY fecha_hora ASC
  `;
  const result = await pool.request()
    .input('idUsuario', sql.Int, idUsuario)
    .query(query);
  return result.recordset;
}

async function desactivarTurnosUsuario(idUsuario) {
  const pool = await getLocalPool();
  const query = `
    UPDATE turno_usuario
    SET estado = 0
    WHERE id_usuario = @idUsuario
  `;
  await pool.request()
    .input('idUsuario', sql.Int, idUsuario)
    .query(query);
}

module.exports = {
  createTurno,
  getByUsuario,
  createAsistencia,
  getAsistenciasByTienda,
  getUltimasAsistenciasByUsuario,
  getQrValido,
  updateAsistenciaEstado,
  obtenerAsistenciasHoy,
  desactivarTurnosUsuario
};
