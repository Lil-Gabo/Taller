const { supabase } = require('../config/database');
const { generateToken } = require('../utils/jwt.util');
const { comparePassword } = require('../utils/password.util');

class AuthController {
  
  // Login para administrador
  async loginAdmin(req, res) {
    try {
      const { username, password } = req.body;

      console.log('🔍 Login attempt:', { username, password: '***' });

      // Buscar admin en la base de datos
      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .single();

      console.log('📊 Query result:', { 
        found: !!admin, 
        error: error?.message,
        hasHash: !!admin?.password_hash 
      });

      if (error || !admin) {
        console.log('❌ Admin not found');
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas - Usuario no encontrado'
        });
      }

      // Verificar contraseña
      console.log('🔐 Comparing password...');
      const isValidPassword = await comparePassword(password, admin.password_hash);
      console.log('🔐 Password valid?', isValidPassword);

      if (!isValidPassword) {
        console.log('❌ Invalid password');
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas - Contraseña incorrecta'
        });
      }

      // Generar token JWT
      const token = generateToken({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: 'admin'
      });

      res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          token,
          user: {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            full_name: admin.full_name,
            role: 'admin'
          }
        }
      });

    } catch (error) {
      console.error('Error en loginAdmin:', error);
      res.status(500).json({
        success: false,
        message: 'Error al iniciar sesión',
        error: error.message
      });
    }
  }

  // Login para mecánico
  async loginMechanic(req, res) {
    try {
      const { username, password } = req.body;

      // Buscar mecánico en la base de datos
      const { data: mechanic, error } = await supabase
        .from('mechanics')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !mechanic) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar que el mecánico esté activo
      if (mechanic.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Tu cuenta está inactiva. Contacta al administrador.'
        });
      }

      // Verificar contraseña
      const isValidPassword = await comparePassword(password, mechanic.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Generar token JWT
      const token = generateToken({
        id: mechanic.id,
        username: mechanic.username,
        email: mechanic.email,
        role: 'mechanic'
      });

      res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          token,
          user: {
            id: mechanic.id,
            username: mechanic.username,
            email: mechanic.email,
            full_name: mechanic.full_name,
            specialty: mechanic.specialty,
            role: 'mechanic'
          }
        }
      });

    } catch (error) {
      console.error('Error en loginMechanic:', error);
      res.status(500).json({
        success: false,
        message: 'Error al iniciar sesión',
        error: error.message
      });
    }
  }

  // Verificar token (para verificar si el usuario sigue autenticado)
  async verifyToken(req, res) {
    try {
      // El middleware ya verificó el token y agregó req.user
      res.json({
        success: true,
        message: 'Token válido',
        data: {
          user: req.user
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al verificar token',
        error: error.message
      });
    }
  }

  // Cambiar contraseña
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere la contraseña actual y la nueva'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }

      // Determinar tabla según rol
      const table = userRole === 'admin' ? 'admins' : 'mechanics';

      // Obtener usuario actual
      const { data: user, error: fetchError } = await supabase
        .from(table)
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (fetchError || !user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar contraseña actual
      const isValidPassword = await comparePassword(currentPassword, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'La contraseña actual es incorrecta'
        });
      }

      // Hashear nueva contraseña
      const { hashPassword } = require('../utils/password.util');
      const newPasswordHash = await hashPassword(newPassword);

      // Actualizar contraseña
      const { error: updateError } = await supabase
        .from(table)
        .update({ password_hash: newPasswordHash })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });

    } catch (error) {
      console.error('Error en changePassword:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar contraseña',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();