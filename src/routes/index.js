const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const mechanicRoutes = require('./mechanics.routes');
const jobRoutes = require('./jobs.routes');
const reportRoutes = require('./reports.routes');

// Montar rutas
router.use('/auth', authRoutes);
router.use('/mechanics', mechanicRoutes);
router.use('/jobs', jobRoutes);
router.use('/reports', reportRoutes);

// Ruta de health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;