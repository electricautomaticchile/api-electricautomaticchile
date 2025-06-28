import { Request, Response } from "express";
import Usuario, { IUsuario } from "../models/Usuario";
import Cliente from "../models/Cliente";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

export interface ILoginUsuario {
  email: string;
  password: string;
}

export interface IRegistroUsuario {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  tipoUsuario: "empresa" | "cliente";
  empresaId?: string;
}

export class AuthController {
  // POST /api/auth/login
  login = async (req: Request, res: Response): Promise<void> => {
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

      let cliente: any = null;
      let isEmailLogin = false;

      // Primero buscar por número de cliente
      console.log("🔍 Buscando por número de cliente:", email);
      cliente = await Cliente.findOne({ numeroCliente: email }).select(
        "+passwordTemporal +password"
      );
      console.log("👥 Cliente encontrado por número:", cliente ? "SÍ" : "NO");

      // Si no se encuentra, buscar por email
      if (!cliente) {
        console.log("🔍 Buscando por email:", email);
        cliente = await Cliente.findOne({
          correo: email,
        }).select("+passwordTemporal +password");
        console.log("👥 Cliente encontrado por email:", cliente ? "SÍ" : "NO");
        isEmailLogin = true;
      }

      if (!cliente) {
        console.log("❌ Cliente no encontrado");
        res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
        return;
      }

      // Verificar si el cliente está activo
      const isActive =
        cliente.activo !== undefined ? cliente.activo : cliente.esActivo;
      if (!isActive) {
        console.log("❌ Cliente inactivo");
        res.status(401).json({
          success: false,
          message: "Cuenta inactiva",
        });
        return;
      }

      console.log("🔐 Verificando contraseña...");
      console.log("📄 Cliente encontrado:", {
        numeroCliente: cliente.numeroCliente,
        nombre: cliente.nombre,
        correo: cliente.correo,
        role: cliente.role,
      });

      // Debug: Mostrar los campos de contraseña disponibles
      console.log("🔍 Campos de contraseña disponibles:", {
        passwordTemporal: cliente.passwordTemporal,
        password: cliente.password ? "EXISTE" : "NO EXISTE",
        passwordTemporalLength: cliente.passwordTemporal
          ? cliente.passwordTemporal.length
          : "NULL",
        passwordRecibido: password,
        passwordRecibidoLength: password.length,
      });

      // Verificar contraseña - puede estar en passwordTemporal o password
      let passwordValida = false;

      if (cliente.passwordTemporal) {
        // Si hay passwordTemporal, verificar directamente (puede ser texto plano)
        passwordValida = cliente.passwordTemporal === password;
        console.log(
          "🔐 Verificando con passwordTemporal:",
          passwordValida ? "SÍ" : "NO"
        );
        console.log("🔍 Comparación exacta:", {
          clientePassword: `"${cliente.passwordTemporal}"`,
          receivedPassword: `"${password}"`,
          areEqual: cliente.passwordTemporal === password,
        });
      } else if (cliente.password) {
        // Si hay password hasheado, usar bcrypt
        const bcrypt = require("bcrypt");
        passwordValida = await bcrypt.compare(password, cliente.password);
        console.log(
          "🔐 Verificando con password hasheado:",
          passwordValida ? "SÍ" : "NO"
        );
      }

      if (!passwordValida) {
        console.log("❌ Contraseña incorrecta");
        res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
        return;
      }

      console.log("✅ Login exitoso para cliente:", cliente.numeroCliente);

      // Actualizar último acceso
      await Cliente.findByIdAndUpdate(cliente._id, {
        ultimoAcceso: new Date(),
      });

      // Determinar el tipo de usuario basado en el role
      let tipoUsuario = "cliente"; // default
      if (cliente.role === "admin" || cliente.role === "superadmin") {
        tipoUsuario = "admin";
      } else if (cliente.role === "empresa") {
        tipoUsuario = "empresa";
      }

      // Generar token JWT con campos estándar
      const token = jwt.sign(
        {
          sub: cliente._id.toString(), // subject - estándar JWT
          userId: cliente._id, // mantener para compatibilidad
          clienteId: cliente._id,
          numeroCliente: cliente.numeroCliente,
          email: cliente.correo,
          tipoUsuario: tipoUsuario,
          role: cliente.role,
        },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "24h" }
      );

      // Generar refresh token
      const refreshToken = jwt.sign(
        {
          sub: cliente._id.toString(), // subject - estándar JWT
          userId: cliente._id, // mantener para compatibilidad
          clienteId: cliente._id,
          type: "refresh",
        },
        process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret",
        { expiresIn: "7d" }
      );

