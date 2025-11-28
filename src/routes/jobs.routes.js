const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { isAdmin, isSelfOrAdmin } = require('../middlewares/role.middleware');
const { createJobValidation, uuidValidation, validateRequest } = require('../utils/validators.util');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas solo para admin
router.get('/', isAdmin, jobController.getAllJobs);
router.post('/', isAdmin, createJobValidation, validateRequest, jobController.createJob);
router.put('/:id', isAdmin, uuidValidation, validateRequest, jobController.updateJob);
router.patch('/:id/status', isAdmin, uuidValidation, validateRequest, jobController.updateJobStatus);
router.delete('/:id', isAdmin, uuidValidation, validateRequest, jobController.deleteJob);
router.get('/daily-summary', isAdmin, jobController.getDailySummary);

// Rutas accesibles por admin o el propio mecánico
router.get('/mechanic/:mechanicId', isSelfOrAdmin, jobController.getJobsByMechanic);
router.get('/:id', authMiddleware, uuidValidation, validateRequest, jobController.getJobById);

module.exports = router;