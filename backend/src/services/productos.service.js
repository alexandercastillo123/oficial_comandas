const productosRepo = require('../repositories/productos.repo');

async function getProductos(params) {
  return await productosRepo.list(params);
}

async function getProducto(id) {
  const prod = await productosRepo.getById(id);
  if (!prod) throw new Error('Producto no encontrado');
  return prod;
}

async function getCategorias() {
  return await productosRepo.listCategorias();
}

module.exports = {
  getProductos,
  getProducto,
  getCategorias
};
