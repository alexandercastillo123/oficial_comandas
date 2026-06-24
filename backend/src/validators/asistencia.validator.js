const Joi = require('joi');

const generarQrSchema = Joi.object({
  tipo: Joi.string().valid('ENTRADA', 'SALIDA').required()
});

const validarQrSchema = Joi.object({
  token: Joi.string().required()
});

const registrarAsistenciaSchema = Joi.object({
  tipo: Joi.string().valid('ENTRADA', 'SALIDA').required()
});

const asignarTurnoSchema = Joi.object({
  id_usuario: Joi.number().integer().required(),
  id_tienda: Joi.number().integer().required(),
  hora_entrada: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/).required(),
  hora_salida: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/).required(),
  tolerancia_min: Joi.number().integer().min(0).max(120).default(15),
  usuario_creacion: Joi.number().integer().allow(null)
});

const listarAsistenciasSchema = Joi.object({
  fechaDesde: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  fechaHasta: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  idUsuario: Joi.number().integer().optional(),
  idTienda: Joi.number().integer().optional()
});

module.exports = {
  generarQrSchema,
  validarQrSchema,
  registrarAsistenciaSchema,
  asignarTurnoSchema,
  listarAsistenciasSchema
};
