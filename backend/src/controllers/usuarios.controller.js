const usuariosService = require('../services/usuarios.service');
const { ok } = require('../utils/response');

async function getTrabajadores(req, res, next) {
  try {
    const tiendaId = req.user.id_tienda;
    const { rol_app } = req.query;
    const data = await usuariosService.getTrabajadores(tiendaId, rol_app);
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

async function getTrabajador(req, res, next) {
  try {
    const { id } = req.params;
    const data = await usuariosService.getTrabajador(parseInt(id, 10));
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

async function crearTrabajador(req, res, next) {
  try {
    const tiendaId = req.user.id_tienda;
    const userId = await usuariosService.crearTrabajador(req.body, tiendaId);
    return ok(res, { id_usuario: userId, message: 'Trabajador creado correctamente' }, 201);
  } catch (error) {
    next(error);
  }
}

async function editarTrabajador(req, res, next) {
  try {
    const { id } = req.params;
    await usuariosService.editarTrabajador(parseInt(id, 10), req.body);
    return ok(res, { message: 'Trabajador actualizado correctamente' });
  } catch (error) {
    next(error);
  }
}

async function eliminarTrabajador(req, res, next) {
  try {
    const { id } = req.params;
    await usuariosService.eliminarTrabajador(parseInt(id, 10));
    return ok(res, { message: 'Trabajador eliminado correctamente' });
  } catch (error) {
    next(error);
  }
}

async function cambiarEstado(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    await usuariosService.desactivarTrabajador(parseInt(id, 10), estado);
    return ok(res, { message: 'Estado del trabajador actualizado' });
  } catch (error) {
    next(error);
  }
}

async function editarPerfil(req, res, next) {
  try {
    const id = req.user.id_usuario;
    await usuariosService.actualizarPerfil(id, req.body);
    return ok(res, { message: 'Perfil actualizado correctamente' });
  } catch (error) {
    next(error);
  }
}

async function cambiarClave(req, res, next) {
  try {
    const id = req.user.id_usuario;
    const { clave } = req.body;
    await usuariosService.actualizarClave(id, clave);
    return ok(res, { message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTrabajadores,
  getTrabajador,
  crearTrabajador,
  editarTrabajador,
  eliminarTrabajador,
  cambiarEstado,
  editarPerfil,
  cambiarClave
};
