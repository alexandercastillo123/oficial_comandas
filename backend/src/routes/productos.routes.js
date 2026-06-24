const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole(['ADMIN', 'MOZO']), productosController.getProductos);
router.get('/categorias', verifyToken, requireRole(['ADMIN', 'MOZO']), productosController.getCategorias);
router.get('/:id', verifyToken, requireRole(['ADMIN', 'MOZO']), productosController.getProducto);

module.exports = router;
