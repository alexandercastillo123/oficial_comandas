const app = require('../src/app');
const http = require('http');

console.log('Iniciando pruebas de humo para endpoints de backend...');

// Levantar servidor temporal para pruebas
const server = http.createServer(app);
const PORT = 3999;

server.listen(PORT, () => {
  console.log(`Servidor de prueba corriendo en el puerto ${PORT}`);

  // Realizar llamada a /health
  http.get(`http://localhost:${PORT}/health`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Respuesta /health:', data);
      const parsed = JSON.parse(data);
      if (parsed.status === 'ok') {
        console.log('Prueba exitosa: /health responde correctamente.');
        server.close(() => {
          process.exit(0);
        });
      } else {
        console.error('Prueba fallida: Respuesta inválida.');
        server.close(() => {
          process.exit(1);
        });
      }
    });
  }).on('error', (err) => {
    console.error('Error realizando GET a /health:', err);
    server.close(() => {
      process.exit(1);
    });
  });
});
