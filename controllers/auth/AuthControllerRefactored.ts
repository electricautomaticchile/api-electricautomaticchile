import { Request, Response } from "express";
import { AuthUserService } from "./AuthUserService";
import { AuthPasswordService } from "./AuthPasswordService";
import { AuthTokenService } from "./AuthTokenService";
import { AuthRecoveryService } from "./AuthRecoveryService";
import {
  ILoginUsuario,
  ICambioPassword,
  IRecuperacionPassword,
  IRestablecerPassword,
  IRefreshToken,
  IAuthUser,
} from "./types";
import Cliente from "../../models/Cliente";

// Extender Request para incluir user
interface AuthRequest extends Request {
  user?: IAuthUser;
}

export class AuthController {
  // POST /api/auth/login
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: ILoginUsuario = req.body;

      console.log("🔍 Intento de login:", {
        email,
        passwordLength: password?.length,
      });

      // Validaciones básicas
      if (!email || !password) {
        console.log("❌ Faltan credenciales");
        res.status(400).json({
          success: false,
          message: "Email/Número de cliente y contraseña son requeridos",
        });
        return;
      }

      // Buscar usuario
      const usuarioEncontrado =
        await AuthUserService.buscarUsuarioPorCredencial(email);
      if (!usuarioEncontrado) {
        console.log("❌ Usuario no encontrado");
        res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
        return;
      }

      const { usuario, tipo } = usuarioEncontrado;

      // Verificar estado del usuario
      const estadoVerificacion = AuthUserService.verificarEstadoUsuario(
        usuario,
        tipo
      );
      if (!estadoVerificacion.valido) {
        console.log(
          "❌ Estado de usuario no válido:",
          estadoVerificacion.mensaje
        );
        res.status(403).json({
          success: false,
          message: estadoVerificacion.mensaje,
          data: estadoVerificacion.data,
        });
        return;
      }

      // Verificar contraseña
      const passwordValida = await AuthPasswordService.verificarPassword(
        usuario,
        password,
        tipo
      );
      if (!passwordValida) {
        console.log("❌ Contraseña incorrecta");
        res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
        return;
      }

      // Generar tokens
      const usuarioFormateado = AuthTokenService.formatearUsuarioRespuesta(
        usuario,
        tipo
      );
      const token = AuthTokenService.generarTokenAcceso(
        usuarioFormateado,
        tipo
      );
      const refreshToken =
        AuthTokenService.generarRefreshToken(usuarioFormateado);

      // Verificar si necesita cambio de contraseña (para empresas)
      if (tipo === "empresa" && usuario.passwordTemporal) {
        console.log(
          "⚠️ Empresa necesita cambiar contraseña temporal - pero permitiendo acceso"
        );
        res.status(200).json({
          success: true,
          message: "Login exitoso - Requiere cambio de contraseña",
          data: {
            requiereCambioPassword: true,
            user: usuarioFormateado,
            token,
            refreshToken,
          },
        });
        return;
      }

      console.log(
        `✅ Login exitoso para ${tipo.toUpperCase()}:`,
        usuario.numeroCliente
      );

      // Actualizar último acceso
      await AuthUserService.actualizarUltimoAcceso(usuario._id, tipo);

