import Cliente from "../../models/Cliente";
import Empresa from "../../models/Empresa";
import Superusuario from "../../models/Superusuario";

export interface IUsuarioEncontrado {
  usuario: any;
  tipo: "cliente" | "empresa" | "superadmin";
  isEmailLogin: boolean;
}

export class AuthUserService {
  // Buscar usuario por email o número de cliente en todas las colecciones
  static async buscarUsuarioPorCredencial(
    credencial: string
  ): Promise<IUsuarioEncontrado | null> {
    const esEmail = credencial.includes("@");
    let usuario: any = null;
    let tipo: "cliente" | "empresa" | "superadmin" | null = null;

    console.log(
      `🔍 Buscando usuario: ${credencial} (${esEmail ? "email" : "número"})`
    );

    if (esEmail) {
      // Buscar por email
      usuario = await Cliente.findOne({ correo: credencial }).select(
        "+passwordTemporal +password"
      );
      if (usuario) {
        tipo = "cliente";
        console.log("👥 Cliente encontrado por email");
      } else {
        usuario = await Empresa.findOne({ correo: credencial }).select(
          "+password +passwordVisible"
        );
        if (usuario) {
          tipo = "empresa";
          console.log("🏢 Empresa encontrada por email");
        } else {
          usuario = await Superusuario.findOne({ correo: credencial }).select(
            "+password"
          );
          if (usuario) {
            tipo = "superadmin";
            console.log("👑 Superusuario encontrado por email");
          }
        }
      }
    } else {
      // Buscar por número de cliente
      usuario = await Cliente.findOne({ numeroCliente: credencial }).select(
        "+passwordTemporal +password"
      );
      if (usuario) {
        tipo = "cliente";
        console.log("👥 Cliente encontrado por número");
      } else {
        usuario = await Empresa.findOne({ numeroCliente: credencial }).select(
          "+password +passwordVisible"
        );
        if (usuario) {
          tipo = "empresa";
          console.log("🏢 Empresa encontrada por número");
        } else {
          usuario = await Superusuario.findOne({
            numeroCliente: credencial,
          }).select("+password");
          if (usuario) {
            tipo = "superadmin";
            console.log("👑 Superusuario encontrado por número");
          }
        }
      }
    }

    if (!usuario || !tipo) {
      console.log("❌ Usuario no encontrado en ninguna colección");
      return null;
    }

    return {
      usuario,
      tipo,
      isEmailLogin: esEmail,
    };
  }

  // Buscar usuario por ID y tipo para obtener perfil
  static async buscarUsuarioPorId(
    userId: string,
    tipoUsuario: string
  ): Promise<any | null> {
    const camposAExcluir = "-password -passwordTemporal -passwordVisible";

    switch (tipoUsuario) {
      case "empresa":
        return await Empresa.findById(userId).select(camposAExcluir);
      case "superadmin":
      case "admin":
        return await Superusuario.findById(userId).select(camposAExcluir);
      case "cliente":
        return await Cliente.findById(userId).select(camposAExcluir);
      default:
        return null;
    }
  }

  // Buscar usuario con contraseña para operaciones de cambio/recuperación
  static async buscarUsuarioConPassword(
    userId: string,
    tipoUsuario: string
  ): Promise<any | null> {
    switch (tipoUsuario) {
      case "empresa":
        return await Empresa.findById(userId).select("+password");
      case "superadmin":
      case "admin":
        return await Superusuario.findById(userId).select("+password");
      case "cliente":
        return await Cliente.findById(userId).select("+password");
      default:
        return null;
    }
  }

  // Buscar usuario para recuperación de contraseña
  static async buscarUsuarioParaRecuperacion(
    emailOrNumero: string
  ): Promise<IUsuarioEncontrado | null> {
    const input = emailOrNumero.trim().toLowerCase();
    const esEmail = input.includes("@");
    let usuario: any = null;
    let tipo: "cliente" | "empresa" | "superadmin" | null = null;

    console.log("🔍 Buscando usuario para recuperación:", { input, esEmail });

    if (esEmail) {
      // Buscar por email
      usuario = await Cliente.findOne({ correo: input }).select("+password");
      if (usuario) {
        tipo = "cliente";
      } else {
        usuario = await Empresa.findOne({ correo: input }).select("+password");
        if (usuario) {
          tipo = "empresa";
        } else {
          usuario = await Superusuario.findOne({ correo: input }).select(
            "+password"
          );
          if (usuario) {
            tipo = "superadmin";
          }
        }
      }
    } else {
      // Buscar por número de cliente
      usuario = await Cliente.findOne({ numeroCliente: input }).select(
        "+password"
      );
      if (usuario) {
        tipo = "cliente";
      } else {
        usuario = await Empresa.findOne({ numeroCliente: input }).select(
          "+password"
        );
        if (usuario) {
          tipo = "empresa";
        } else {
          usuario = await Superusuario.findOne({ numeroCliente: input }).select(
            "+password"
          );
          if (usuario) {
            tipo = "superadmin";
          }
        }
      }
    }

    if (!usuario || !tipo) {
      return null;
    }

    return {
      usuario,
      tipo,
      isEmailLogin: esEmail,
    };
  }

  // Verificar estado del usuario
  static verificarEstadoUsuario(
    usuario: any,
    tipo: string
  ): { valido: boolean; mensaje?: string; data?: any } {
    if (tipo === "empresa") {
      if (usuario.estado === "suspendido") {
        return {
          valido: false,
          mensaje: "Cuenta suspendida",
          data: {
            estado: "suspendido",
            motivo:
              usuario.motivoSuspension ||
              "Cuenta suspendida por el administrador",
            accion: "Contacte al soporte para regularizar su cuenta",
            telefono: "+56 9 1234 5678",
            email: "soporte@electricautomaticchile.com",
          },
        };
      }

      if (usuario.estado === "inactivo") {
        return {
          valido: false,
          mensaje: "Cuenta inactiva",
          data: {
            estado: "inactivo",
            accion: "Debe cambiar su contraseña para reactivar la cuenta",
            requiereCambioPassword: true,
          },
        };
      }

      if (usuario.estado !== "activo") {
        return {
          valido: false,
          mensaje: "Estado de cuenta no válido",
        };
      }
    } else {
      // Para clientes y superusuarios
      const isActive =
        usuario.activo !== undefined ? usuario.activo : usuario.esActivo;
      if (!isActive) {
        return {
          valido: false,
          mensaje: "Cuenta inactiva",
        };
      }
    }

    return { valido: true };
  }

  // Actualizar último acceso
  static async actualizarUltimoAcceso(
    usuarioId: string,
    tipo: string
  ): Promise<void> {
    const fecha = new Date();

    switch (tipo) {
      case "empresa":
        await Empresa.findByIdAndUpdate(usuarioId, { ultimoAcceso: fecha });
        break;
      case "superadmin":
        await Superusuario.findByIdAndUpdate(usuarioId, {
          ultimoAcceso: fecha,
        });
        break;
      case "cliente":
        await Cliente.findByIdAndUpdate(usuarioId, { ultimoAcceso: fecha });
        break;
    }
  }
}
