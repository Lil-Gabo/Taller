const supabase = require('../config/supabase');

// Verificar token de Supabase
exports.protegerRuta = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        mensaje: 'No autorizado - Token no proporcionado' 
      });
    }

    // Verificar token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        mensaje: 'Token inválido o expirado' 
      });
    }

    // Obtener datos del usuario de la tabla usuarios
    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', user.email)
      .single();

    if (errorUsuario || !usuario) {
      return res.status(404).json({ 
        success: false, 
        mensaje: 'Usuario no encontrado' 
      });
    }

    req.usuario = usuario;
    req.authUser = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      mensaje: 'Error de autenticación',
      error: error.message 
    });
  }
};

// Verificar que sea administrador
exports.soloAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      mensaje: 'Acceso denegado - Solo administradores' 
    });
  }
  next();
};