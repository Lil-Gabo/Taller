const { supabase } = require('../config/database');

class JobController {

  // Obtener todos los trabajos (con filtros opcionales)
  async getAllJobs(req, res) {
    try {
      const { mechanic_id, status, date_from, date_to, limit = 100, offset = 0 } = req.query;

      let query = supabase
        .from('jobs')
        .select(`
          id,
          mechanic_id,
          job_date,
          description,
          amount,
          status,
          vehicle_info,
          notes,
          created_at,
          mechanics (id, full_name, specialty)
        `)
        .order('job_date', { ascending: false })
        .range(offset, offset + limit - 1);

      // Aplicar filtros
      if (mechanic_id) query = query.eq('mechanic_id', mechanic_id);
      if (status) query = query.eq('status', status);
      if (date_from) query = query.gte('job_date', date_from);
      if (date_to) query = query.lte('job_date', date_to);

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({
        success: true,
        message: 'Trabajos obtenidos exitosamente',
        data: {
          jobs: data,
          total: data.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      console.error('Error en getAllJobs:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener trabajos',
        error: error.message
      });
    }
  }

  // Obtener trabajos de un mecánico específico
  async getJobsByMechanic(req, res) {
    try {
      const { mechanicId } = req.params;
      const { status, date_from, date_to } = req.query;

      let query = supabase
        .from('jobs')
        .select('*')
        .eq('mechanic_id', mechanicId)
        .order('job_date', { ascending: false });

      // Aplicar filtros
      if (status) query = query.eq('status', status);
      if (date_from) query = query.gte('job_date', date_from);
      if (date_to) query = query.lte('job_date', date_to);

      const { data, error } = await query;

      if (error) throw error;

      // Calcular totales
      const totalAmount = data.reduce((sum, job) => sum + parseFloat(job.amount), 0);
      const totalJobs = data.length;

      res.json({
        success: true,
        message: 'Trabajos obtenidos exitosamente',
        data: {
          jobs: data,
          summary: {
            totalJobs,
            totalAmount: totalAmount.toFixed(2),
            byStatus: {
              pending: data.filter(j => j.status === 'pending').length,
              completed: data.filter(j => j.status === 'completed').length,
              paid: data.filter(j => j.status === 'paid').length
            }
          }
        }
      });

    } catch (error) {
      console.error('Error en getJobsByMechanic:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener trabajos del mecánico',
        error: error.message
      });
    }
  }

  // Obtener trabajo por ID
  async getJobById(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          mechanics (id, full_name, specialty)
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          message: 'Trabajo no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Trabajo obtenido exitosamente',
        data: { job: data }
      });

    } catch (error) {
      console.error('Error en getJobById:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener trabajo',
        error: error.message
      });
    }
  }

  // Crear nuevo trabajo (solo admin)
  async createJob(req, res) {
    try {
      const { mechanic_id, description, amount, job_date, vehicle_info, notes, status } = req.body;

      // Verificar que el mecánico existe y está activo
      const { data: mechanic, error: mechanicError } = await supabase
        .from('mechanics')
        .select('id, status')
        .eq('id', mechanic_id)
        .single();

      if (mechanicError || !mechanic) {
        return res.status(404).json({
          success: false,
          message: 'Mecánico no encontrado'
        });
      }

      if (mechanic.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'No se pueden asignar trabajos a un mecánico inactivo'
        });
      }

      // Crear trabajo
      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          mechanic_id,
          description,
          amount,
          job_date: job_date || new Date().toISOString().split('T')[0],
          vehicle_info: vehicle_info || null,
          notes: notes || null,
          status: status || 'pending',
          created_by: req.user.id
        }])
        .select(`
          *,
          mechanics (id, full_name, specialty)
        `)
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Trabajo creado exitosamente',
        data: { job: data }
      });

    } catch (error) {
      console.error('Error en createJob:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear trabajo',
        error: error.message
      });
    }
  }

  // Actualizar trabajo (solo admin)
  async updateJob(req, res) {
    try {
      const { id } = req.params;
      const { description, amount, job_date, vehicle_info, notes, status } = req.body;

      // Construir objeto de actualización
      const updateData = {};
      if (description !== undefined) updateData.description = description;
      if (amount !== undefined) updateData.amount = amount;
      if (job_date !== undefined) updateData.job_date = job_date;
      if (vehicle_info !== undefined) updateData.vehicle_info = vehicle_info;
      if (notes !== undefined) updateData.notes = notes;
      if (status !== undefined) updateData.status = status;

      // Actualizar trabajo
      const { data, error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          mechanics (id, full_name, specialty)
        `)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          message: 'Trabajo no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Trabajo actualizado exitosamente',
        data: { job: data }
      });

    } catch (error) {
      console.error('Error en updateJob:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar trabajo',
        error: error.message
      });
    }
  }

  // Actualizar estado de trabajo
  async updateJobStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'completed', 'paid'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido. Debe ser: pending, completed o paid'
        });
      }

      const { data, error } = await supabase
        .from('jobs')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          message: 'Trabajo no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Estado del trabajo actualizado exitosamente',
        data: { job: data }
      });

    } catch (error) {
      console.error('Error en updateJobStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar estado del trabajo',
        error: error.message
      });
    }
  }

  // Eliminar trabajo (solo admin)
  async deleteJob(req, res) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Trabajo eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error en deleteJob:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar trabajo',
        error: error.message
      });
    }
  }

  // Obtener resumen diario
  async getDailySummary(req, res) {
    try {
      const { date } = req.query;
      const targetDate = date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          amount,
          status,
          mechanic_id,
          mechanics (full_name)
        `)
        .eq('job_date', targetDate);

      if (error) throw error;

      const totalAmount = data.reduce((sum, job) => sum + parseFloat(job.amount), 0);

      res.json({
        success: true,
        message: 'Resumen diario obtenido exitosamente',
        data: {
          date: targetDate,
          totalJobs: data.length,
          totalAmount: totalAmount.toFixed(2),
          jobs: data
        }
      });

    } catch (error) {
      console.error('Error en getDailySummary:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener resumen diario',
        error: error.message
      });
    }
  }
}

module.exports = new JobController();