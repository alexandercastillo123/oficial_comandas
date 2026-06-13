const { fail } = require('../utils/response');

function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    if (!req.user || !req.user.rol_app) {
      return fail(res, 'Acceso no autorizado: rol no definido', 403);
    }

    if (!roles.includes(req.user.rol_app)) {
      return fail(res, `Acceso denegado: se requiere rol ${roles.join(' o ')}`, 403);
    }

    next();
  };
}

module.exports = requireRole;
