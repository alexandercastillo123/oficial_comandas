const express = require('express');
const router = express.Router();
const comandasController = require('../controllers/comandas.controller');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const { createComandaValidator } = require('../validators/comandas.validator');

router.get('/', verifyToken, requireRole(['ADMIN', 'MOZO']), comandasController.getComandas);
router.get('/cocina', verifyToken, requireRole(['ADMIN', 'MOZO', 'CHEF']), comandasController.getComandasCocina);
router.post('/', verifyToken, requireRole('MOZO'), createComandaValidator, comandasController.crearComanda);
router.get('/:id', verifyToken, requireRole(['ADMIN', 'MOZO']), comandasController.getComanda);
router.patch('/:id/entregar', verifyToken, requireRole('MOZO'), comandasController.entregar);
router.patch('/:id/pre-cuenta', verifyToken, requireRole('MOZO'), comandasController.preCuenta);
router.patch('/:id/cerrar', verifyToken, requireRole(['ADMIN', 'MOZO']), comandasController.cerrar);
router.post('/:id/reimprimir', verifyToken, requireRole('MOZO'), comandasController.reimprimir);

module.exports = router;
