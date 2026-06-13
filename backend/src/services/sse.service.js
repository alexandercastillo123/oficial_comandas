const clients = new Map(); // Map<tiendaId, Set<res>>

function addClient(tiendaId, res) {
  const tId = parseInt(tiendaId, 10);
  if (!clients.has(tId)) {
    clients.set(tId, new Set());
  }
  clients.get(tId).add(res);
  console.log(`[SSE] Nuevo chef conectado para tienda ${tId}. Conexiones totales: ${clients.get(tId).size}`);
}

function removeClient(tiendaId, res) {
  const tId = parseInt(tiendaId, 10);
  if (clients.has(tId)) {
    clients.get(tId).delete(res);
    console.log(`[SSE] Chef desconectado de tienda ${tId}. Conexiones restantes: ${clients.get(tId).size}`);
    if (clients.get(tId).size === 0) {
      clients.delete(tId);
    }
  }
}

function broadcast(tiendaId, eventType, data = {}) {
  const tId = parseInt(tiendaId, 10);
  if (clients.has(tId)) {
    const clientsSet = clients.get(tId);
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    
    clientsSet.forEach(res => {
      res.write(payload);
    });
    console.log(`[SSE] Evento "${eventType}" transmitido a ${clientsSet.size} clientes de tienda ${tId}`);
  }
}

module.exports = {
  addClient,
  removeClient,
  broadcast
};
