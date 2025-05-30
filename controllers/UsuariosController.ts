import { Request, Response } from 'express';
import Usuario, { IUsuario, ICrearUsuario, IActualizarUsuario } from '../models/Usuario';
import mongoose from 'mongoose';

export class UsuariosController {
  // GET /api/usuarios
  obtenerTodos = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuarios = await Usuario.findActivos().select('-password');
      res.status(200).json({
        success: true,
        data: usuarios,
        total: usuarios.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuarios',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // GET /api/usuarios/:id
  obtenerPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Validar ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
        return;
      }

      const usuario = await Usuario.findOne({ _id: id, activo: true }).select('-password');
      
      if (!usuario) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: usuario
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // POST /api/usuarios
  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const datosUsuario: ICrearUsuario = req.body;
      
      // Validaciones básicas
      if (!datosUsuario.nombre || !datosUsuario.email || !datosUsuario.password) {
        res.status(400).json({
          success: false,
          message: 'Nombre, email y contraseña son requeridos'
        });
        return;
      }

      // Verificar email único
      const emailExiste = await Usuario.findByEmail(datosUsuario.email);
      if (emailExiste) {
        res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
        return;
      }

      // Crear nuevo usuario
      const nuevoUsuario = new Usuario(datosUsuario);
      await nuevoUsuario.save();

      // Devolver usuario sin contraseña
      const usuarioSinPassword = await Usuario.findById(nuevoUsuario._id).select('-password');

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: usuarioSinPassword
      });
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: Object.values(error.errors).map(err => err.message)
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error al crear usuario',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
  };

  // PUT /api/usuarios/:id
  actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const datosActualizacion: IActualizarUsuario = req.body;
      
      // Validar ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
        return;
      }

      // Verificar que el usuario existe
      const usuario = await Usuario.findById(id);
      if (!usuario) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      // Verificar email único si se está actualizando
      if (datosActualizacion.email) {
        const emailExiste = await Usuario.findOne({ 
          email: datosActualizacion.email.toLowerCase(), 
          _id: { $ne: id } 
        });
        if (emailExiste) {
          res.status(400).json({
            success: false,
            message: 'El email ya está registrado'
          });
          return;
        }
      }

      // Actualizar usuario
      const usuarioActualizado = await Usuario.findByIdAndUpdate(
        id,
        { ...datosActualizacion, fechaActualizacion: new Date() },
        { new: true, runValidators: true }
      ).select('-password');

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: usuarioActualizado
      });
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: Object.values(error.errors).map(err => err.message)
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error al actualizar usuario',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
  };

  // DELETE /api/usuarios/:id
  eliminar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Validar ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
        return;
      }

      // Verificar que el usuario existe
      const usuario = await Usuario.findById(id);
      if (!usuario) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      // Soft delete - marcar como inactivo
      await Usuario.findByIdAndUpdate(id, { 
        activo: false, 
        fechaActualizacion: new Date() 
      });

      res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
} 