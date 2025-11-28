const { verifyToken } = require('../utils/jwt.util');

const authMiddleware = (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar token
    const decoded = verifyToken(token);
    
    // Agregar datos del usuario al request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role, // 'admin' o 'mechanic'
      email: decoded.email
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      error: error.message
    });
  }
};

module.exports = authMiddleware;
