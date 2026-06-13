const { check } = require('express-validator');
const validate = require('../middleware/validate');

const createComandaValidator = [
  check('id_mesa')
    .isInt()
    .withMessage('El ID de mesa es obligatorio y debe ser entero'),
  check('items')
    .isArray({ min: 1 })
    .withMessage('La comanda debe incluir al menos un producto'),
  check('items.*.id_producto')
    .isInt()
    .withMessage('El ID de producto en el ítem es obligatorio y debe ser entero'),
  check('items.*.cantidad')
    .isFloat({ min: 0.1 })
    .withMessage('La cantidad del producto debe ser mayor a 0'),
  validate
];

module.exports = {
  createComandaValidator
};
