const sql = require('mssql');
const { getLocalPool } = require('../config/db');

async function findByUsername(username) {
  const pool = await getLocalPool();
  const query = `
    SELECT u.id_usuario, u.nombre, u.direccion, u.telefono, u.documento_identidad, u.usuario, u.clave, u.estado, c.id_cargo, c.descripcion as cargo, c.rol_app 
    FROM usuario u 
    LEFT JOIN cargo c ON u.id_cargo = c.id_cargo 
    WHERE u.usuario = @username AND u.estado = 1
  `;
  
  const result = await pool.request()
    .input('username', username)
    .query(query);
    
  return result.recordset[0] || null;
}

async function getUserTiendas(userId) {
  const pool = await getLocalPool();
  const query = `
    SELECT t.id_tienda, t.descripcion, t.ubicacion, ut.es_principal 
    FROM usuario_tienda ut 
    JOIN tienda t ON ut.id_tienda = t.id_tienda 
    WHERE ut.id_usuario = @userId AND ut.estado = 1 AND t.estado = 1
  `;
  
  const result = await pool.request()
    .input('userId', userId)
    .query(query);
    
  return result.recordset;
}

module.exports = {
  findByUsername,
  getUserTiendas
};
