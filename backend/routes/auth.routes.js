// backend/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Laluan API untuk login dan logout
router.post('/login', authController.login);
router.post('/logout', authController.logout);

module.exports = router;