import { Request, Response } from "express";
import { s3ImagesService } from "../lib/s3ImagesService";
import sharp from "sharp";
import Usuario from "../models/Usuario";
import Empresa from "../models/Empresa";
import Cliente from "../models/Cliente";
import Superusuario from "../models/Superusuario";

export class ImagenPerfilController {
  /**
   * Subir imagen de perfil - Endpoint genérico
   * POST /api/empresa/upload-image
   */
  static async uploadImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No se ha enviado ninguna imagen",
        });
      }

      // Log de depuración
      console.log(
        "[UPLOAD] Usuario:",
        (req as any).user?.numeroCliente || "-",
        "Tamaño:",
        req.file.size,
        "Tipo:",
        req.file.mimetype
      );

      // Validar tipo de archivo
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message:
            "Tipo de archivo no válido. Solo se permiten imágenes JPEG, PNG, JPG y WebP",
        });
      }

      // Validar tamaño de archivo (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: "La imagen es demasiado grande. El tamaño máximo es 5MB",
        });
      }

      // Generar nombre único dentro de carpeta <numeroCliente>/
      const usuarioAuth: any = (req as any).user || {};
      const tipoUsuario =
        usuarioAuth.tipoUsuario || usuarioAuth.role || "desconocido";
      const numeroCliente =
        usuarioAuth.numeroCliente || usuarioAuth.numeroempresa || "generico";

      const timestamp = Date.now();

      // Optimizar imagen: redimensionar a 512x512 y convertir a WebP calidad 80
      const optimizedBuffer = await sharp(req.file.buffer)
        .resize(512, 512, { fit: "cover" })
        .toFormat("webp", { quality: 80 })
        .toBuffer();

      const fileName = `${tipoUsuario}/${numeroCliente}/profile-${timestamp}-${Math.random()
        .toString(36)
        .substr(2, 9)}.webp`;

      // Subir imagen a S3
      console.log(
        "[UPLOAD] Subiendo a S3 bucket:",
        s3ImagesService["bucketName"],
        "key:",
        fileName
      );
      const imageUrl = await s3ImagesService.uploadFile(
        optimizedBuffer,
        fileName,
        "image/webp",
        undefined
      );

      return res.status(200).json({
        success: true,
        message: "Imagen subida exitosamente",
        data: {
          imageUrl,
          fileName,
        },
      });
    } catch (error) {
      console.error("Error al subir imagen:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al subir la imagen",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Actualizar imagen de perfil del usuario
   * POST /empresa/update-profile-image
   */
  static async updateProfileImage(req: Request, res: Response) {
    try {
      const { imageUrl, tipoUsuario, userId } = req.body;

      // Log de depuración
      console.log(
        "[UPDATE] imageUrl:",
        imageUrl,
        "tipoUsuario:",
        tipoUsuario,
        "userId:",
        userId
      );

      // Validar datos requeridos
      if (!imageUrl || !tipoUsuario || !userId) {
        return res.status(400).json({
          success: false,
          message: "Se requieren los campos: imageUrl, tipoUsuario y userId",
        });
      }

      // Validar tipo de usuario
      const tiposValidos = ["usuario", "empresa", "cliente", "superadmin"];
      if (!tiposValidos.includes(tipoUsuario)) {
        return res.status(400).json({
          success: false,
          message: "Tipo de usuario no válido",
        });
      }

      let usuario;
      let modeloActualizado;

      // Buscar y actualizar según el tipo de usuario
      switch (tipoUsuario) {
        case "usuario":
          usuario = await Usuario.findById(userId);
          if (!usuario) {
            return res.status(404).json({
              success: false,
              message: "Usuario no encontrado",
            });
          }
          modeloActualizado = await Usuario.findByIdAndUpdate(
            userId,
            { imagenPerfil: imageUrl },
            { new: true, runValidators: true }
          );
          break;

        case "empresa":
          usuario = await Empresa.findById(userId);
          if (!usuario) {
            return res.status(404).json({
              success: false,
              message: "Empresa no encontrada",
            });
          }
          modeloActualizado = await Empresa.findByIdAndUpdate(
            userId,
            { imagenPerfil: imageUrl },
            { new: true, runValidators: true }
          );
          break;

        case "cliente":
          usuario = await Cliente.findById(userId);
          if (!usuario) {
            return res.status(404).json({
              success: false,
              message: "Cliente no encontrado",
            });
          }
          modeloActualizado = await Cliente.findByIdAndUpdate(
            userId,
            { imagenPerfil: imageUrl },
            { new: true, runValidators: true }
          );
          break;

        case "superadmin":
          usuario = await Superusuario.findById(userId);
          if (!usuario) {
            return res.status(404).json({
              success: false,
              message: "Superusuario no encontrado",
            });
          }
          modeloActualizado = await Superusuario.findByIdAndUpdate(
            userId,
            { imagenPerfil: imageUrl },
            { new: true, runValidators: true }
          );
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Tipo de usuario no válido",
          });
      }

      return res.status(200).json({
        success: true,
        message: "Imagen de perfil actualizada exitosamente",
        data: {
          usuario: modeloActualizado,
          imagenPerfil: imageUrl,
        },
      });
    } catch (error) {
      console.error("Error al actualizar imagen de perfil:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al actualizar la imagen de perfil",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Obtener imagen de perfil actual
   * GET /empresa/profile-image/:tipoUsuario/:userId
   */
  static async getProfileImage(req: Request, res: Response) {
    try {
      const { tipoUsuario, userId } = req.params;

      // Validar tipo de usuario
      const tiposValidos = ["usuario", "empresa", "cliente", "superadmin"];
      if (!tiposValidos.includes(tipoUsuario)) {
        return res.status(400).json({
          success: false,
          message: "Tipo de usuario no válido",
        });
      }

      let usuario;

      // Buscar según el tipo de usuario
      switch (tipoUsuario) {
        case "usuario":
          usuario = await Usuario.findById(userId).select(
            "imagenPerfil nombre email"
          );
          break;
        case "empresa":
          usuario = await Empresa.findById(userId).select(
            "imagenPerfil nombreEmpresa correo"
          );
          break;
        case "cliente":
          usuario = await Cliente.findById(userId).select(
            "imagenPerfil nombre correo"
          );
          break;
        case "superadmin":
          usuario = await Superusuario.findById(userId).select(
            "imagenPerfil nombre correo"
          );
          break;
      }

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          imagenPerfil: usuario.imagenPerfil || null,
          usuario: usuario,
        },
      });
    } catch (error) {
      console.error("Error al obtener imagen de perfil:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener la imagen de perfil",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Eliminar imagen de perfil
   * DELETE /empresa/profile-image/:tipoUsuario/:userId
   */
  static async deleteProfileImage(req: Request, res: Response) {
    try {
      const { tipoUsuario, userId } = req.params;

      // Validar tipo de usuario
      const tiposValidos = ["usuario", "empresa", "cliente", "superadmin"];
      if (!tiposValidos.includes(tipoUsuario)) {
        return res.status(400).json({
          success: false,
          message: "Tipo de usuario no válido",
        });
      }

      let usuario;
      let modeloActualizado;

      // Buscar y actualizar según el tipo de usuario
      switch (tipoUsuario) {
        case "usuario":
          usuario = await Usuario.findById(userId);
          if (!usuario) {
            return res.status(404).json({
              success: false,
              message: "Usuario no encontrado",
            });
          }
          modeloActualizado = await Usuario.findByIdAndUpdate(
            userId,
            { $unset: { imagenPerfil: "" } },
            { new: true, runValidators: true }
          );
          break;

        case "empresa":
          usuario = await Empresa.findById(userId);
          if (!usuario) {
            return res.status(404).json({
              success: false,
              message: "Empresa no encontrada",
            });
          }
          modeloActualizado = await Empresa.findByIdAndUpdate(
            userId,
            { $unset: { imagenPerfil: "" } },
            { new: true, runValidators: true }
          );
          break;

        case "cliente":
          usuario = await Cliente.findById(userId);
          if (!usuario) {
            return res.status(404).json({
              success: false,
              message: "Cliente no encontrado",
            });
          }
          modeloActualizado = await Cliente.findByIdAndUpdate(
            userId,
            { $unset: { imagenPerfil: "" } },
            { new: true, runValidators: true }
          );
          break;

        case "superadmin":
          usuario = await Superusuario.findById(userId);
          if (!usuario) {
            return res.status(404).json({
              success: false,
              message: "Superusuario no encontrado",
            });
          }
          modeloActualizado = await Superusuario.findByIdAndUpdate(
            userId,
            { $unset: { imagenPerfil: "" } },
            { new: true, runValidators: true }
          );
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Tipo de usuario no válido",
          });
      }

      return res.status(200).json({
        success: true,
        message: "Imagen de perfil eliminada exitosamente",
        data: {
          usuario: modeloActualizado,
        },
      });
    } catch (error) {
      console.error("Error al eliminar imagen de perfil:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al eliminar la imagen de perfil",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}

export default ImagenPerfilController;
