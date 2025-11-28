const app = require('./src/app');
const config = require('./src/config/environment');
const { testConnection } = require('./src/config/database');

const PORT = config.port;

// Iniciar servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    console.log('🔍 Probando conexión a Supabase...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ No se pudo conectar a Supabase. Verifica tus credenciales en el archivo .env');
      process.exit(1);
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('');
      console.log('================================');
      console.log('🚀 Servidor iniciado correctamente');
      console.log('================================');
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌍 Entorno: ${config.nodeEnv}`);
      console.log(`📊 API: http://localhost:${PORT}/api`);
      console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
      console.log('================================');
      console.log('');
      console.log('📋 Endpoints disponibles:');
      console.log('');
      console.log('🔐 Autenticación:');
      console.log('  POST   /api/auth/admin/login');
      console.log('  POST   /api/auth/mechanic/login');
      console.log('  GET    /api/auth/verify');
      console.log('  POST   /api/auth/change-password');
      console.log('');
      console.log('👥 Mecánicos:');
      console.log('  GET    /api/mechanics');
      console.log('  GET    /api/mechanics/:id');
      console.log('  POST   /api/mechanics');
      console.log('  PUT    /api/mechanics/:id');
      console.log('  DELETE /api/mechanics/:id');
      console.log('  GET    /api/mechanics/:id/stats');
      console.log('');
      console.log('🔧 Trabajos:');
      console.log('  GET    /api/jobs');
      console.log('  GET    /api/jobs/:id');
      console.log('  GET    /api/jobs/mechanic/:mechanicId');
      console.log('  POST   /api/jobs');
      console.log('  PUT    /api/jobs/:id');
      console.log('  PATCH  /api/jobs/:id/status');
      console.log('  DELETE /api/jobs/:id');
      console.log('  GET    /api/jobs/daily-summary');
      console.log('');
      console.log('📊 Reportes:');
      console.log('  GET    /api/reports/weekly');
      console.log('  GET    /api/reports/weekly/mechanic/:mechanicId');
      console.log('  POST   /api/reports/weekly/close/:mechanicId');
      console.log('  GET    /api/reports/payments/mechanic/:mechanicId');
      console.log('  PATCH  /api/reports/payments/:paymentId/mark-paid');
      console.log('');
      console.log('================================');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Excepción no capturada:', err);
  process.exit(1);
});

// Iniciar
startServer();