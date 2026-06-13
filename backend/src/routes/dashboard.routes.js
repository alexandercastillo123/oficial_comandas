const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roles');

router.get('/', verifyToken, requireRole('ADMIN'), dashboardController.getStats);

module.exports = router;
