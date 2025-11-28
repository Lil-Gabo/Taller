const { body, param, query, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Validaciones comunes
const loginValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('El usuario es requerido')
    .isLength({ min: 3 }).withMessage('Usuario debe tener al menos 3 caracteres'),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres')
];

const createMechanicValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('El usuario es requerido')
    .isLength({ min: 3, max: 50 }).withMessage('Usuario entre 3 y 50 caracteres'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email inválido'),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
  body('full_name')
    .trim()
    .notEmpty().withMessage('El nombre completo es requerido')
    .isLength({ min: 3, max: 100 }).withMessage('Nombre entre 3 y 100 caracteres'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Teléfono máximo 20 caracteres'),
  body('specialty')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Especialidad máximo 100 caracteres')
];

const createJobValidation = [
  body('mechanic_id')
    .notEmpty().withMessage('El ID del mecánico es requerido')
    .isUUID().withMessage('ID del mecánico inválido'),
  body('description')
    .trim()
    .notEmpty().withMessage('La descripción es requerida')
    .isLength({ min: 5 }).withMessage('Descripción debe tener al menos 5 caracteres'),
  body('amount')
    .notEmpty().withMessage('El monto es requerido')
    .isFloat({ min: 0 }).withMessage('El monto debe ser un número positivo'),
  body('job_date')
    .optional()
    .isISO8601().withMessage('Fecha inválida'),
  body('vehicle_info')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Información del vehículo máximo 200 caracteres')
];

const uuidValidation = [
  param('id').isUUID().withMessage('ID inválido')
];

module.exports = {
  validateRequest,
  loginValidation,
  createMechanicValidation,
  createJobValidation,
  uuidValidation
};