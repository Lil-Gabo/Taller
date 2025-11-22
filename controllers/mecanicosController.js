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

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, rol: 'mecanico' }
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
      return res.status(500).json({ 
        success: false, 
        mensaje: 'Error al crear mecánico',
        error: errorMecanico.message 
      });
    }

    res.status(201).json({
      success: true,
      mensaje: 'Mecánico creado exitosamente',
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