      res.status(200).json({
        success: true,
        message: "Login exitoso",
        data: {
          user: {
            _id: cliente._id,
            nombre: cliente.nombre,
            email: cliente.correo,
            numeroCliente: cliente.numeroCliente,
            tipoUsuario: tipoUsuario,
            role: cliente.role,
            activo: isActive,
            fechaCreacion: cliente.fechaCreacion || cliente.fechaRegistro,
            ultimoAcceso: new Date(),
          },
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
  };

  // POST /api/auth/register
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const datosRegistro: IRegistroUsuario = req.body;

      // Validaciones básicas
      if (
        !datosRegistro.nombre ||
        !datosRegistro.email ||
        !datosRegistro.password
      ) {
        res.status(400).json({
          success: false,
          message: "Nombre, email y contraseña son requeridos",
        });
        return;
      }

      // Verificar email único
      const emailExiste = await Usuario.findByEmail(datosRegistro.email);
      if (emailExiste) {
        res.status(400).json({
          success: false,
          message: "El email ya está registrado",
        });
        return;
      }

      // Crear nuevo usuario
      const nuevoUsuario = new Usuario({
        nombre: datosRegistro.nombre,
        email: datosRegistro.email,
        password: datosRegistro.password,
        telefono: datosRegistro.telefono,
        rol: "cliente", // rol por defecto
        tipoUsuario: datosRegistro.tipoUsuario,
        empresaId: datosRegistro.empresaId
          ? new mongoose.Types.ObjectId(datosRegistro.empresaId)
          : undefined,
        activo: true,
      });

      await nuevoUsuario.save();

      res.status(201).json({
        success: true,
        message: "Usuario registrado exitosamente",
        data: {
          usuario: {
            id: nuevoUsuario._id,
            nombre: nuevoUsuario.nombre,
            email: nuevoUsuario.email,
            tipoUsuario: nuevoUsuario.tipoUsuario,
            rol: nuevoUsuario.rol,
          },
        },
      });
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
          success: false,
          message: "Error de validación",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Error al registrar usuario",
          error: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }
  };

  // POST /api/auth/logout
  logout = (req: Request, res: Response): void => {
    try {
      // En un sistema con JWT sin estado, simplemente confirmamos el logout
      // El token se invalida en el cliente
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
  };

  // GET /api/auth/me
  obtenerPerfilUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        res.status(401).json({
          success: false,
          message: "Token no proporcionado",
        });
        return;
      }

      // Verificar token JWT
      let decoded: any;
      try {
        decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "fallback_secret"
        );
      } catch (jwtError) {
        res.status(401).json({
          success: false,
          message: "Token inválido o expirado",
        });
        return;
      }

      // Usar sub (estándar) o userId (compatibilidad) para encontrar el cliente
      const clienteId = decoded.sub || decoded.userId;
      const cliente = await Cliente.findById(clienteId).select(
        "-password -passwordTemporal"
      );

      if (!cliente) {
        res.status(404).json({
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

      // Determinar el tipo de usuario basado en el role
      let tipoUsuario = "cliente"; // default
      if (cliente.role === "admin" || cliente.role === "superadmin") {
        tipoUsuario = "admin";
      } else if (cliente.role === "empresa") {
        tipoUsuario = "empresa";
      }

      res.status(200).json({
        success: true,
        data: {
          _id: cliente._id,
          nombre: cliente.nombre,
          email: cliente.correo,
          numeroCliente: cliente.numeroCliente,
          telefono: cliente.telefono,
          role: cliente.role,
          tipoUsuario: tipoUsuario,
          activo: isActive,
          fechaCreacion: cliente.fechaCreacion || cliente.fechaRegistro,
          ultimoAcceso: cliente.ultimoAcceso,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener perfil",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // POST /api/auth/refresh-token
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: "Refresh token requerido",
        });
        return;
      }

      // Verificar refresh token
      let decoded: any;
      try {
        decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret"
        );
      } catch (jwtError) {
        res.status(401).json({
          success: false,
          message: "Refresh token inválido",
        });
        return;
      }

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

      // Determinar el tipo de usuario basado en el role
      let tipoUsuario = "cliente"; // default
      if (cliente.role === "admin" || cliente.role === "superadmin") {
        tipoUsuario = "admin";
      } else if (cliente.role === "empresa") {
        tipoUsuario = "empresa";
      }

      // Generar nuevo token con campos estándar
      const newToken = jwt.sign(
        {
          sub: cliente._id.toString(), // subject - estándar JWT
          userId: cliente._id, // mantener para compatibilidad
          clienteId: cliente._id,
          numeroCliente: cliente.numeroCliente,
          email: cliente.correo,
          tipoUsuario: tipoUsuario,
          role: cliente.role,
        },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "24h" }
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
  };
}
