const express = require('express');
const router = express.Router();
const sseController = require('../controllers/sse.controller');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roles');

router.get('/cocina', verifyToken, requireRole(['MOZO', 'CHEF']), sseController.handleCocinaStream);

module.exports = router;
