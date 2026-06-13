const jwt = require('jsonwebtoken');
const { fail } = require('../utils/response');

function verifyToken(req, res, next) {
  let token = null;

  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  // Fallback para parámetros de consulta (necesario para EventSource / SSE en la web)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return fail(res, 'Token no provisto (cabecera Authorization o parámetro token)', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_deleite_2026');
    req.user = decoded; // { id_usuario, usuario, rol_app, id_tienda }
    next();
  } catch (error) {
    console.error('Error de verificación JWT:', error);
    return fail(res, 'Token inválido o expirado', 401);
  }
}

module.exports = verifyToken;
