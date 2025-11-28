const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/environment');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');

const app = express();

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));

// Rate limiting
app.use('/api', apiLimiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger (solo en desarrollo)
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Rutas principales
app.use('/api', routes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Gestión de Mecánicos y Pagos',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      mechanics: '/api/mechanics',
      jobs: '/api/jobs',
      reports: '/api/reports',
      health: '/api/health'
    }
  });
});

// Manejo de errores
app.use(notFound);
app.use(errorHandler);

module.exports = app;