const mesasService = require('../services/mesas.service');
const { ok } = require('../utils/response');

async function getMesas(req, res, next) {
  try {
    const tiendaId = req.user.id_tienda;
    const data = await mesasService.getMesas(tiendaId, req.user.rol_app);
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

async function getMesa(req, res, next) {
  try {
    const { id } = req.params;
    const data = await mesasService.getMesa(parseInt(id, 10));
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

async function crearMesa(req, res, next) {
  try {
    const tiendaId = req.user.id_tienda;
    const mesaData = {
      ...req.body,
      id_tienda: tiendaId,
      usuario_creacion: req.user.id_usuario
    };
    const id = await mesasService.crearMesa(mesaData);
    return ok(res, { id_mesa: id, message: 'Mesa creada correctamente' }, 201);
  } catch (error) {
    next(error);
  }
}

async function editarMesa(req, res, next) {
  try {
    const { id } = req.params;
    await mesasService.editarMesa(parseInt(id, 10), req.body);
    return ok(res, { message: 'Mesa actualizada correctamente' });
  } catch (error) {
    next(error);
  }
}

async function eliminarMesa(req, res, next) {
  try {
    const { id } = req.params;
    await mesasService.eliminarMesa(parseInt(id, 10));
    return ok(res, { message: 'Mesa eliminada correctamente' });
  } catch (error) {
    next(error);
  }
}

async function cambiarEstado(req, res, next) {
  try {
    const { id } = req.params;
    const { estado_mesa } = req.body;
    await mesasService.actualizarEstadoMesa(parseInt(id, 10), estado_mesa);
    return ok(res, { message: 'Estado de mesa actualizado correctamente' });
  } catch (error) {
    next(error);
  }
}

async function toggleActivo(req, res, next) {
  try {
    const { id } = req.params;
    const mesa = await mesasService.getMesa(parseInt(id, 10));
    const nuevoEstado = mesa.estado === true || mesa.estado === 1 ? 0 : 1;
    await mesasService.toggleActivoMesa(parseInt(id, 10), nuevoEstado);
    return ok(res, { message: `Mesa ${nuevoEstado === 1 ? 'activada' : 'desactivada'} correctamente` });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMesas,
  getMesa,
  crearMesa,
  editarMesa,
  eliminarMesa,
  cambiarEstado,
  toggleActivo
};
