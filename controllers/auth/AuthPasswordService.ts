import bcrypt from "bcrypt";

export class AuthPasswordService {
  // Verificar contraseña según el tipo de usuario
  static async verificarPassword(
    usuario: any,
    password: string,
    tipo: string
  ): Promise<boolean> {
    console.log("🔐 Verificando contraseña...");

    if (tipo === "empresa" || tipo === "superadmin") {
      // Empresas y superusuarios siempre tienen contraseña hasheada
      if (usuario.password) {
        const esValida = await usuario.compararPassword(password);
        console.log(
          `🔐 Verificando contraseña ${tipo.toUpperCase()}:`,
          esValida ? "SÍ" : "NO"
        );
        return esValida;
      }
    } else {
      // Para clientes: verificar passwordTemporal o password
      if (usuario.passwordTemporal) {
        // Si hay passwordTemporal, verificar directamente (puede ser texto plano)
        const esValida = usuario.passwordTemporal === password;
        console.log(
          "🔐 Verificando con passwordTemporal:",
          esValida ? "SÍ" : "NO"
        );
        return esValida;
      } else if (usuario.password) {
        // Si hay password hasheado, usar bcrypt
        const esValida = await bcrypt.compare(password, usuario.password);
        console.log(
          "🔐 Verificando con password hasheado:",
          esValida ? "SÍ" : "NO"
        );
        return esValida;
      }
    }

    return false;
  }

  // Cambiar contraseña de usuario
  static async cambiarPassword(
    usuario: any,
    nuevaPassword: string,
    tipo: string
  ): Promise<void> {
    // Actualizar contraseña
    usuario.password = nuevaPassword;

    // Para empresas, marcar que ya no es temporal
    if (tipo === "empresa") {
      usuario.passwordTemporal = false;
      usuario.passwordVisible = nuevaPassword; // Guardar para administración
    }

    await usuario.save();
  }

  // Validar fortaleza de contraseña
  static validarPassword(password: string): {
    valida: boolean;
    mensaje?: string;
  } {
    if (!password) {
      return { valida: false, mensaje: "La contraseña es requerida" };
    }

    if (password.length < 8) {
      return {
        valida: false,
        mensaje: "La contraseña debe tener al menos 8 caracteres",
      };
    }

    // Aquí se pueden agregar más validaciones
    // - Al menos una mayúscula
    // - Al menos un número
    // - Al menos un carácter especial
    // etc.

    return { valida: true };
  }

  // Generar contraseña temporal
  static generarPasswordTemporal(): string {
    const caracteres =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let resultado = "";
    for (let i = 0; i < 12; i++) {
      resultado += caracteres.charAt(
        Math.floor(Math.random() * caracteres.length)
      );
    }
    return resultado;
  }
}