      res.status(200).json({
        success: true,
        message: "Login exitoso",
        data: {
          user: usuarioFormateado,
          token,
          refreshToken,
        },
      });
    } catch (error) {
      console.error("💥 Error en login:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // POST /api/auth/logout
  static logout(req: Request, res: Response): void {
    try {
      res.status(200).json({
        success: true,
        message: "Logout exitoso",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al cerrar sesión",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // GET /api/auth/me
  static async obtenerPerfilUsuario(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          message: "Token no válido",
        });
        return;
      }

      const { sub: userId, tipoUsuario } = user;

      if (!userId || !tipoUsuario) {
        res.status(400).json({
          success: false,
          message: "Token inválido: no contiene la información necesaria.",
        });
        return;
      }

      const usuario = await AuthUserService.buscarUsuarioPorId(
        userId,
        tipoUsuario
      );
      if (!usuario) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado.",
        });
        return;
      }

      // Verificar si la cuenta está activa
      const estadoActivo =
        usuario.estado === "activo" ||
        usuario.activo === true ||
        usuario.esActivo === true;

      if (!estadoActivo) {
        res.status(403).json({
          success: false,
          message: "La cuenta del usuario está inactiva o suspendida.",
          data: {
            estado: usuario.estado || "inactivo",
          },
        });
        return;
      }

      // Construir la respuesta unificada
      const perfil = {
        _id: usuario._id,
        nombre: usuario.nombre || usuario.nombreEmpresa,
        email: usuario.correo,
        numeroCliente: usuario.numeroCliente,
        telefono: usuario.telefono,
        role: usuario.role,
        tipoUsuario: tipoUsuario,
        activo: estadoActivo,
        estado: usuario.estado,
        fechaCreacion: usuario.fechaCreacion || usuario.fechaRegistro,
        ultimoAcceso: usuario.ultimoAcceso,
      };

      res.status(200).json({
        success: true,
        data: perfil,
      });
    } catch (error) {
      console.error("💥 Error en obtenerPerfilUsuario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener el perfil.",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // POST /api/auth/cambiar-password
  static async cambiarPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { passwordActual, passwordNueva }: ICambioPassword = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Token no válido",
        });
        return;
      }

      const { sub: userId, tipoUsuario } = user;

      console.log("🔐 Solicitud de cambio de contraseña");

      // Validaciones básicas
      if (!passwordActual || !passwordNueva) {
        res.status(400).json({
          success: false,
          message: "Contraseña actual y nueva contraseña son requeridas",
        });
        return;
      }

      // Validar nueva contraseña
      const validacionPassword =
        AuthPasswordService.validarPassword(passwordNueva);
      if (!validacionPassword.valida) {
        res.status(400).json({
          success: false,
          message: validacionPassword.mensaje,
        });
        return;
      }

      // Buscar usuario con contraseña
      const usuario = await AuthUserService.buscarUsuarioConPassword(
        userId,
        tipoUsuario
      );
      if (!usuario) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      // Verificar contraseña actual
      const passwordActualValida =
        await usuario.compararPassword(passwordActual);
      if (!passwordActualValida) {
        console.log("❌ Contraseña actual incorrecta");
        res.status(400).json({
          success: false,
          message: "La contraseña actual es incorrecta",
        });
        return;
      }

      // Cambiar contraseña
      await AuthPasswordService.cambiarPassword(
        usuario,
        passwordNueva,
        tipoUsuario
      );

      console.log("✅ Contraseña cambiada exitosamente");

      res.status(200).json({
        success: true,
        message: "Contraseña cambiada exitosamente",
        data: {
          passwordTemporal: tipoUsuario === "empresa" ? false : undefined,
        },
      });
    } catch (error) {
      console.error("💥 Error al cambiar contraseña:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // POST /api/auth/solicitar-recuperacion
  static async solicitarRecuperacion(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { emailOrNumeroCliente }: IRecuperacionPassword = req.body;

      console.log("🔐 Solicitud de recuperación para:", emailOrNumeroCliente);

      if (!emailOrNumeroCliente) {
        res.status(400).json({
          success: false,
          message: "Email o número de cliente es requerido",
        });
        return;
      }

      const resultado =
        await AuthRecoveryService.procesarSolicitudRecuperacion(
          emailOrNumeroCliente
        );

      res.status(200).json({
        success: true,
        message: resultado.mensaje,
      });
    } catch (error) {
      console.error("💥 Error en solicitud de recuperación:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // POST /api/auth/restablecer-password
  static async restablecerPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, nuevaPassword }: IRestablecerPassword = req.body;

      console.log("🔐 Solicitud de restablecimiento de contraseña");

      if (!token || !nuevaPassword) {
        res.status(400).json({
          success: false,
          message: "Token y nueva contraseña son requeridos",
        });
        return;
      }

      const resultado = await AuthRecoveryService.procesarRestablecimiento(
        token,
        nuevaPassword
      );

      const statusCode = resultado.exito ? 200 : 400;
      res.status(statusCode).json({
        success: resultado.exito,
        message: resultado.mensaje,
        data: resultado.data,
      });
    } catch (error) {
      console.error("💥 Error al restablecer contraseña:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // POST /api/auth/refresh-token
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken }: IRefreshToken = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: "Refresh token requerido",
        });
        return;
      }

      // Verificar refresh token
      const verificacion = AuthTokenService.verificarRefreshToken(refreshToken);
      if (!verificacion.valido) {
        res.status(401).json({
          success: false,
          message: "Refresh token inválido",
        });
        return;
      }

      const decoded = verificacion.decoded;

      // Buscar cliente usando sub (estándar) o userId (compatibilidad)
      const clienteId = decoded.sub || decoded.userId;
      const cliente = await Cliente.findById(clienteId);
      if (!cliente) {
        res.status(401).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      // Verificar si está activo
      const isActive =
        cliente.activo !== undefined ? cliente.activo : cliente.esActivo;
      if (!isActive) {
        res.status(401).json({
          success: false,
          message: "Cuenta inactiva",
        });
        return;
      }

      // Generar nuevo token
      const usuarioFormateado = AuthTokenService.formatearUsuarioRespuesta(
        cliente,
        "cliente"
      );
      const newToken = AuthTokenService.generarTokenAcceso(
        usuarioFormateado,
        "cliente"
      );

      res.status(200).json({
        success: true,
        data: {
          token: newToken,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al renovar token",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
