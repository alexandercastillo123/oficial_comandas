const productosService = require('../services/productos.service');
const { ok } = require('../utils/response');

async function getProductos(req, res, next) {
  try {
    const { categoria, buscar, page, limit } = req.query;
    const data = await productosService.getProductos({
      categoryId: categoria ? parseInt(categoria, 10) : undefined,
      search: buscar,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10
    });
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

async function getProducto(req, res, next) {
  try {
    const { id } = req.params;
    const data = await productosService.getProducto(parseInt(id, 10));
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

async function getCategorias(req, res, next) {
  try {
    const data = await productosService.getCategorias();
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProductos,
  getProducto,
  getCategorias
};
