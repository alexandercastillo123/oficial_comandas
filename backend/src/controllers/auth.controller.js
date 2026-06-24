const authService = require('../services/auth.service');
const { ok, fail } = require('../utils/response');

async function login(req, res) {
  try {
    const { usuario, clave } = req.body || {};
    if (!usuario || !usuario.trim()) {
      return fail(res, 'El nombre de usuario es obligatorio', 400);
    }
    if (!clave || !clave.trim()) {
      return fail(res, 'La contraseña es obligatoria', 400);
    }

    const data = await authService.login(usuario.trim(), clave);
    return ok(res, data);
  } catch (error) {
    return fail(res, error.message || 'Error de autenticación', 401);
  }
}

async function logout(req, res) {
  try {
    return ok(res, { message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    return fail(res, error.message, 500);
  }
}

async function me(req, res) {
  try {
    return ok(res, { user: req.user });
  } catch (error) {
    return fail(res, error.message, 500);
  }
}

module.exports = {
  login,
  logout,
  me
};
