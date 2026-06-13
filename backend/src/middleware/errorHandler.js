const { fail } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error('Error no controlado en la aplicación:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Ocurrió un error inesperado en el servidor';
  
  return fail(res, message, status);
}

module.exports = errorHandler;
