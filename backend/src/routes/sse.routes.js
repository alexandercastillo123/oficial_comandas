const express = require('express');
const router = express.Router();
const sseController = require('../controllers/sse.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/cocina', verifyToken, requireRole(['MOZO', 'CHEF']), sseController.handleCocinaStream);

module.exports = router;
