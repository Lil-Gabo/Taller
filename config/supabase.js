// config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Cliente normal (para operaciones públicas)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente admin (para operaciones de administrador)
const supabaseAdmin = createClient(
    supabaseUrl, 
    supabaseServiceKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

module.exports = { supabase, supabaseAdmin };