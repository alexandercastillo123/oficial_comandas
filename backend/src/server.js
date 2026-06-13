require('dotenv').config();
const app = require('./app');
const { getLocalPool, getCloudPool } = require('./config/db');

const PORT = process.env.PORT || 3000;
const ID_TIENDA = parseInt(process.env.ID_TIENDA, 10) || 1;

getLocalPool()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en el puerto ${PORT} (sucursal ${ID_TIENDA})`);
    });

    const startSync = (name, fn) => fn().catch((err) => console.warn(`⚠️ ${name} omitido:`, err?.message || err));

    startSync('downSync', () => require('./services/downSync.service').runDownSync());
    startSync('userSync', () => require('./services/userSync.service').runUserSync());
    startSync('upSync', () => require('./services/upSync.service').runUpSync());

    const gracefulShutdown = () => {
      console.log('Cerrando servidor HTTP...');
      server.close(() => {
        console.log('Servidor HTTP cerrado.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  })
  .catch((err) => {
    console.error('No se pudo iniciar el servidor por error de base de datos local:', err);
    process.exit(1);
  });
