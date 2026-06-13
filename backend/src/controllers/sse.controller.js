const sseService = require('../services/sse.service');

function handleCocinaStream(req, res) {
  const tiendaId = req.user.id_tienda;

  // Cabeceras obligatorias para Server-Sent Events (SSE)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Mantener la conexión enviando un ping inicial
  res.write(`data: ${JSON.stringify({ connected: true, tiendaId })}\n\n`);

  // Agregar al pool de clientes
  sseService.addClient(tiendaId, res);

  // Limpieza al cerrar la conexión
  req.on('close', () => {
    sseService.removeClient(tiendaId, res);
  });
}

module.exports = {
  handleCocinaStream
};
