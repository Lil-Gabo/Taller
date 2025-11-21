const express = require('express');
const router = express.Router();
const { 
  registrar, 
  login, 
  obtenerPerfil, 
  logout,
  reenviarConfirmacion,
  verificarEmail
} = require('../controllers/authController');
const { protegerRuta } = require('../middleware/auth');

router.post('/register', registrar);
router.post('/login', login);
router.get('/perfil', protegerRuta, obtenerPerfil);
router.post('/logout', protegerRuta, logout);
router.post('/resend-confirmation', reenviarConfirmacion); // ← NUEVO
router.get('/verify-email', verificarEmail); // ← NUEVO

module.exports = router;