const mongoose = require('mongoose');

const trabajoSchema = new mongoose.Schema({
  mecanico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  tipoTrabajo: {
    type: String,
    required: [true, 'El tipo de trabajo es obligatorio'],
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  precioServicio: {
    type: Number,
    required: [true, 'El precio del servicio es obligatorio'],
    min: 0
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: ['completado', 'pendiente', 'en_progreso'],
    default: 'completado'
  }
});

module.exports = mongoose.model('Trabajo', trabajoSchema);