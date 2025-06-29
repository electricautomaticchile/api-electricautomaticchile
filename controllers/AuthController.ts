import { Request, Response } from "express";
import Usuario, { IUsuario } from "../models/Usuario";
import Cliente from "../models/Cliente";
import Superusuario from "../models/Superusuario";
import Empresa from "../models/Empresa";
import RecoveryToken from "../models/RecoveryToken";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { sendRecoveryEmail } from "../lib/email/emailService";

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
      let isSuperusuario = false;
      let isEmpresa = false;
      let isEmailLogin = false;

      // Primero buscar por número de cliente en CLIENTES
      console.log("🔍 Buscando por número de cliente en CLIENTES:", email);
      cliente = await Cliente.findOne({ numeroCliente: email }).select(
        "+passwordTemporal +password"
      );
      console.log("👥 Cliente encontrado por número:", cliente ? "SÍ" : "NO");

      // Si no se encuentra, buscar por email en CLIENTES
      if (!cliente) {
        console.log("🔍 Buscando por email en CLIENTES:", email);
        cliente = await Cliente.findOne({
          correo: email,
        }).select("+passwordTemporal +password");
        console.log("👥 Cliente encontrado por email:", cliente ? "SÍ" : "NO");
        isEmailLogin = true;
      }

      // Si no se encuentra en clientes, buscar en SUPERUSUARIOS
      if (!cliente) {
        console.log(
          "🔍 Buscando por número de cliente en SUPERUSUARIOS:",
          email
        );
        cliente = await Superusuario.findOne({ numeroCliente: email }).select(
          "+password"
        );
        console.log(
          "👥 Superusuario encontrado por número:",
          cliente ? "SÍ" : "NO"
        );

        if (!cliente) {
          console.log("🔍 Buscando por email en SUPERUSUARIOS:", email);
          cliente = await Superusuario.findOne({
            correo: email,
          }).select("+password");
          console.log(
            "👥 Superusuario encontrado por email:",
            cliente ? "SÍ" : "NO"
          );
          isEmailLogin = true;
        }

        if (cliente) {
          isSuperusuario = true;
          console.log("✅ Usuario encontrado en colección SUPERUSUARIOS");
        }
      }

      // Si no se encuentra en clientes ni superusuarios, buscar en EMPRESAS
      if (!cliente) {
        console.log("🔍 Buscando por número de cliente en EMPRESAS:", email);
        cliente = await Empresa.findOne({ numeroCliente: email }).select(
          "+password +passwordVisible"
        );
        console.log("🏢 Empresa encontrada por número:", cliente ? "SÍ" : "NO");

        if (!cliente) {
          console.log("🔍 Buscando por email en EMPRESAS:", email);
          cliente = await Empresa.findOne({
            correo: email,
          }).select("+password +passwordVisible");
          console.log(
            "🏢 Empresa encontrada por email:",
            cliente ? "SÍ" : "NO"
          );
          isEmailLogin = true;
        }

        if (cliente) {
          isEmpresa = true;
          console.log("✅ Usuario encontrado en colección EMPRESAS");
        }
      }

      if (!cliente) {
        console.log("❌ Usuario no encontrado en ninguna colección");
        res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
        return;
      }

      // Verificar estado de la empresa
      if (isEmpresa) {
        console.log("🏢 Verificando estado de empresa:", cliente.estado);

        if (cliente.estado === "suspendido") {
          console.log("❌ Empresa suspendida");
          res.status(403).json({
            success: false,
            message: "Cuenta suspendida",
            data: {
              estado: "suspendido",
              motivo:
                cliente.motivoSuspension ||
                "Cuenta suspendida por el administrador",
              accion: "Contacte al soporte para regularizar su cuenta",
              telefono: "+56 9 1234 5678",
              email: "soporte@electricautomaticchile.com",
            },
          });
          return;
        }

        if (cliente.estado === "inactivo") {
          console.log("❌ Empresa inactiva");
          res.status(403).json({
            success: false,
            message: "Cuenta inactiva",
            data: {
              estado: "inactivo",
              accion: "Debe cambiar su contraseña para reactivar la cuenta",
              requiereCambioPassword: true,
            },
          });
          return;
        }

        if (cliente.estado !== "activo") {
          console.log("❌ Estado de empresa no válido:", cliente.estado);
          res.status(403).json({
            success: false,
            message: "Estado de cuenta no válido",
          });
          return;
        }
      }

      // Verificar si el usuario está activo (para clientes y superusuarios)
      if (!isEmpresa) {
        const isActive = isSuperusuario
          ? cliente.activo
          : cliente.activo !== undefined
            ? cliente.activo
            : cliente.esActivo;
        if (!isActive) {
          console.log("❌ Usuario inactivo");
          res.status(401).json({
            success: false,
            message: "Cuenta inactiva",
          });
          return;
        }
      }

      console.log("🔐 Verificando contraseña...");
      console.log("📄 Usuario encontrado:", {
        numeroCliente: cliente.numeroCliente,
        nombre: cliente.nombre || cliente.nombreEmpresa,
        correo: cliente.correo,
        tipo: isEmpresa
          ? "EMPRESA"
          : isSuperusuario
            ? "SUPERUSUARIO"
            : "CLIENTE",
        estado: isEmpresa ? cliente.estado : "activo",
      });

      // Verificar contraseña
      let passwordValida = false;

      if (isEmpresa) {
        // Las empresas siempre tienen contraseña hasheada
        if (cliente.password) {
          passwordValida = await cliente.compararPassword(password);
          console.log(
            "🔐 Verificando contraseña EMPRESA:",
            passwordValida ? "SÍ" : "NO"
          );
        }
      } else if (isSuperusuario) {
        // Los superusuarios siempre tienen contraseña hasheada
        if (cliente.password) {
          passwordValida = await cliente.compararPassword(password);
          console.log(
            "🔐 Verificando contraseña SUPERUSUARIO:",
            passwordValida ? "SÍ" : "NO"
          );
        }
      } else {
        // Para clientes: verificar passwordTemporal o password
        if (cliente.passwordTemporal) {
          // Si hay passwordTemporal, verificar directamente (puede ser texto plano)
          passwordValida = cliente.passwordTemporal === password;
          console.log(
            "🔐 Verificando con passwordTemporal:",
            passwordValida ? "SÍ" : "NO"
          );
        } else if (cliente.password) {
          // Si hay password hasheado, usar bcrypt
          const bcrypt = require("bcrypt");
          passwordValida = await bcrypt.compare(password, cliente.password);
          console.log(
            "🔐 Verificando con password hasheado:",
            passwordValida ? "SÍ" : "NO"
          );
        }
      }

      if (!passwordValida) {
        console.log("❌ Contraseña incorrecta");
        res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
        return;
      }

      // Determinar el tipo de usuario basado en el tipo
      let tipoUsuario = "cliente"; // default
      if (isEmpresa) {
        tipoUsuario = "empresa";
      } else if (isSuperusuario) {
        tipoUsuario = "superadmin";
      } else if (cliente.role === "admin" || cliente.role === "superadmin") {
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
          role: isEmpresa ? "empresa" : cliente.role,
          estado: isEmpresa ? cliente.estado : "activo",
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

      // Verificar si necesita cambio de contraseña (para empresas)
      if (isEmpresa && cliente.passwordTemporal) {
        console.log(
          "⚠️ Empresa necesita cambiar contraseña temporal - pero permitiendo acceso"
        );
        res.status(200).json({
          success: true,
          message: "Login exitoso - Requiere cambio de contraseña",
          data: {
            requiereCambioPassword: true,
            user: {
              _id: cliente._id,
              nombre: cliente.nombreEmpresa,
              email: cliente.correo,
              numeroCliente: cliente.numeroCliente,
              tipoUsuario: "empresa",
              role: "empresa",
              estado: cliente.estado,
              fechaCreacion: cliente.fechaCreacion || cliente.fechaRegistro,
              ultimoAcceso: new Date(),
            },
            token,
            refreshToken,
          },
        });
        return;
      }

      console.log(
        `✅ Login exitoso para ${isEmpresa ? "EMPRESA" : isSuperusuario ? "SUPERUSUARIO" : "CLIENTE"}:`,
        cliente.numeroCliente
      );

      // Actualizar último acceso
      if (isEmpresa) {
        await Empresa.findByIdAndUpdate(cliente._id, {
          ultimoAcceso: new Date(),
        });
      } else if (isSuperusuario) {
        await Superusuario.findByIdAndUpdate(cliente._id, {
          ultimoAcceso: new Date(),
        });
      } else {
        await Cliente.findByIdAndUpdate(cliente._id, {
          ultimoAcceso: new Date(),
        });
      }

      res.status(200).json({
        success: true,
        message: "Login exitoso",
        data: {
          user: {
            _id: cliente._id,
            nombre: cliente.nombre || cliente.nombreEmpresa,
            email: cliente.correo,
            numeroCliente: cliente.numeroCliente,
            tipoUsuario: tipoUsuario,
            role: isEmpresa ? "empresa" : cliente.role,
            activo: isEmpresa ? cliente.estado === "activo" : true,
            estado: isEmpresa ? cliente.estado : "activo",
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

      // Usar sub (estándar) o userId (compatibilidad) para encontrar el usuario
      const clienteId = decoded.sub || decoded.userId;
      let cliente: any = await Cliente.findById(clienteId).select(
        "-password -passwordTemporal"
      );

      let isSuperusuario = false;

      // Si no se encuentra en clientes, buscar en superusuarios
      if (!cliente) {
        cliente = await Superusuario.findById(clienteId).select("-password");
        if (cliente) {
          isSuperusuario = true;
        }
      }

      if (!cliente) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      // Verificar si está activo
      const isActive = isSuperusuario
        ? cliente.activo
        : cliente.activo !== undefined
          ? cliente.activo
          : cliente.esActivo;
      if (!isActive) {
        res.status(401).json({
          success: false,
          message: "Cuenta inactiva",
        });
        return;
      }

      // Determinar el tipo de usuario basado en el role
      let tipoUsuario = "cliente"; // default
      if (isSuperusuario) {
        tipoUsuario = "superadmin";
      } else if (cliente.role === "admin" || cliente.role === "superadmin") {
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

  // POST /api/auth/cambiar-password
  cambiarPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { passwordActual, passwordNueva } = req.body;
      const token = req.headers.authorization?.replace("Bearer ", "");

      console.log("🔐 Solicitud de cambio de contraseña");

      // Validaciones básicas
      if (!passwordActual || !passwordNueva) {
        res.status(400).json({
          success: false,
          message: "Contraseña actual y nueva contraseña son requeridas",
        });
        return;
      }

      if (passwordNueva.length < 8) {
        res.status(400).json({
          success: false,
          message: "La nueva contraseña debe tener al menos 8 caracteres",
        });
        return;
      }

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

      const userId = decoded.sub || decoded.userId;
      const tipoUsuario = decoded.tipoUsuario;

      console.log("🔍 Cambio de contraseña para:", {
        userId,
        tipoUsuario,
      });

      let usuario: any = null;

      // Buscar usuario según su tipo
      if (tipoUsuario === "empresa") {
        usuario = await Empresa.findById(userId).select("+password");
      } else if (tipoUsuario === "superadmin" || tipoUsuario === "admin") {
        usuario = await Superusuario.findById(userId).select("+password");
      } else {
        usuario = await Cliente.findById(userId).select("+password");
      }

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

      // Actualizar contraseña
      usuario.password = passwordNueva;

      // Para empresas, marcar que ya no es temporal
      if (tipoUsuario === "empresa") {
        usuario.passwordTemporal = false;
        usuario.passwordVisible = passwordNueva; // Guardar para administración
      }

      await usuario.save();

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
  };

  // POST /api/auth/solicitar-recuperacion
  solicitarRecuperacion = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { emailOrNumeroCliente } = req.body;

      console.log("🔐 Solicitud de recuperación para:", emailOrNumeroCliente);

      // Validación básica
      if (!emailOrNumeroCliente) {
        res.status(400).json({
          success: false,
          message: "Email o número de cliente es requerido",
        });
        return;
      }

      const input = emailOrNumeroCliente.trim().toLowerCase();

      let usuario: any = null;
      let tipoUsuario = "";
      let esEmail = input.includes("@");

      console.log("🔍 Buscando usuario:", { input, esEmail });

      // Buscar en todas las colecciones
      if (esEmail) {
        // Buscar por email
        usuario = await Cliente.findOne({ correo: input }).select("+password");
        if (usuario) {
          tipoUsuario = "cliente";
        } else {
          usuario = await Empresa.findOne({ correo: input }).select(
            "+password"
          );
          if (usuario) {
            tipoUsuario = "empresa";
          } else {
            usuario = await Superusuario.findOne({ correo: input }).select(
              "+password"
            );
            if (usuario) {
              tipoUsuario = "superadmin";
            }
          }
        }
      } else {
        // Buscar por número de cliente
        usuario = await Cliente.findOne({ numeroCliente: input }).select(
          "+password"
        );
        if (usuario) {
          tipoUsuario = "cliente";
        } else {
          usuario = await Empresa.findOne({ numeroCliente: input }).select(
            "+password"
          );
          if (usuario) {
            tipoUsuario = "empresa";
          } else {
            usuario = await Superusuario.findOne({
              numeroCliente: input,
            }).select("+password");
            if (usuario) {
              tipoUsuario = "superadmin";
            }
          }
        }
      }

      // Por seguridad, siempre responder exitoso aunque no se encuentre el usuario
      if (!usuario) {
        console.log(
          "⚠️ Usuario no encontrado, pero respondiendo exitoso por seguridad"
        );
        res.status(200).json({
          success: true,
          message:
            "Si el email/número existe, recibirás un enlace de recuperación",
        });
        return;
      }

      console.log("✅ Usuario encontrado:", {
        numeroCliente: usuario.numeroCliente,
        nombre: usuario.nombre || usuario.nombreEmpresa,
        tipoUsuario,
      });

      // Verificar estado para empresas
      if (tipoUsuario === "empresa" && usuario.estado !== "activo") {
        console.log(
          "⚠️ Empresa inactiva, pero respondiendo exitoso por seguridad"
        );
        res.status(200).json({
          success: true,
          message:
            "Si el email/número existe, recibirás un enlace de recuperación",
        });
        return;
      }

      // Crear token de recuperación
      const token = await RecoveryToken.crearToken(
        usuario.correo,
        usuario.numeroCliente,
        tipoUsuario as "cliente" | "empresa" | "superadmin",
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
        tipoUsuario,
        recoveryUrl
      );

      console.log("✅ Email de recuperación enviado exitosamente");

      res.status(200).json({
        success: true,
        message:
          "Si el email/número existe, recibirás un enlace de recuperación",
      });
    } catch (error) {
      console.error("💥 Error en solicitud de recuperación:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // POST /api/auth/restablecer-password
  restablecerPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, nuevaPassword } = req.body;

      console.log("🔐 Solicitud de restablecimiento de contraseña");

      // Validaciones básicas
      if (!token || !nuevaPassword) {
        res.status(400).json({
          success: false,
          message: "Token y nueva contraseña son requeridos",
        });
        return;
      }

      if (nuevaPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: "La nueva contraseña debe tener al menos 8 caracteres",
        });
        return;
      }

      // Validar token
      const recoveryToken = await RecoveryToken.validarToken(token);
      if (!recoveryToken) {
        console.log("❌ Token inválido o expirado");
        res.status(400).json({
          success: false,
          message:
            "Token inválido o expirado. Solicita un nuevo enlace de recuperación.",
        });
        return;
      }

      console.log("✅ Token válido para usuario:", {
        numeroCliente: recoveryToken.numeroCliente,
        tipoUsuario: recoveryToken.tipoUsuario,
      });

      // Buscar usuario según el tipo
      let usuario: any = null;
      if (recoveryToken.tipoUsuario === "cliente") {
        usuario = await Cliente.findById(recoveryToken.usuarioId).select(
          "+password"
        );
      } else if (recoveryToken.tipoUsuario === "empresa") {
        usuario = await Empresa.findById(recoveryToken.usuarioId).select(
          "+password"
        );
      } else if (recoveryToken.tipoUsuario === "superadmin") {
        usuario = await Superusuario.findById(recoveryToken.usuarioId).select(
          "+password"
        );
      }

      if (!usuario) {
        console.log("❌ Usuario no encontrado");
        res.status(400).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      // Actualizar contraseña
      usuario.password = nuevaPassword;

      // Para empresas, marcar que ya no es temporal
      if (recoveryToken.tipoUsuario === "empresa") {
        usuario.passwordTemporal = false;
        usuario.passwordVisible = nuevaPassword; // Guardar para administración
      }

      await usuario.save();

      // Marcar token como usado
      recoveryToken.usado = true;
      await recoveryToken.save();

      console.log("✅ Contraseña restablecida exitosamente");

      res.status(200).json({
        success: true,
        message: "Contraseña restablecida exitosamente",
        data: {
          numeroCliente: usuario.numeroCliente,
          tipoUsuario: recoveryToken.tipoUsuario,
        },
      });
    } catch (error) {
      console.error("💥 Error al restablecer contraseña:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
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
