const supabase = require('../config/supabase');

// Obtener todos los mecánicos
exports.obtenerMecanicos = async (req, res) => {
  try {
    const { data: mecanicos, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('rol', 'mecanico')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ 
        success: false, 
        mensaje: 'Error al obtener mecánicos',
        error: error.message 
      });
    }

    res.json({
      success: true,
      cantidad: mecanicos.length,
      data: mecanicos
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al obtener mecánicos', 
      error: error.message 
    });
  }
};

// Crear nuevo mecánico
exports.crearMecanico = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Verificar si el email ya existe
    const { data: usuarioExiste } = await supabase
      .from('usuarios')
      .select('email')
      .eq('email', email)
      .single();

    if (usuarioExiste) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'El email ya está registrado' 
      });
    }

    // 1. Crear usuario en Supabase Auth usando Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: { 
        nombre, 
        rol: 'mecanico' 
      }
    });

    if (authError) {
      return res.status(400).json({ 
        success: false, 
        mensaje: authError.message 
      });
    }

    // 2. Crear perfil en tabla usuarios
    const { data: mecanico, error: errorMecanico } = await supabase
      .from('usuarios')
      .insert([
        { 
          id: authData.user.id,
          nombre, 
          email, 
          rol: 'mecanico'
        }
      ])
      .select()
      .single();

    if (errorMecanico) {
      // Si falla, eliminar el usuario de Auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return res.status(500).json({ 
        success: false, 
        mensaje: 'Error al crear perfil de mecánico',
        error: errorMecanico.message 
      });
    }

    res.status(201).json({
      success: true,
      mensaje: 'Mecánico creado exitosamente. Credenciales: ' + email,
      data: mecanico
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al crear mecánico', 
      error: error.message 
    });
  }
};

// Obtener un mecánico por ID
exports.obtenerMecanicoPorId = async (req, res) => {
  try {
    const { data: mecanico, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', req.params.id)
      .eq('rol', 'mecanico')
      .single();

    if (error || !mecanico) {
      return res.status(404).json({ 
        success: false, 
        mensaje: 'Mecánico no encontrado' 
      });
    }

    res.json({
      success: true,
      data: mecanico
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al obtener mecánico', 
      error: error.message 
    });
  }
};