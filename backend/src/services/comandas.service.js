const comandasRepo = require('../repositories/comandas.repo');
const mesasRepo = require('../repositories/mesas.repo');
const productosRepo = require('../repositories/productos.repo');
const sseService = require('./sse.service');
const calcTotales = require('../utils/calcTotales');
const pdfGenerator = require('../utils/pdfGenerator');

async function getComandasMesa(mesaId, estado) {
  return await comandasRepo.listByMesa(mesaId, estado);
}

async function getComandasCocina(tiendaId) {
  const list = await comandasRepo.listCocina(tiendaId);
  const result = [];
  for (const item of list) {
    const details = await comandasRepo.getDetailsByCabId(item.id_comanda_cab);
    result.push({
      ...item,
      items: details
    });
  }
  return result;
}

async function getComanda(id) {
  const comanda = await comandasRepo.getById(id);
  if (!comanda) throw new Error('Comanda no encontrada');
  return comanda;
}

async function crearComanda(comandaData) {
  // Para prevenir manipulación de precios desde el cliente, obtenemos los precios oficiales desde la BD
  const enrichedItems = [];
  for (const item of comandaData.items) {
    const product = await productosRepo.getById(item.id_producto);
    if (!product) {
      throw new Error(`Producto con id ${item.id_producto} no encontrado`);
    }
    enrichedItems.push({
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      precio_unitario: product.precio_mesa,
      descuento: item.descuento || 0,
      observacion_item: item.observacion_item
    });
  }

  const totales = calcTotales(enrichedItems);
  const payload = {
    ...comandaData,
    items: enrichedItems
  };

  const cabId = await comandasRepo.createComanda(payload, totales);
  const comandaCreada = await getComanda(cabId);

  // Generar PDF del ticket de cocina
  try {
    await pdfGenerator.generarTicketCocina(comandaCreada);
  } catch (err) {
    console.error('Error generando PDF de cocina:', err);
  }

  // Broadcast por SSE en tiempo real a la cocina
  sseService.broadcast(comandaData.id_tienda, 'nueva_comanda', comandaCreada);

  return comandaCreada;
}

async function entregarComanda(id) {
  const comanda = await getComanda(id);
  await comandasRepo.updateEstado(id, 'ENTREGADO');
  
  // Notificar al chef vía SSE para que remueva de la cola
  sseService.broadcast(comanda.id_tienda, 'comanda_entregada', { id_comanda_cab: id });
}

async function preCuentaComanda(id) {
  const comanda = await getComanda(id);
  await comandasRepo.updateEstado(id, 'PRE_CUENTA');
  await mesasRepo.updateEstado(comanda.id_mesa, 'PRE_CUENTA');

  // Generar PDF de la pre-cuenta
  try {
    await pdfGenerator.generarPreCuenta(comanda);
  } catch (err) {
    console.error('Error generando PDF de pre-cuenta:', err);
  }
}

async function cerrarComanda(id) {
  const comanda = await getComanda(id);
  await comandasRepo.updateEstado(id, 'CERRADO');

  // Si ya no quedan más comandas activas (no cerradas) en esta mesa, liberamos la mesa
  const activeCount = await mesasRepo.getActiveComandasCount(comanda.id_mesa);
  if (activeCount === 0) {
    await mesasRepo.updateEstado(comanda.id_mesa, 'LIBRE');
  }
}

async function reimprimirComanda(id) {
  await comandasRepo.incrementarReimpresion(id);
  const comanda = await getComanda(id);

  // Regenerar PDF del ticket de cocina con indicación de reimpresión
  try {
    await pdfGenerator.generarTicketCocina(comanda);
  } catch (err) {
    console.error('Error al regenerar PDF de cocina por reimpresión:', err);
  }

  return comanda;
}

async function getComandasTienda(tiendaId, estado) {
  return await comandasRepo.listByTienda(tiendaId, estado);
}

module.exports = {
  getComandasMesa,
  getComandasCocina,
  getComanda,
  crearComanda,
  entregarComanda,
  preCuentaComanda,
  cerrarComanda,
  reimprimirComanda,
  getComandasTienda
};
