const { createClient } = require('@supabase/supabase-js');
const config = require('./environment');

// Cliente con clave anónima (para operaciones normales)
const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Cliente con clave de servicio (para operaciones administrativas)
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

// Test de conexión
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('mechanics')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Conexión a Supabase establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con Supabase:', error.message);
    return false;
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  testConnection
};