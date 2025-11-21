const express = require('express');
const router = express.Router();
const { 
  crearTrabajo, 
  obtenerTodosTrabajos, 
  obtenerTrabajosPorMecanico,
  obtenerMisTrabajos 
} = require('../controllers/trabajosController');
const { protegerRuta, soloAdmin } = require('../middleware/auth');

router.use(protegerRuta);

router.post('/', soloAdmin, crearTrabajo);
router.get('/', soloAdmin, obtenerTodosTrabajos);
router.get('/mecanico/:mecanicoId', soloAdmin, obtenerTrabajosPorMecanico);
router.get('/mis-trabajos', obtenerMisTrabajos);

module.exports = router;