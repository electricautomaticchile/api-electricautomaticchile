import { Request, Response } from "express";
import Usuario, {
  IUsuario,
  ICrearUsuario,
  IActualizarUsuario,
} from "../models/Usuario";
import mongoose from "mongoose";
import { logger } from "../lib/logger";

export class UsuariosController {
  // GET /api/usuarios
  obtenerTodos = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuarios = await Usuario.findActivos().select("-password");

      res.status(200).json({
        success: true,
        data: usuarios,
        message: "Usuarios obtenidos exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo usuarios:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // GET /api/usuarios/:id
  obtenerPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de usuario inválido",
        });
        return;
      }

      const usuario = await Usuario.findById(id).select("-password");

      if (!usuario) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: usuario,
        message: "Usuario obtenido exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo usuario por ID:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // POST /api/usuarios
  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const datosUsuario: ICrearUsuario = req.body;

      // Validar que el email no exista
      const usuarioExistente = await Usuario.findOne({
        email: datosUsuario.email,
      });
      if (usuarioExistente) {
        res.status(400).json({
          success: false,
          message: "Ya existe un usuario con este email",
        });
        return;
      }

      const nuevoUsuario = new Usuario(datosUsuario);
      await nuevoUsuario.save();

      // Remover password de la respuesta
      const usuarioRespuesta = nuevoUsuario.toObject();
      delete usuarioRespuesta.password;

      res.status(201).json({
        success: true,
        data: usuarioRespuesta,
        message: "Usuario creado exitosamente",
      });
    } catch (error) {
      logger.error("Error creando usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // PUT /api/usuarios/:id
  actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const datosActualizacion: IActualizarUsuario = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de usuario inválido",
        });
        return;
      }

      const usuario = await Usuario.findById(id);
      if (!usuario) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      // Si se está actualizando el email, verificar que no exista
      if (
        datosActualizacion.email &&
        datosActualizacion.email !== usuario.email
      ) {
        const emailExistente = await Usuario.findOne({
          email: datosActualizacion.email,
          _id: { $ne: id },
        });
        if (emailExistente) {
          res.status(400).json({
            success: false,
            message: "Ya existe un usuario con este email",
          });
          return;
        }
      }

      const usuarioActualizado = await Usuario.findByIdAndUpdate(
        id,
        datosActualizacion,
        { new: true, runValidators: true }
      ).select("-password");

      res.status(200).json({
        success: true,
        data: usuarioActualizado,
        message: "Usuario actualizado exitosamente",
      });
    } catch (error) {
      logger.error("Error actualizando usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // DELETE /api/usuarios/:id
  eliminar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de usuario inválido",
        });
        return;
      }

      const usuario = await Usuario.findById(id);
      if (!usuario) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      // Soft delete - cambiar estado a inactivo
      await Usuario.findByIdAndUpdate(id, {
        estado: "inactivo",
        fechaEliminacion: new Date(),
      });

      res.status(200).json({
        success: true,
        message: "Usuario eliminado exitosamente",
      });
    } catch (error) {
      logger.error("Error eliminando usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };
}

export default new UsuariosController();
