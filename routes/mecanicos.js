const express = require('express');
const router = express.Router();
const { 
  obtenerMecanicos, 
  crearMecanico, 
  obtenerMecanicoPorId 
} = require('../controllers/mecanicosController');
const { protegerRuta, soloAdmin } = require('../middlewares/auth');

router.use(protegerRuta);
router.use(soloAdmin);

router.get('/', obtenerMecanicos);
router.post('/', crearMecanico);
router.get('/:id', obtenerMecanicoPorId);

module.exports = router;