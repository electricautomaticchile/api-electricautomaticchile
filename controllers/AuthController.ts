import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Usuario from "../models/Usuario";
import { logger } from "../lib/logger";

export class AuthController {
  // POST /api/auth/login
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: "Número de cliente y contraseña son requeridos",
        });
        return;
      }

      // Debug: Log del intento de login
      console.log("🔍 Intento de login:", { numeroCliente: email });

      let usuario: any = null;
      let tipoUsuarioEncontrado = null;

      // Buscar en las tres colecciones
      try {
        if (!mongoose.connection.db) {
          throw new Error("Base de datos no conectada");
        }

        // 1. Buscar en superusuarios
        const superusuarioFilter = {
          numeroCliente: email,
          activo: true,
        };
        console.log(
          "🔍 Buscando en superusuarios con filtro:",
          superusuarioFilter
        );

        const superusuario = await mongoose.connection.db
          .collection("superusuarios")
          .findOne(superusuarioFilter);

        if (superusuario) {
          usuario = superusuario;
          tipoUsuarioEncontrado = "superadmin";
          console.log("👤 Usuario encontrado en: superusuarios");
        }

        // 2. Si no se encontró, buscar en empresas
        if (!usuario) {
          const empresaFilter = {
            numeroCliente: email,
            estado: "activo",
          };
          console.log("🔍 Buscando en empresas con filtro:", empresaFilter);

          const empresa = await mongoose.connection.db
            .collection("empresas")
            .findOne(empresaFilter);

          if (empresa) {
            usuario = empresa;
            tipoUsuarioEncontrado = "empresa";
            console.log("👤 Usuario encontrado en: empresas");
          }
        }

        // 3. Si no se encontró, buscar en clientes
        if (!usuario) {
          const clienteFilter = {
            numeroCliente: email,
            activo: true,
          };
          console.log("🔍 Buscando en clientes con filtro:", clienteFilter);

          const cliente = await mongoose.connection.db
            .collection("clientes")
            .findOne(clienteFilter);

          if (cliente) {
            usuario = cliente;
            tipoUsuarioEncontrado = "cliente";
            console.log("👤 Usuario encontrado en: clientes");
          }
        }
      } catch (error) {
        console.log("⚠️ Error buscando en colecciones:", error);
      }

      if (!usuario) {
        console.log("❌ Usuario no encontrado en ninguna colección");
        console.log("🔍 Búsqueda realizada en:");
        console.log(
          "  - superusuarios: numeroCliente =",
          email,
          "AND activo = true"
        );
        console.log(
          "  - empresas: numeroCliente =",
          email,
          "AND estado = 'activo'"
        );
        console.log(
          "  - clientes: numeroCliente =",
          email,
          "AND activo = true"
        );
        res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
        return;
      }

      // Verificar contraseña
      console.log("🔐 Verificando contraseña...");
      console.log(
        "🔐 Password hash en BD:",
        usuario.password ? "EXISTE" : "NO EXISTE"
      );

      const passwordValida = await bcrypt.compare(
        password,
        usuario.password || ""
      );

      console.log("🔐 Password válida:", passwordValida);

      if (!passwordValida) {
        console.log(
          "❌ Password incorrecta para usuario encontrado en colección:",
          tipoUsuarioEncontrado
        );
        res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
        return;
      }

      // Generar JWT con los campos que espera el middleware del frontend
      const token = jwt.sign(
        {
          sub: usuario._id.toString(), // subject (ID del usuario)
          userId: usuario._id.toString(), // ID del usuario
          id: usuario._id,
          email: usuario.correo || usuario.email,
          role: usuario.role || tipoUsuarioEncontrado, // rol del usuario
          type: tipoUsuarioEncontrado, // tipo de usuario
          tipo: tipoUsuarioEncontrado,
          numeroCliente: usuario.numeroCliente,
        },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "24h" }
      );

      // Respuesta exitosa
      res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: usuario._id,
            name: usuario.nombre || usuario.nombreEmpresa,
            email: usuario.correo || usuario.email,
            numeroCliente: usuario.numeroCliente,
            type: tipoUsuarioEncontrado,
            role: usuario.role || tipoUsuarioEncontrado,
            tipoUsuario: tipoUsuarioEncontrado,
          },
        },
        message: "Login exitoso",
      });
    } catch (error) {
      logger.error("Error en login:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // POST /api/auth/logout
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        message: "Logout exitoso",
      });
    } catch (error) {
      logger.error("Error en logout:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // GET /api/auth/me
  me = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("🔍 Obteniendo perfil de usuario:", req.user);

      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      let usuario: any = null;
      let tipoUsuario = req.user.tipo;

      if (!mongoose.connection.db) {
        throw new Error("Base de datos no conectada");
      }

      // Buscar en la colección correcta según el tipo de usuario
      try {
        if (tipoUsuario === "superadmin") {
          usuario = await mongoose.connection.db
            .collection("superusuarios")
            .findOne({
              _id: new mongoose.Types.ObjectId(req.user.id),
            });
        } else if (tipoUsuario === "empresa") {
          usuario = await mongoose.connection.db
            .collection("empresas")
            .findOne({
              _id: new mongoose.Types.ObjectId(req.user.id),
            });
        } else if (tipoUsuario === "cliente") {
          usuario = await mongoose.connection.db
            .collection("clientes")
            .findOne({
              _id: new mongoose.Types.ObjectId(req.user.id),
            });
        }
      } catch (error) {
        console.log("⚠️ Error buscando usuario en colecciones:", error);
      }

      if (!usuario) {
        console.log("❌ Usuario no encontrado en colección:", tipoUsuario);
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      // Remover password de la respuesta
      delete usuario.password;
      delete usuario.passwordVisible;

      console.log(
        "✅ Usuario encontrado:",
        usuario.nombre || usuario.nombreEmpresa
      );

      // Retornar el objeto completo del usuario con todos sus campos
      res.status(200).json({
        success: true,
        data: {
          ...usuario,
          id: usuario._id,
          name: usuario.nombre || usuario.nombreEmpresa,
          email: usuario.correo || usuario.email,
          type: tipoUsuario,
          role: usuario.role || tipoUsuario,
          tipoUsuario: tipoUsuario,
        },
        message: "Usuario obtenido exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo usuario actual:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // Alias para compatibilidad con rutas
  obtenerPerfilUsuario = this.me;

  // POST /api/auth/refresh-token
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      // TODO: Implementar refresh token
      res.status(200).json({
        success: true,
        data: { token: "new-token" },
        message: "Token renovado exitosamente",
      });
    } catch (error) {
      logger.error("Error renovando token:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // POST /api/auth/cambiar-password
  cambiarPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { passwordActual, passwordNueva } = req.body;
      const userId = req.user?.id;

      if (!passwordActual || !passwordNueva) {
        res.status(400).json({
          success: false,
          message: "Password actual y nueva son requeridas",
        });
        return;
      }

      // TODO: Implementar cambio de password
      res.status(200).json({
        success: true,
        message: "Password cambiada exitosamente",
      });
    } catch (error) {
      logger.error("Error cambiando password:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // POST /api/auth/solicitar-recuperacion
  solicitarRecuperacion = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: "Email es requerido",
        });
        return;
      }

      // TODO: Implementar solicitud de recuperación
      res.status(200).json({
        success: true,
        message: "Email de recuperación enviado",
      });
    } catch (error) {
      logger.error("Error solicitando recuperación:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // POST /api/auth/restablecer-password
  restablecerPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, passwordNueva } = req.body;

      if (!token || !passwordNueva) {
        res.status(400).json({
          success: false,
          message: "Token y password nueva son requeridos",
        });
        return;
      }

      // TODO: Implementar restablecimiento de password
      res.status(200).json({
        success: true,
        message: "Password restablecida exitosamente",
      });
    } catch (error) {
      logger.error("Error restableciendo password:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };
}

export default new AuthController();
