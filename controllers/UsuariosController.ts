import { Request, Response } from 'express';
import { IUsuario, ICrearUsuario, IActualizarUsuario } from '../models/Usuario';

// Simulamos una base de datos en memoria para el ejemplo
let usuarios: IUsuario[] = [
  {
    id: 1,
    nombre: 'Admin Sistema',
    email: 'admin@electricautomatic.cl',
    telefono: '+56912345678',
    rol: 'admin',
    activo: true,
    fechaCreacion: new Date(),
  }
];

let nextId = 2;

export class UsuariosController {
  // GET /api/usuarios
  obtenerTodos = (req: Request, res: Response): void => {
    try {
      const usuariosActivos = usuarios.filter(u => u.activo);
      res.status(200).json({
        success: true,
        data: usuariosActivos,
        total: usuariosActivos.length
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
  obtenerPorId = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const usuario = usuarios.find(u => u.id === id && u.activo);
      
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
  crear = (req: Request, res: Response): void => {
    try {
      const datosUsuario: ICrearUsuario = req.body;
      
      // Validaciones básicas
      if (!datosUsuario.nombre || !datosUsuario.email) {
        res.status(400).json({
          success: false,
          message: 'Nombre y email son requeridos'
        });
        return;
      }

      // Verificar email único
      const emailExiste = usuarios.some(u => u.email === datosUsuario.email);
      if (emailExiste) {
        res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
        return;
      }

      const nuevoUsuario: IUsuario = {
        id: nextId++,
        ...datosUsuario,
        activo: true,
        fechaCreacion: new Date()
      };

      usuarios.push(nuevoUsuario);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: nuevoUsuario
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // PUT /api/usuarios/:id
  actualizar = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const datosActualizacion: IActualizarUsuario = req.body;
      
      const usuarioIndex = usuarios.findIndex(u => u.id === id);
      if (usuarioIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      // Verificar email único si se está actualizando
      if (datosActualizacion.email) {
        const emailExiste = usuarios.some(u => u.email === datosActualizacion.email && u.id !== id);
        if (emailExiste) {
          res.status(400).json({
            success: false,
            message: 'El email ya está registrado'
          });
          return;
        }
      }

      usuarios[usuarioIndex] = {
        ...usuarios[usuarioIndex],
        ...datosActualizacion,
        fechaActualizacion: new Date()
      };

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: usuarios[usuarioIndex]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // DELETE /api/usuarios/:id
  eliminar = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const usuarioIndex = usuarios.findIndex(u => u.id === id);
      
      if (usuarioIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      // Soft delete - marcar como inactivo
      usuarios[usuarioIndex].activo = false;
      usuarios[usuarioIndex].fechaActualizacion = new Date();

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