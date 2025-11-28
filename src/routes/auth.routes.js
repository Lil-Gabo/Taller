const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { loginLimiter } = require('../middlewares/rateLimiter.middleware');
const { loginValidation, validateRequest } = require('../utils/validators.util');

// Rutas públicas (sin autenticación)
router.post('/admin/login', loginLimiter, loginValidation, validateRequest, authController.loginAdmin);
router.post('/mechanic/login', loginLimiter, loginValidation, validateRequest, authController.loginMechanic);

// Rutas protegidas (requieren autenticación)
router.get('/verify', authMiddleware, authController.verifyToken);
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;