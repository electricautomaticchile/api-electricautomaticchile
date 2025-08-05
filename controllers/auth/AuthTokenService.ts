import jwt from "jsonwebtoken";
import { IUsuarioToken, IAuthUser } from "./types";

export class AuthTokenService {
  // Generar token de acceso
  static generarTokenAcceso(usuario: IUsuarioToken, tipo: string): string {
    // Determinar el tipo de usuario basado en el tipo
    let tipoUsuario = "cliente";
    if (tipo === "empresa") {
      tipoUsuario = "empresa";
    } else if (tipo === "superadmin") {
      tipoUsuario = "superadmin";
    } else if (usuario.role === "admin" || usuario.role === "superadmin") {
      tipoUsuario = "admin";
    } else if (usuario.role === "empresa") {
      tipoUsuario = "empresa";
    }

    const payload = {
      sub: usuario._id.toString(), // subject - estándar JWT
      userId: usuario._id, // mantener para compatibilidad
      clienteId: usuario._id,
      numeroCliente: usuario.numeroCliente,
      email: usuario.correo,
      tipoUsuario: tipoUsuario,
      role: tipo === "empresa" ? "empresa" : usuario.role,
      estado: tipo === "empresa" ? usuario.estado : "activo",
    };

    return jwt.sign(payload, process.env.JWT_SECRET || "fallback_secret", {
      expiresIn: "24h",
    });
  }

  // Generar refresh token
  static generarRefreshToken(usuario: IUsuarioToken): string {
    const payload = {
      sub: usuario._id.toString(), // subject - estándar JWT
      userId: usuario._id, // mantener para compatibilidad
      clienteId: usuario._id,
      type: "refresh",
    };

    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret",
      { expiresIn: "7d" }
    );
  }

  // Verificar refresh token
  static verificarRefreshToken(refreshToken: string): {
    valido: boolean;
    decoded?: any;
    error?: string;
  } {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret"
      );

      return { valido: true, decoded };
    } catch (error) {
      return {
        valido: false,
        error: error instanceof Error ? error.message : "Token inválido",
      };
    }
  }

  // Verificar token de acceso
  static verificarTokenAcceso(token: string): {
    valido: boolean;
    decoded?: IAuthUser;
    error?: string;
  } {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback_secret"
      ) as IAuthUser;

      return { valido: true, decoded };
    } catch (error) {
      return {
        valido: false,
        error: error instanceof Error ? error.message : "Token inválido",
      };
    }
  }

  // Formatear usuario para respuesta
  static formatearUsuarioRespuesta(usuario: any, tipo: string): IUsuarioToken {
    return {
      _id: usuario._id,
      nombre: usuario.nombre || usuario.nombreEmpresa,
      correo: usuario.correo,
      email: usuario.correo,
      numeroCliente: usuario.numeroCliente,
      telefono: usuario.telefono,
      // Asegurar que role y type sean consistentes para el frontend
      role: tipo === "empresa" ? "empresa" : tipo === "superadmin" ? "admin" : usuario.role || "cliente",
      // Asegurar que tipoUsuario y type sean consistentes
      tipoUsuario: tipo === "empresa" ? "empresa" : tipo === "superadmin" ? "admin" : "cliente",
      // Agregar campo type para compatibilidad con el frontend
      type: tipo === "empresa" ? "empresa" : tipo === "superadmin" ? "admin" : "cliente",
      activo: tipo === "empresa" ? usuario.estado === "activo" : true,
      estado: tipo === "empresa" ? usuario.estado : "activo",
      fechaCreacion: usuario.fechaCreacion || usuario.fechaRegistro,
      ultimoAcceso: new Date(),
    };
  }
}
