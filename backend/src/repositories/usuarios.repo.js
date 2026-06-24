const sql = require('mssql');
const { getLocalPool } = require('../config/db');

async function listByTienda(tiendaId, rolApp) {
  const pool = await getLocalPool();
  let query = `
    SELECT u.id_usuario, u.nombre, u.direccion, u.telefono, u.documento_identidad, 
           u.usuario, u.estado, u.avatar_url, c.id_cargo, c.descripcion as cargo, c.rol_app 
    FROM usuario u 
    JOIN usuario_tienda ut ON u.id_usuario = ut.id_usuario 
    LEFT JOIN cargo c ON u.id_cargo = c.id_cargo 
    WHERE ut.id_tienda = @tiendaId AND u.estado = 1
  `;
  
  const req = pool.request().input('tiendaId', sql.Int, tiendaId);
  
  if (rolApp) {
    query += ` AND c.rol_app = @rolApp`;
    req.input('rolApp', sql.VarChar, rolApp);
  }
  
  const result = await req.query(query);
  return result.recordset;
}

async function getById(userId) {
  const pool = await getLocalPool();
  const query = `
    SELECT u.id_usuario, u.nombre, u.direccion, u.telefono, u.documento_identidad, 
           u.usuario, u.estado, u.avatar_url, c.id_cargo, c.descripcion as cargo, c.rol_app 
    FROM usuario u 
    LEFT JOIN cargo c ON u.id_cargo = c.id_cargo 
    WHERE u.id_usuario = @userId
  `;
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query(query);
  return result.recordset[0] || null;
}

async function create(userData) {
  const pool = await getLocalPool();
  const query = `
    INSERT INTO usuario (nombre, direccion, telefono, documento_identidad, usuario, clave, id_cargo, estado)
    OUTPUT INSERTED.id_usuario
    VALUES (@nombre, @direccion, @telefono, @documento_identidad, @usuario, @clave, @id_cargo, 1)
  `;
  const result = await pool.request()
    .input('nombre', sql.VarChar, userData.nombre)
    .input('direccion', sql.VarChar, userData.direccion || null)
    .input('telefono', sql.VarChar, userData.telefono || null)
    .input('documento_identidad', sql.VarChar, userData.documento_identidad || null)
    .input('usuario', sql.VarChar, userData.usuario)
    .input('clave', sql.VarChar, userData.clave)
    .input('id_cargo', sql.Int, userData.id_cargo)
    .query(query);
  return result.recordset[0].id_usuario;
}

async function addUsuarioTienda(userId, tiendaId, esPrincipal = 0) {
  const pool = await getLocalPool();
  const query = `
    INSERT INTO usuario_tienda (id_usuario, id_tienda, es_principal, estado)
    VALUES (@userId, @tiendaId, @esPrincipal, 1)
  `;
  await pool.request()
    .input('userId', sql.Int, userId)
    .input('tiendaId', sql.Int, tiendaId)
    .input('esPrincipal', sql.Bit, esPrincipal)
    .query(query);
}

async function update(userId, userData) {
  const pool = await getLocalPool();
  let query = `
    UPDATE usuario 
    SET nombre = @nombre, 
        direccion = @direccion, 
        telefono = @telefono, 
        documento_identidad = @documento_identidad, 
        id_cargo = @id_cargo,
        fecha_actualizacion = GETDATE()
  `;
  
  const req = pool.request()
    .input('userId', sql.Int, userId)
    .input('nombre', sql.VarChar, userData.nombre)
    .input('direccion', sql.VarChar, userData.direccion || null)
    .input('telefono', sql.VarChar, userData.telefono || null)
    .input('documento_identidad', sql.VarChar, userData.documento_identidad || null)
    .input('id_cargo', sql.Int, userData.id_cargo);
    
  if (userData.clave) {
    query += `, clave = @clave`;
    req.input('clave', sql.VarChar, userData.clave);
  }
  
  query += ` WHERE id_usuario = @userId`;
  await req.query(query);
}

async function updatePerfil(userId, profileData) {
  const pool = await getLocalPool();
  let query = `
    UPDATE usuario 
    SET nombre = @nombre, 
        direccion = @direccion,
        telefono = @telefono, 
        avatar_url = @avatarUrl,
        fecha_actualizacion = GETDATE()
  `;
  
  const req = pool.request()
    .input('userId', sql.Int, userId)
    .input('nombre', sql.VarChar, profileData.nombre)
    .input('direccion', sql.VarChar, profileData.direccion || null)
    .input('telefono', sql.VarChar, profileData.telefono || null)
    .input('avatarUrl', sql.VarChar, profileData.avatar_url || null);
    
  if (profileData.clave) {
    query += `, clave = @clave`;
    req.input('clave', sql.VarChar, profileData.clave);
  }
  
  query += ` WHERE id_usuario = @userId`;
  await req.query(query);
}

async function updateClave(userId, hashClave) {
  const pool = await getLocalPool();
  const query = `
    UPDATE usuario 
    SET clave = @clave, 
        fecha_actualizacion = GETDATE()
    WHERE id_usuario = @userId
  `;
  await pool.request()
    .input('userId', sql.Int, userId)
    .input('clave', sql.VarChar, hashClave)
    .query(query);
}

async function updateEstado(userId, estado) {
  const pool = await getLocalPool();
  const query = `
    UPDATE usuario 
    SET estado = @estado 
    WHERE id_usuario = @userId
  `;
  await pool.request()
    .input('userId', sql.Int, userId)
    .input('estado', sql.Bit, estado)
    .query(query);
}

async function deleteUsuario(userId) {
  const pool = await getLocalPool();
  const query = `
    DELETE FROM usuario_tienda WHERE id_usuario = @userId;
    DELETE FROM usuario WHERE id_usuario = @userId;
  `;
  await pool.request()
    .input('userId', sql.Int, userId)
    .query(query);
}

module.exports = {
  listByTienda,
  getById,
  create,
  addUsuarioTienda,
  update,
  updatePerfil,
  updateClave,
  updateEstado,
  deleteUsuario
};
