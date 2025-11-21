const supabase = require('../config/supabase');

// Registro de usuario
exports.registrar = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          rol: rol || 'mecanico'
        },
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/confirm`
      }
    });

    if (authError) {
      return res.status(400).json({ 
        success: false, 
        mensaje: authError.message 
      });
    }

    if (!authData.user) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'No se pudo crear el usuario en Supabase Auth' 
      });
    }

    // 2. Crear perfil en tabla usuarios
    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .insert([
        { 
          id: authData.user.id,
          nombre, 
          email, 
          rol: rol || 'mecanico'
        }
      ])
      .select()
      .single();

    if (errorUsuario) {
      return res.status(500).json({ 
        success: false, 
        mensaje: 'Error al crear perfil de usuario',
        error: errorUsuario.message 
      });
    }

    // Verificar si el email requiere confirmación
    const requiresConfirmation = !authData.session;

    res.status(201).json({
      success: true,
      mensaje: requiresConfirmation 
        ? 'Usuario registrado. Por favor verifica tu email para activar la cuenta.' 
        : 'Usuario registrado exitosamente',
      data: {
        usuario,
        session: authData.session,
        requiresEmailConfirmation: requiresConfirmation
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al registrar usuario', 
      error: error.message 
    });
  }
};

// NUEVO: Reenviar email de confirmación
exports.reenviarConfirmacion = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'Email es requerido' 
      });
    }

    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/confirm`
      }
    });

    if (error) {
      return res.status(400).json({ 
        success: false, 
        mensaje: error.message 
      });
    }

    res.json({
      success: true,
      mensaje: 'Email de confirmación reenviado'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al reenviar email', 
      error: error.message 
    });
  }
};

// NUEVO: Verificar token de email
exports.verificarEmail = async (req, res) => {
  try {
    const { token_hash, type } = req.query;

    if (!token_hash || type !== 'email') {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'Token inválido' 
      });
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email'
    });

    if (error) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'Error al verificar email',
        error: error.message 
      });
    }

    res.json({
      success: true,
      mensaje: 'Email verificado exitosamente',
      data: {
        session: data.session
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al verificar email', 
      error: error.message 
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'Email y contraseña son obligatorios' 
      });
    }

    // Login con Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ 
        success: false, 
        mensaje: 'Credenciales inválidas',
        error: error.message 
      });
    }

    // Obtener datos del usuario
    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    res.json({
      success: true,
      mensaje: 'Login exitoso',
      data: {
        usuario,
        session: data.session
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al iniciar sesión', 
      error: error.message 
    });
  }
};

// Obtener perfil
exports.obtenerPerfil = async (req, res) => {
  res.json({
    success: true,
    data: req.usuario
  });
};

// Logout
exports.logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(500).json({ 
        success: false, 
        mensaje: 'Error al cerrar sesión',
        error: error.message 
      });
    }

    res.json({
      success: true,
      mensaje: 'Logout exitoso'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al cerrar sesión', 
      error: error.message 
    });
  }
};