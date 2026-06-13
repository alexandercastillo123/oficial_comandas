const { check } = require('express-validator');
const validate = require('../middleware/validate');

const createMesaValidator = [
  check('numero')
    .trim()
    .notEmpty()
    .withMessage('El número de mesa es obligatorio'),
  check('capacidad')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La capacidad debe ser un número entero mayor a 0'),
  validate
];

const updateMesaValidator = [
  check('numero')
    .trim()
    .notEmpty()
    .withMessage('El número de mesa es obligatorio'),
  check('capacidad')
    .isInt({ min: 1 })
    .withMessage('La capacidad debe ser un número entero mayor a 0'),
  validate
];

const updateEstadoMesaValidator = [
  check('estado_mesa')
    .isIn(['LIBRE', 'OCUPADA', 'PRE_CUENTA'])
    .withMessage('Estado de mesa inválido (debe ser LIBRE, OCUPADA o PRE_CUENTA)'),
  validate
];

module.exports = {
  createMesaValidator,
  updateMesaValidator,
  updateEstadoMesaValidator
};
