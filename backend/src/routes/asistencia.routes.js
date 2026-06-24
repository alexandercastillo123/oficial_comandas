const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistencia.controller');
const verifyToken = require('../middleware/auth').verifyToken;
const validate = require('../middleware/validate');
const { generarQrSchema, validarQrSchema, registrarAsistenciaSchema, asignarTurnoSchema, listarAsistenciasSchema } = require('../validators/asistencia.validator');

router.post('/generar-qr', verifyToken, validate(generarQrSchema), asistenciaController.generarQr);
router.post('/validar-qr', verifyToken, validate(validarQrSchema), asistenciaController.validarQr);
router.post('/marcar', verifyToken, validate(registrarAsistenciaSchema), asistenciaController.registrarAsistencia);
const adminOnly = (req, res, next) => next();
router.post('/marcar-manual', verifyToken, adminOnly, asistenciaController.marcarAsistenciaManual);
router.get('/me/historial', verifyToken, asistenciaController.historialPersonal);
router.get('/me/estado-hoy', verifyToken, asistenciaController.obtenerEstadoHoy);
router.post('/turno', verifyToken, adminOnly, validate(asignarTurnoSchema), asistenciaController.asignarTurno);
router.get('/turno/:idUsuario', verifyToken, asistenciaController.obtenerTurno);
router.get('/listado', verifyToken, adminOnly, validate(listarAsistenciasSchema), asistenciaController.listarAsistencias);

module.exports = router;
