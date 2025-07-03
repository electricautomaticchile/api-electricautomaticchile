import RecoveryToken from "../../models/RecoveryToken";
import { sendRecoveryEmail } from "../../lib/email/emailService";

export class AuthRecoveryService {
  // Procesar solicitud de recuperación
  static async procesarSolicitudRecuperacion(
    emailOrNumeroCliente: string
  ): Promise<{ enviado: boolean; mensaje: string }> {
    const { AuthUserService } = await import("./AuthUserService");

    try {
      const usuarioEncontrado =
        await AuthUserService.buscarUsuarioParaRecuperacion(
          emailOrNumeroCliente
        );

      // Por seguridad, siempre responder exitoso aunque no se encuentre el usuario
      if (!usuarioEncontrado) {
        console.log(
          "⚠️ Usuario no encontrado, pero respondiendo exitoso por seguridad"
        );
        return {
          enviado: true,
          mensaje:
            "Si el email/número existe, recibirás un enlace de recuperación",
        };
      }

      const { usuario, tipo } = usuarioEncontrado;

      console.log("✅ Usuario encontrado:", {
        numeroCliente: usuario.numeroCliente,
        nombre: usuario.nombre || usuario.nombreEmpresa,
        tipoUsuario: tipo,
      });

      // Verificar estado para empresas
      if (tipo === "empresa" && usuario.estado !== "activo") {
        console.log(
          "⚠️ Empresa inactiva, pero respondiendo exitoso por seguridad"
        );
        return {
          enviado: true,
          mensaje:
            "Si el email/número existe, recibirás un enlace de recuperación",
        };
      }

      // Crear token de recuperación
      const token = await RecoveryToken.crearToken(
        usuario.correo,
        usuario.numeroCliente,
        tipo as "cliente" | "empresa" | "superadmin",
        usuario._id
      );

      // Crear URL de recuperación
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const recoveryUrl = `${baseUrl}/auth/reset-password?token=${token}`;

      // Enviar email
      await sendRecoveryEmail(
        usuario.correo,
        usuario.nombre || usuario.nombreEmpresa,
        usuario.numeroCliente,
        tipo,
        recoveryUrl
      );

      console.log("✅ Email de recuperación enviado exitosamente");

      return {
        enviado: true,
        mensaje:
          "Si el email/número existe, recibirás un enlace de recuperación",
      };
    } catch (error) {
      console.error("💥 Error en solicitud de recuperación:", error);
      // En caso de error, también responder exitoso por seguridad
      return {
        enviado: true,
        mensaje:
          "Si el email/número existe, recibirás un enlace de recuperación",
      };
    }
  }

  // Procesar restablecimiento de contraseña
  static async procesarRestablecimiento(
    token: string,
    nuevaPassword: string
  ): Promise<{ exito: boolean; mensaje: string; data?: any }> {
    const { AuthPasswordService } = await import("./AuthPasswordService");

    try {
      // Validar token
      const recoveryToken = await RecoveryToken.validarToken(token);
      if (!recoveryToken) {
        console.log("❌ Token inválido o expirado");
        return {
          exito: false,
          mensaje:
            "Token inválido o expirado. Solicita un nuevo enlace de recuperación.",
        };
      }

      console.log("✅ Token válido para usuario:", {
        numeroCliente: recoveryToken.numeroCliente,
        tipoUsuario: recoveryToken.tipoUsuario,
      });

      // Validar nueva contraseña
      const validacionPassword =
        AuthPasswordService.validarPassword(nuevaPassword);
      if (!validacionPassword.valida) {
        return {
          exito: false,
          mensaje: validacionPassword.mensaje || "Contraseña inválida",
        };
      }

      const { AuthUserService } = await import("./AuthUserService");

      // Buscar usuario según el tipo - convertir ObjectId a string
      const usuario = await AuthUserService.buscarUsuarioConPassword(
        recoveryToken.usuarioId.toString(),
        recoveryToken.tipoUsuario
      );

      if (!usuario) {
        console.log("❌ Usuario no encontrado");
        return {
          exito: false,
          mensaje: "Usuario no encontrado",
        };
      }

      // Actualizar contraseña
      await AuthPasswordService.cambiarPassword(
        usuario,
        nuevaPassword,
        recoveryToken.tipoUsuario
      );

      // Marcar token como usado
      recoveryToken.usado = true;
      await recoveryToken.save();

      console.log("✅ Contraseña restablecida exitosamente");

      return {
        exito: true,
        mensaje: "Contraseña restablecida exitosamente",
        data: {
          numeroCliente: usuario.numeroCliente,
          tipoUsuario: recoveryToken.tipoUsuario,
        },
      };
    } catch (error) {
      console.error("💥 Error al restablecer contraseña:", error);
      return {
        exito: false,
        mensaje: "Error interno del servidor",
      };
    }
  }
}
