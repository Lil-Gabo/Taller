const express = require('express');
const router = express.Router();
const { registrar, login, obtenerPerfil, logout } = require('../controllers/authController');
const { protegerRuta } = require('../middleware/auth');

router.post('/register', registrar);
router.post('/login', login);
router.get('/perfil', protegerRuta, obtenerPerfil);
router.post('/logout', protegerRuta, logout);

module.exports = router;