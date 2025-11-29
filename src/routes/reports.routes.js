const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { isAdmin, isSelfOrAdmin } = require('../middlewares/role.middleware');
const { uuidValidation, validateRequest } = require('../utils/validators.util');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas solo para admin

router.get('/weekly', reportController.getWeeklySummary.bind(reportController));
router.post('/weekly/close/:mechanicId', isAdmin, uuidValidation, validateRequest, reportController.closeWeek);
router.patch('/payments/:paymentId/mark-paid', isAdmin, reportController.markAsPaid);
// Rutas accesibles por admin o el propio mecánico
router.get('/weekly/mechanic/:mechanicId', isSelfOrAdmin, uuidValidation, validateRequest, reportController.getMechanicWeeklySummary);
router.get('/payments/mechanic/:mechanicId', isSelfOrAdmin, uuidValidation, validateRequest, reportController.getPaymentHistory);

module.exports = router;