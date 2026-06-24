const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('ADMIN'), dashboardController.getStats);

module.exports = router;
