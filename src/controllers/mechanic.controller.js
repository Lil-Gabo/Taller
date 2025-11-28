const { supabase } = require('../config/database');
const { hashPassword } = require('../utils/password.util');

class MechanicController {

  // Obtener todos los mecánicos (solo admin)
  async getAllMechanics(req, res) {
    try {
      const { status } = req.query;

      let query = supabase
        .from('mechanics')
        .select('id, username, email, full_name, phone, specialty, hire_date, status, created_at')
        .order('created_at', { ascending: false });

      // Filtrar por estado si se proporciona
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        message: 'Mecánicos obtenidos exitosamente',
        data: {
          mechanics: data,
          total: data.length
        }
      });

    } catch (error) {
      console.error('Error en getAllMechanics:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener mecánicos',
        error: error.message
      });
    }
  }

  // Obtener mecánico por ID
  async getMechanicById(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('mechanics')
        .select('id, username, email, full_name, phone, specialty, hire_date, status, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          message: 'Mecánico no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Mecánico obtenido exitosamente',
        data: { mechanic: data }
      });

    } catch (error) {
      console.error('Error en getMechanicById:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener mecánico',
        error: error.message
      });
    }
  }

  // Crear nuevo mecánico (solo admin)
  async createMechanic(req, res) {
    try {
      const { username, email, password, full_name, phone, specialty } = req.body;

      // Verificar si el username ya existe
      const { data: existingUsername } = await supabase
        .from('mechanics')
        .select('id')
        .eq('username', username)
        .single();

      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: 'El nombre de usuario ya está en uso'
        });
      }

      // Verificar si el email ya existe
      const { data: existingEmail } = await supabase
        .from('mechanics')
        .select('id')
        .eq('email', email)
        .single();

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }

      // Hashear contraseña
      const passwordHash = await hashPassword(password);

      // Crear mecánico
      const { data, error } = await supabase
        .from('mechanics')
        .insert([{
          username,
          email,
          password_hash: passwordHash,
          full_name,
          phone: phone || null,
          specialty: specialty || null,
          status: 'active'
        }])
        .select('id, username, email, full_name, phone, specialty, hire_date, status')
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Mecánico creado exitosamente',
        data: { mechanic: data }
      });

    } catch (error) {
      console.error('Error en createMechanic:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear mecánico',
        error: error.message
      });
    }
  }

  // Actualizar mecánico (solo admin)
  async updateMechanic(req, res) {
    try {
      const { id } = req.params;
      const { email, full_name, phone, specialty, status } = req.body;

      // Construir objeto de actualización solo con campos proporcionados
      const updateData = {};
      if (email !== undefined) updateData.email = email;
      if (full_name !== undefined) updateData.full_name = full_name;
      if (phone !== undefined) updateData.phone = phone;
      if (specialty !== undefined) updateData.specialty = specialty;
      if (status !== undefined) updateData.status = status;

      // Si se proporciona email, verificar que no esté en uso
      if (email) {
        const { data: existingEmail } = await supabase
          .from('mechanics')
          .select('id')
          .eq('email', email)
          .neq('id', id)
          .single();

        if (existingEmail) {
          return res.status(409).json({
            success: false,
            message: 'El email ya está en uso por otro mecánico'
          });
        }
      }

      // Actualizar mecánico
      const { data, error } = await supabase
        .from('mechanics')
        .update(updateData)
        .eq('id', id)
        .select('id, username, email, full_name, phone, specialty, hire_date, status')
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          message: 'Mecánico no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Mecánico actualizado exitosamente',
        data: { mechanic: data }
      });

    } catch (error) {
      console.error('Error en updateMechanic:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar mecánico',
        error: error.message
      });
    }
  }

  // Eliminar mecánico (solo admin)
  async deleteMechanic(req, res) {
    try {
      const { id } = req.params;

      // Verificar si el mecánico tiene trabajos asociados
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('mechanic_id', id)
        .limit(1);

      if (jobs && jobs.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'No se puede eliminar el mecánico porque tiene trabajos registrados. Considera cambiar su estado a inactivo.'
        });
      }

      // Eliminar mecánico
      const { error } = await supabase
        .from('mechanics')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Mecánico eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error en deleteMechanic:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar mecánico',
        error: error.message
      });
    }
  }

  // Obtener estadísticas de un mecánico
  async getMechanicStats(req, res) {
    try {
      const { id } = req.params;

      // Verificar que el mecánico existe
      const { data: mechanic, error: mechanicError } = await supabase
        .from('mechanics')
        .select('id, full_name')
        .eq('id', id)
        .single();

      if (mechanicError || !mechanic) {
        return res.status(404).json({
          success: false,
          message: 'Mecánico no encontrado'
        });
      }

      // Obtener todos los trabajos del mecánico
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, amount, status, job_date')
        .eq('mechanic_id', id);

      if (jobsError) throw jobsError;

      // Calcular estadísticas
      const totalJobs = jobs.length;
      const totalAmount = jobs.reduce((sum, job) => sum + parseFloat(job.amount), 0);
      const pendingJobs = jobs.filter(j => j.status === 'pending').length;
      const completedJobs = jobs.filter(j => j.status === 'completed').length;
      const paidJobs = jobs.filter(j => j.status === 'paid').length;

      res.json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: {
          mechanic: {
            id: mechanic.id,
            full_name: mechanic.full_name
          },
          stats: {
            totalJobs,
            totalAmount: totalAmount.toFixed(2),
            pendingJobs,
            completedJobs,
            paidJobs
          }
        }
      });

    } catch (error) {
      console.error('Error en getMechanicStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }
}

module.exports = new MechanicController();