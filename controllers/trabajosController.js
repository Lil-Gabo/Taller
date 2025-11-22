const { supabase } = require('../config/supabase');

// Crear nuevo trabajo
exports.crearTrabajo = async (req, res) => {
  try {
    const { mecanicoId, tipoTrabajo, descripcion, precioServicio, fecha } = req.body;

    // Verificar que el mecánico existe
    const { data: mecanico, error: errorMecanico } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', mecanicoId)
      .eq('rol', 'mecanico')
      .single();

    if (errorMecanico || !mecanico) {
      return res.status(404).json({ 
        success: false, 
        mensaje: 'Mecánico no encontrado' 
      });
    }

    // Crear trabajo
    const { data: trabajo, error } = await supabase
      .from('trabajos')
      .insert([
        {
          mecanico_id: mecanicoId,
          tipo_trabajo: tipoTrabajo,
          descripcion: descripcion || null,
          precio_servicio: precioServicio,
          fecha: fecha || new Date().toISOString()
        }
      ])
      .select(`
        *,
        mecanico:usuarios!mecanico_id(id, nombre, email)
      `)
      .single();

    if (error) {
      return res.status(500).json({ 
        success: false, 
        mensaje: 'Error al crear trabajo',
        error: error.message 
      });
    }

    res.status(201).json({
      success: true,
      mensaje: 'Trabajo registrado exitosamente',
      data: trabajo
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al crear trabajo', 
      error: error.message 
    });
  }
};

// Obtener todos los trabajos
exports.obtenerTodosTrabajos = async (req, res) => {
  try {
    const { data: trabajos, error } = await supabase
      .from('trabajos')
      .select(`
        *,
        mecanico:usuarios!mecanico_id(id, nombre, email)
      `)
      .order('fecha', { ascending: false });

    if (error) {
      return res.status(500).json({ 
        success: false, 
        mensaje: 'Error al obtener trabajos',
        error: error.message 
      });
    }

    res.json({
      success: true,
      cantidad: trabajos.length,
      data: trabajos
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al obtener trabajos', 
      error: error.message 
    });
  }
};

// Obtener trabajos de un mecánico específico
exports.obtenerTrabajosPorMecanico = async (req, res) => {
  try {
    const { mecanicoId } = req.params;

    const { data: trabajos, error } = await supabase
      .from('trabajos')
      .select(`
        *,
        mecanico:usuarios!mecanico_id(id, nombre, email)
      `)
      .eq('mecanico_id', mecanicoId)
      .order('fecha', { ascending: false });

    if (error) {
      return res.status(500).json({ 
        success: false, 
        mensaje: 'Error al obtener trabajos',
        error: error.message 
      });
    }

    // Calcular estadísticas
    const totalTrabajos = trabajos.length;
    const totalGanancias = trabajos.reduce((sum, t) => sum + parseFloat(t.precio_servicio), 0);

    res.json({
      success: true,
      data: {
        trabajos,
        estadisticas: {
          totalTrabajos,
          totalGanancias
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al obtener trabajos del mecánico', 
      error: error.message 
    });
  }
};

// Obtener trabajos del mecánico actual
exports.obtenerMisTrabajos = async (req, res) => {
  try {
    const { data: trabajos, error } = await supabase
      .from('trabajos')
      .select('*')
      .eq('mecanico_id', req.usuario.id)
      .order('fecha', { ascending: false });

    if (error) {
      return res.status(500).json({ 
        success: false, 
        mensaje: 'Error al obtener trabajos',
        error: error.message 
      });
    }

    const totalTrabajos = trabajos.length;
    const totalGanancias = trabajos.reduce((sum, t) => sum + parseFloat(t.precio_servicio), 0);

    res.json({
      success: true,
      data: {
        trabajos,
        estadisticas: {
          totalTrabajos,
          totalGanancias
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al obtener tus trabajos', 
      error: error.message 
    });
  }
};