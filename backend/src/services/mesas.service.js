const mesasRepo = require('../repositories/mesas.repo');

async function getMesas(tiendaId, rolApp) {
  const mesas = rolApp === 'ADMIN'
    ? await mesasRepo.listByTienda(tiendaId)
    : await mesasRepo.listByTiendaActivas(tiendaId);
  
  return mesas.map((mesa) => {
    const comandas_activas = Number(mesa.comandas_activas || 0);
    if (comandas_activas === 0) {
      return { ...mesa, estado_mesa: 'LIBRE' };
    }
    if (mesa.estado_mesa === 'PRE_CUENTA' && comandas_activas > 0) {
      return { ...mesa, estado_mesa: 'PRE_CUENTA' };
    }
    return { ...mesa, estado_mesa: 'OCUPADA' };
  });
}

async function getMesa(id) {
  const mesa = await mesasRepo.getById(id);
  if (!mesa) throw new Error('Mesa no encontrada');
  const activeCount = await mesasRepo.getActiveComandasCount(id);
  const comandas_activas = Number(activeCount || 0);
  if (comandas_activas === 0) {
    return { ...mesa, estado_mesa: 'LIBRE' };
  }
  if (mesa.estado_mesa === 'PRE_CUENTA' && comandas_activas > 0) {
    return { ...mesa, estado_mesa: 'PRE_CUENTA' };
  }
  return { ...mesa, estado_mesa: 'OCUPADA' };
}

async function crearMesa(mesaData) {
  return await mesasRepo.create(mesaData);
}

async function editarMesa(id, mesaData) {
  await mesasRepo.update(id, mesaData);
}

async function eliminarMesa(id) {
  const mesa = await mesasRepo.getById(id);
  if (!mesa) throw new Error('La mesa no existe');

  const activeCount = await mesasRepo.getActiveComandasCount(id);
  if (activeCount > 0) {
    throw new Error(`No se puede eliminar la mesa "${mesa.numero}" porque tiene ${activeCount} ticket(s) pendiente(s). Cierra o elimina los tickets primero.`);
  }

  const success = await mesasRepo.deleteMesa(id);
  if (!success) {
    throw new Error('No se pudo eliminar la mesa. Por favor, intenta nuevamente.');
  }
}

async function actualizarEstadoMesa(id, estadoMesa) {
  await mesasRepo.updateEstado(id, estadoMesa);
}

async function toggleActivoMesa(id, nuevoEstado) {
  await mesasRepo.toggleActivo(id, nuevoEstado);
}

module.exports = {
  getMesas,
  getMesa,
  crearMesa,
  editarMesa,
  eliminarMesa,
  actualizarEstadoMesa
};
