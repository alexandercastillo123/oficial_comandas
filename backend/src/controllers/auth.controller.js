const authService = require('../services/auth.service');
const { ok, fail } = require('../utils/response');

async function login(req, res, next) {
  try {
    const { usuario, clave } = req.body;
    const data = await authService.login(usuario, clave);
    return ok(res, data);
  } catch (error) {
    return fail(res, error.message, 401);
  }
}

async function logout(req, res, next) {
  try {
    // En una API REST básica, el logout se maneja invalidando el token en el cliente.
    // Opcionalmente se puede guardar en una blacklist en memoria/Redis.
    return ok(res, { message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    // req.user viene cargado desde el middleware verifyToken
    return ok(res, { user: req.user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  logout,
  me
};
