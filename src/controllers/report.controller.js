// =============================================
// src/controllers/report.controller.js
// =============================================
const { supabase } = require('../config/database');

// Función helper fuera de la clase
function getWeekDates(dateString = null) {
  const date = dateString ? new Date(dateString) : new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Lunes como inicio
  
  const weekStart = new Date(date.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return {
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0]
  };
}

class ReportController {

  // Obtener reporte semanal general (todos los mecánicos)
  async getWeeklySummary(req, res) {
    try {
      const { date } = req.query;
      const { start, end } = getWeekDates(date);

      // Obtener todos los trabajos de la semana
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          id,
          mechanic_id,
          amount,
          status,
          job_date,
          mechanics (id, full_name, specialty)
        `)
        .gte('job_date', start)
        .lte('job_date', end);

      if (error) throw error;

      // Agrupar por mecánico
      const mechanicsSummary = {};
      
      jobs.forEach(job => {
        const mechanicId = job.mechanic_id;
        
        if (!mechanicsSummary[mechanicId]) {
          mechanicsSummary[mechanicId] = {
            mechanic_id: mechanicId,
            full_name: job.mechanics.full_name,
            specialty: job.mechanics.specialty,
            totalJobs: 0,
            totalAmount: 0,
            pendingJobs: 0,
            completedJobs: 0,
            paidJobs: 0,
            jobs: []
          };
        }

        mechanicsSummary[mechanicId].totalJobs++;
        mechanicsSummary[mechanicId].totalAmount += parseFloat(job.amount);
        mechanicsSummary[mechanicId].jobs.push({
          id: job.id,
          date: job.job_date,
          amount: job.amount,
          status: job.status
        });

        if (job.status === 'pending') mechanicsSummary[mechanicId].pendingJobs++;
        if (job.status === 'completed') mechanicsSummary[mechanicId].completedJobs++;
        if (job.status === 'paid') mechanicsSummary[mechanicId].paidJobs++;
      });

      // Convertir objeto a array y redondear montos
      const summary = Object.values(mechanicsSummary).map(m => ({
        ...m,
        totalAmount: parseFloat(m.totalAmount.toFixed(2))
      }));

      // Calcular totales generales
      const grandTotal = summary.reduce((sum, m) => sum + m.totalAmount, 0);
      const totalJobs = summary.reduce((sum, m) => sum + m.totalJobs, 0);

      res.json({
        success: true,
        message: 'Reporte semanal obtenido exitosamente',
        data: {
          period: { start, end },
          summary: {
            totalMechanics: summary.length,
            totalJobs,
            grandTotal: grandTotal.toFixed(2)
          },
          mechanics: summary
        }
      });

    } catch (error) {
      console.error('Error en getWeeklySummary:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener reporte semanal',
        error: error.message
      });
    }
  }

  // Obtener reporte semanal de un mecánico específico
  async getMechanicWeeklySummary(req, res) {
    try {
      const { mechanicId } = req.params;
      const { date } = req.query;
      const { start, end } = getWeekDates(date);

      // Verificar que el mecánico existe
      const { data: mechanic, error: mechanicError } = await supabase
        .from('mechanics')
        .select('id, full_name, specialty')
        .eq('id', mechanicId)
        .single();

      if (mechanicError || !mechanic) {
        return res.status(404).json({
          success: false,
          message: 'Mecánico no encontrado'
        });
      }

      // Obtener trabajos de la semana
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('mechanic_id', mechanicId)
        .gte('job_date', start)
        .lte('job_date', end)
        .order('job_date', { ascending: true });

      if (jobsError) throw jobsError;

      // Calcular estadísticas
      const totalJobs = jobs.length;
      const totalAmount = jobs.reduce((sum, job) => sum + parseFloat(job.amount), 0);
      const pendingJobs = jobs.filter(j => j.status === 'pending');
      const completedJobs = jobs.filter(j => j.status === 'completed');
      const paidJobs = jobs.filter(j => j.status === 'paid');

      res.json({
        success: true,
        message: 'Reporte semanal del mecánico obtenido exitosamente',
        data: {
          mechanic: {
            id: mechanic.id,
            full_name: mechanic.full_name,
            specialty: mechanic.specialty
          },
          period: { start, end },
          summary: {
            totalJobs,
            totalAmount: totalAmount.toFixed(2),
            pending: {
              count: pendingJobs.length,
              amount: pendingJobs.reduce((sum, j) => sum + parseFloat(j.amount), 0).toFixed(2)
            },
            completed: {
              count: completedJobs.length,
              amount: completedJobs.reduce((sum, j) => sum + parseFloat(j.amount), 0).toFixed(2)
            },
            paid: {
              count: paidJobs.length,
              amount: paidJobs.reduce((sum, j) => sum + parseFloat(j.amount), 0).toFixed(2)
            }
          },
          jobs
        }
      });

    } catch (error) {
      console.error('Error en getMechanicWeeklySummary:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener reporte semanal del mecánico',
        error: error.message
      });
    }
  }

  // Guardar/cerrar semana (crear registro de pago semanal)
  async closeWeek(req, res) {
    try {
      const { mechanicId } = req.params;
      const { date, notes } = req.body;
      const { start, end } = getWeekDates(date);

      // Verificar que el mecánico existe
      const { data: mechanic, error: mechanicError } = await supabase
        .from('mechanics')
        .select('id, full_name')
        .eq('id', mechanicId)
        .single();

      if (mechanicError || !mechanic) {
        return res.status(404).json({
          success: false,
          message: 'Mecánico no encontrado'
        });
      }

      // Verificar si ya existe un registro para esta semana
      const { data: existing } = await supabase
        .from('weekly_payments')
        .select('id')
        .eq('mechanic_id', mechanicId)
        .eq('week_start', start)
        .eq('week_end', end)
        .single();

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un registro de pago para esta semana'
        });
      }

      // Obtener trabajos completados y pagados de la semana
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('mechanic_id', mechanicId)
        .gte('job_date', start)
        .lte('job_date', end)
        .in('status', ['completed', 'paid']);

      if (jobsError) throw jobsError;

      const totalAmount = jobs.reduce((sum, job) => sum + parseFloat(job.amount), 0);
      const totalJobs = jobs.length;

      // Crear registro de pago semanal
      const { data: payment, error: paymentError } = await supabase
        .from('weekly_payments')
        .insert([{
          mechanic_id: mechanicId,
          week_start: start,
          week_end: end,
          total_amount: totalAmount,
          total_jobs: totalJobs,
          payment_status: 'pending',
          notes: notes || null
        }])
        .select()
        .single();

      if (paymentError) throw paymentError;

      res.status(201).json({
        success: true,
        message: 'Semana cerrada exitosamente',
        data: {
          payment,
          mechanic: {
            id: mechanic.id,
            full_name: mechanic.full_name
          }
        }
      });

    } catch (error) {
      console.error('Error en closeWeek:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cerrar semana',
        error: error.message
      });
    }
  }

  // Obtener historial de pagos semanales
  async getPaymentHistory(req, res) {
    try {
      const { mechanicId } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      const { data, error } = await supabase
        .from('weekly_payments')
        .select(`
          *,
          mechanics (id, full_name)
        `)
        .eq('mechanic_id', mechanicId)
        .order('week_start', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Historial de pagos obtenido exitosamente',
        data: {
          payments: data,
          total: data.length
        }
      });

    } catch (error) {
      console.error('Error en getPaymentHistory:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener historial de pagos',
        error: error.message
      });
    }
  }

  // Marcar pago como realizado
  async markAsPaid(req, res) {
    try {
      const { paymentId } = req.params;

      const { data, error } = await supabase
        .from('weekly_payments')
        .update({
          payment_status: 'paid',
          paid_date: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          message: 'Registro de pago no encontrado'
        });
      }

      // Actualizar trabajos a 'paid'
      await supabase
        .from('jobs')
        .update({ status: 'paid' })
        .eq('mechanic_id', data.mechanic_id)
        .gte('job_date', data.week_start)
        .lte('job_date', data.week_end)
        .eq('status', 'completed');

      res.json({
        success: true,
        message: 'Pago marcado como realizado exitosamente',
        data: { payment: data }
      });

    } catch (error) {
      console.error('Error en markAsPaid:', error);
      res.status(500).json({
        success: false,
        message: 'Error al marcar pago como realizado',
        error: error.message
      });
    }
  }
}

module.exports = new ReportController();