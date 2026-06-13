const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Rutas
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const mesasRoutes = require('./routes/mesas.routes');
const productosRoutes = require('./routes/productos.routes');
const comandasRoutes = require('./routes/comandas.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const sseRoutes = require('./routes/sse.routes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Montar rutas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/usuarios', usuariosRoutes);
app.use('/api/v1/mesas', mesasRoutes);
app.use('/api/v1/productos', productosRoutes);
app.use('/api/v1/comandas', comandasRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/sse', sseRoutes);

// Ruta de diagnóstico simple
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Manejador de errores global
app.use(errorHandler);

module.exports = app;
