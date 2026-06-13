const { check } = require('express-validator');
const validate = require('../middleware/validate');

const loginValidator = [
  check('usuario')
    .trim()
    .notEmpty()
    .withMessage('El nombre de usuario es obligatorio'),
  check('clave')
    .notEmpty()
    .withMessage('La contraseña es obligatoria'),
  validate
];

module.exports = {
  loginValidator
};
