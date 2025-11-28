// Middleware para verificar que el usuario sea admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de administrador'
    });
  }

  next();
};

// Middleware para verificar que el usuario sea mecánico
const isMechanic = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (req.user.role !== 'mechanic') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de mecánico'
    });
  }

  next();
};

// Middleware para verificar que el mecánico solo acceda a sus propios datos
const isSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  const requestedId = req.params.id || req.params.mechanicId;

  // Si es admin, permitir acceso
  if (req.user.role === 'admin') {
    return next();
  }

  // Si es mecánico, solo permitir acceso a sus propios datos
  if (req.user.role === 'mechanic' && req.user.id === requestedId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Acceso denegado. No tienes permiso para acceder a estos datos'
  });
};

module.exports = {
  isAdmin,
  isMechanic,
  isSelfOrAdmin
};