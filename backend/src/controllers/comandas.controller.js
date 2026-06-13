const comandasService = require('../services/comandas.service');
const { ok } = require('../utils/response');

async function getComandas(req, res, next) {
  try {
    const { id_mesa, estado } = req.query;
    if (id_mesa) {
      const data = await comandasService.getComandasMesa(parseInt(id_mesa, 10), estado);
      return ok(res, data);
    } else {
      const tiendaId = req.user.id_tienda;
      const data = await comandasService.getComandasTienda(tiendaId, estado);
      return ok(res, data);
    }
  } catch (error) {
    next(error);
  }
}

async function getComandasCocina(req, res, next) {
  try {
    const tiendaId = req.user.id_tienda;
    const data = await comandasService.getComandasCocina(tiendaId);
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

async function getComanda(req, res, next) {
  try {
    const { id } = req.params;
    const data = await comandasService.getComanda(parseInt(id, 10));
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

async function crearComanda(req, res, next) {
  try {
    const comandaData = {
      ...req.body,
      id_tienda: req.user.id_tienda,
      id_usuario_mozo: req.user.id_usuario
    };
    const data = await comandasService.crearComanda(comandaData);
    return ok(res, data, 201);
  } catch (error) {
    next(error);
  }
}

async function entregar(req, res, next) {
  try {
    const { id } = req.params;
    await comandasService.entregarComanda(parseInt(id, 10));
    return ok(res, { message: 'Pedido marcado como entregado' });
  } catch (error) {
    next(error);
  }
}

async function preCuenta(req, res, next) {
  try {
    const { id } = req.params;
    await comandasService.preCuentaComanda(parseInt(id, 10));
    return ok(res, { message: 'Pre-cuenta generada correctamente' });
  } catch (error) {
    next(error);
  }
}

async function cerrar(req, res, next) {
  try {
    const { id } = req.params;
    await comandasService.cerrarComanda(parseInt(id, 10));
    return ok(res, { message: 'Comanda pagada y cerrada correctamente' });
  } catch (error) {
    next(error);
  }
}

async function reimprimir(req, res, next) {
  try {
    const { id } = req.params;
    const data = await comandasService.reimprimirComanda(parseInt(id, 10));
    return ok(res, { message: 'Reimpresión registrada en cocina', ticket: data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getComandas,
  getComandasCocina,
  getComanda,
  crearComanda,
  entregar,
  preCuenta,
  cerrar,
  reimprimir
};
