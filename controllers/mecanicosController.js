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

    console.log('📝 Intentando crear mecánico:', { nombre, email });

    // Verificar si el email ya existe en la tabla usuarios
    const { data: usuarioExiste, error: errorCheck } = await supabase
      .from('usuarios')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (usuarioExiste) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'El email ya está registrado' 
      });
    }

    console.log('✅ Email disponible, creando usuario en Auth...');
    
    // Intentar método 1: admin.createUser
    let authData, authError;
    
    try {
      const result = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { 
          nombre, 
          rol: 'mecanico' 
        }
      });
      
      authData = result.data;
      authError = result.error;
      
    } catch (adminError) {
      console.log('⚠️ admin.createUser falló, intentando método alternativo...');
      console.error('Error:', adminError);
      
      // Método alternativo: usar signUp directo
      const signUpResult = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            nombre, 
            rol: 'mecanico' 
          },
          emailRedirectTo: undefined
        }
      });
      
      authData = signUpResult.data;
      authError = signUpResult.error;
    }

    if (authError) {
      console.error('❌ Error en Auth:', authError);
      return res.status(400).json({ 
        success: false, 
        mensaje: authError.message || 'Error al crear usuario en Supabase Auth',
        detalle: authError
      });
    }

    if (!authData || !authData.user) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'No se pudo crear el usuario. authData.user es null',
        detalle: 'Verifica que Sign-ups esté habilitado en Supabase'
      });
    }

    console.log('✅ Usuario Auth creado con ID:', authData.user.id);
    console.log('📝 Creando perfil en tabla usuarios...');

    // Crear perfil en tabla usuarios
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
      console.error('❌ Error al crear perfil:', errorMecanico);
      
      // Intentar eliminar el usuario de Auth si falla el perfil
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('🗑️ Usuario Auth eliminado por error en perfil');
      } catch (deleteError) {
        console.error('⚠️ No se pudo eliminar usuario Auth:', deleteError);
      }
      
      return res.status(500).json({ 
        success: false, 
        mensaje: 'Error al crear perfil de mecánico en la tabla usuarios',
        error: errorMecanico.message,
        detalle: errorMecanico
      });
    }

    console.log('✅ Mecánico creado exitosamente!');

    res.status(201).json({
      success: true,
      mensaje: `✅ Mecánico creado. Credenciales: ${email} / ${password}`,
      data: mecanico
    });
    
  } catch (error) {
    console.error('❌ Error general:', error);
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al crear mecánico', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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