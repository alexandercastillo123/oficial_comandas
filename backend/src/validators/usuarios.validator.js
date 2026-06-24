const { check } = require('express-validator');
const validate = require('../middleware/validate');

const createWorkerValidator = [
  check('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre completo es obligatorio'),
  check('usuario')
    .trim()
    .notEmpty()
    .withMessage('El nombre de usuario es obligatorio')
    .isLength({ min: 4 })
    .withMessage('El nombre de usuario debe tener al menos 4 caracteres'),
  check('clave')
    .notEmpty()
    .withMessage('La clave es obligatoria')
    .isLength({ min: 6 })
    .withMessage('La clave debe tener al menos 6 caracteres'),
  check('id_cargo')
    .isInt()
    .withMessage('El ID de cargo es obligatorio y debe ser un entero'),
  check('hora_entrada')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Hora entrada inválida (HH:MM)'),
  check('hora_salida')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Hora salida inválida (HH:MM)'),
  check('tolerancia_min')
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage('Tolerancia debe ser entre 0 y 120 minutos'),
  validate
];

const updateWorkerValidator = [
  check('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre completo es obligatorio'),
  check('id_cargo')
    .isInt()
    .withMessage('El ID de cargo es obligatorio y debe ser un entero'),
  check('clave')
    .optional({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('La nueva clave debe tener al menos 6 caracteres'),
  validate
];

const updateProfileValidator = [
  check('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre completo es obligatorio'),
  check('clave')
    .optional({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('La nueva clave debe tener al menos 6 caracteres'),
  validate
];

const updateClaveValidator = [
  check('clave')
    .notEmpty()
    .withMessage('La nueva clave es obligatoria')
    .isLength({ min: 6 })
    .withMessage('La clave debe tener al menos 6 caracteres'),
  validate
];

module.exports = {
  createWorkerValidator,
  updateWorkerValidator,
  updateProfileValidator,
  updateClaveValidator
};
