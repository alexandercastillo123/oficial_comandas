const sql = require('mssql');
const { getLocalPool } = require('../config/db');

async function list({ categoryId, search, page = 1, limit = 10 }) {
  const pool = await getLocalPool();
  const offset = (page - 1) * limit;

  let queryBase = `
    FROM producto p
    JOIN categoria c ON p.id_categoria = c.id_categoria
    WHERE p.estado = 1 AND c.id_grupo IN (8, 9)
  `;

  const req = pool.request();

  if (categoryId) {
    queryBase += ` AND p.id_categoria = @categoryId`;
    req.input('categoryId', sql.Int, categoryId);
  }

  if (search) {
    queryBase += ` AND (p.nombre LIKE '%' + @search + '%' OR p.barra LIKE '%' + @search + '%')`;
    req.input('search', sql.VarChar, search);
  }

  // Obtener conteo total
  const countQuery = `SELECT COUNT(*) as total ${queryBase}`;
  const countResult = await req.query(countQuery);
  const totalItems = countResult.recordset[0].total;

  // Obtener registros paginados
  const dataQuery = `
    SELECT p.id_producto, p.nombre, p.precio_mesa, p.descripcion, p.imagen_url, c.nombre as categoria
    ${queryBase}
    ORDER BY p.nombre ASC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `;
  
  req.input('offset', sql.Int, offset);
  req.input('limit', sql.Int, limit);

  const dataResult = await req.query(dataQuery);

  return {
    items: dataResult.recordset,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    currentPage: parseInt(page, 10)
  };
}

async function getById(productoId) {
  const pool = await getLocalPool();
  const query = `
    SELECT p.id_producto, p.nombre, p.precio_mesa, p.descripcion, p.imagen_url, c.nombre as categoria
    FROM producto p
    JOIN categoria c ON p.id_categoria = c.id_categoria
    WHERE p.id_producto = @productoId AND p.estado = 1
  `;
  const result = await pool.request()
    .input('productoId', sql.Int, productoId)
    .query(query);
  return result.recordset[0] || null;
}

async function listCategorias() {
  const pool = await getLocalPool();
  const query = `
    SELECT id_categoria, nombre, imagen_url 
    FROM categoria 
    WHERE estado = 1 AND id_grupo IN (8, 9)
    ORDER BY nombre ASC
  `;
  const result = await pool.request().query(query);
  return result.recordset;
}

module.exports = {
  list,
  getById,
  listCategorias
};
