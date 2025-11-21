require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const mecanicosRoutes = require('./routes/mecanicos');
const trabajosRoutes = require('./routes/trabajos');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/mecanicos', mecanicosRoutes);
app.use('/api/trabajos', trabajosRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    mensaje: '✅ API con Supabase funcionando',
    version: '1.0.0'
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    mensaje: 'Ruta no encontrada' 
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor con Supabase corriendo en puerto ${PORT}`);
});
