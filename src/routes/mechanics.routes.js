const express = require('express');
const router = express.Router();
const mechanicController = require('../controllers/mechanic.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { isAdmin, isSelfOrAdmin } = require('../middlewares/role.middleware');
const { createMechanicValidation, uuidValidation, validateRequest } = require('../utils/validators.util');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas solo para admin
router.get('/', isAdmin, mechanicController.getAllMechanics);
router.post('/', isAdmin, createMechanicValidation, validateRequest, mechanicController.createMechanic);
router.put('/:id', isAdmin, uuidValidation, validateRequest, mechanicController.updateMechanic);
router.delete('/:id', isAdmin, uuidValidation, validateRequest, mechanicController.deleteMechanic);

// Rutas accesibles por admin o el propio mecánico
router.get('/:id', isSelfOrAdmin, uuidValidation, validateRequest, mechanicController.getMechanicById);
router.get('/:id/stats', isSelfOrAdmin, uuidValidation, validateRequest, mechanicController.getMechanicStats);

module.exports = router;