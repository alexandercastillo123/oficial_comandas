const express = require('express');
const router = express.Router();
const mesasController = require('../controllers/mesas.controller');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  createMesaValidator,
  updateMesaValidator,
  updateEstadoMesaValidator
} = require('../validators/mesas.validator');

router.get('/', verifyToken, requireRole(['ADMIN', 'MOZO']), mesasController.getMesas);
router.get('/:id', verifyToken, requireRole(['ADMIN', 'MOZO']), mesasController.getMesa);
router.post('/', verifyToken, requireRole('ADMIN'), createMesaValidator, mesasController.crearMesa);
router.put('/:id', verifyToken, requireRole('ADMIN'), updateMesaValidator, mesasController.editarMesa);
router.delete('/:id', verifyToken, requireRole('ADMIN'), mesasController.eliminarMesa);
router.patch('/:id/estado', verifyToken, requireRole('MOZO'), updateEstadoMesaValidator, mesasController.cambiarEstado);
router.patch('/:id/toggle-activo', verifyToken, requireRole('ADMIN'), mesasController.toggleActivo);

module.exports = router;
