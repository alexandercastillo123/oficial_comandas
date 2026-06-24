const { validationResult } = require('express-validator');
const Joi = require('joi');

function validate(schemaOrReq, res, next) {
  // Case 1: Called as a middleware directly: validate(req, res, next)
  if (res && typeof next === 'function') {
    const req = schemaOrReq;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const message = errors.array()[0].msg;
      return res.status(422).json({ error: { message } });
    }
    return next();
  }

  // Case 2: Called as a schema validator generator: validate(schema)
  const schema = schemaOrReq;
  return (req, res, next) => {
    try {
      const source = (req.method === 'GET' || req.method === 'DELETE') ? req.query : req.body;
      const { error } = schema.validate(source);
      if (error) {
        const message = error.details && error.details[0] ? error.details[0].message : 'Error de validación';
        return res.status(422).json({ error: { message } });
      }
      next();
    } catch (err) {
      return res.status(500).json({ error: { message: 'Error validando datos' } });
    }
  };
}

module.exports = validate;
