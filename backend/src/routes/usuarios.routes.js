const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const {
  createWorkerValidator,
  updateWorkerValidator,
  updateProfileValidator,
  updateClaveValidator
} = require('../validators/usuarios.validator');

// Admin roles endpoints
router.get('/', verifyToken, requireRole('ADMIN'), usuariosController.getTrabajadores);
router.get('/:id', verifyToken, requireRole('ADMIN'), usuariosController.getTrabajador);
router.post('/', verifyToken, requireRole('ADMIN'), createWorkerValidator, usuariosController.crearTrabajador);
router.put('/:id', verifyToken, requireRole('ADMIN'), updateWorkerValidator, usuariosController.editarTrabajador);
router.patch('/:id/estado', verifyToken, requireRole('ADMIN'), usuariosController.cambiarEstado);
router.delete('/:id', verifyToken, requireRole('ADMIN'), usuariosController.eliminarTrabajador);

// Self profile actions (Any logged user)
router.put('/:id/perfil', verifyToken, updateProfileValidator, usuariosController.editarPerfil);
router.put('/:id/clave', verifyToken, updateClaveValidator, usuariosController.cambiarClave);

module.exports = router;
