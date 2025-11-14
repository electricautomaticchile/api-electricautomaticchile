import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import Cliente from "../models/Cliente";
import Empresa from "../models/Empresa";

// Extender la interfaz Request para incluir información del usuario
// Nota: La interfaz ya está extendida en authMiddleware.ts

export interface DevicePermission {
  deviceId: string;
  userId: string;
  userRole: string;
  action: "read" | "control" | "configure" | "delete";
}

export class PermissionMiddleware {
  /**
   * Middleware para validar acceso a dispositivos basado en rol
   */
  static validateDeviceAccess(
    requiredAction: "read" | "control" | "configure" | "delete" = "read"
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user;
        if (!user) {
          return res.status(401).json({
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Usuario no autenticado",
            },
            timestamp: new Date().toISOString(),
          });
        }

        const deviceId = req.params.id || req.params.deviceId;

        // Superadmin tiene acceso completo
        if (user.role === "superadmin") {
          return next();
        }

        // Validar acceso específico por rol
        const hasAccess = await PermissionMiddleware.checkDevicePermission({
          deviceId,
          userId: user.id,
          userRole: user.role,
          action: requiredAction,
        });

        if (!hasAccess) {
          logger.warn(
            `Acceso denegado a dispositivo ${deviceId} para usuario ${user.id}`,
            "PermissionMiddleware"
          );
          return res.status(403).json({
            success: false,
            error: {
              code: "PERMISSION_DENIED",
              message: "No tienes permisos para acceder a este dispositivo",
            },
            timestamp: new Date().toISOString(),
          });
        }

        next();
      } catch (error) {
        logger.error("Error en validación de permisos:", error);
        res.status(500).json({
          success: false,
          error: {
            code: "PERMISSION_CHECK_FAILED",
            message: "Error interno al validar permisos",
          },
          timestamp: new Date().toISOString(),
        });
      }
    };
  }

  /**
   * Middleware para validar rol específico
   */
  static requireRole(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Usuario no autenticado",
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (!allowedRoles.includes(user.role)) {
        logger.warn(
          `Acceso denegado por rol. Usuario: ${user.id}, Rol: ${user.role}, Requerido: ${allowedRoles.join(", ")}`,
          "PermissionMiddleware"
        );
        return res.status(403).json({
          success: false,
          error: {
            code: "INSUFFICIENT_ROLE",
            message: "No tienes el rol necesario para esta acción",
          },
          timestamp: new Date().toISOString(),
        });
      }

      return next();
    };
  }

  /**
   * Filtrar dispositivos según permisos del usuario
   */
  static async filterDevicesByRole(
    devices: any[],
    userRole: string,
    userId: string
  ): Promise<any[]> {
    if (userRole === "superadmin") {
      return devices; // Superadmin ve todos
    }

    if (userRole === "empresa") {
      // Empresa ve solo dispositivos de sus clientes asignados
      const empresa =
        await Empresa.findById(userId).populate("clientesAsignados");
      if (!empresa) return [];

      const clientesIds =
        empresa.clientesAsignados?.map((c: any) => c._id.toString()) || [];
      return devices.filter((device) =>
        clientesIds.includes(
          device.cliente?.toString() || device.cliente?._id?.toString()
        )
      );
    }

    if (userRole === "cliente") {
      // Cliente ve solo sus propios dispositivos
      return devices.filter(
        (device) =>
          device.cliente?.toString() === userId ||
          device.cliente?._id?.toString() === userId
      );
    }

    return [];
  }

  /**
   * Verificar permisos específicos sobre un dispositivo
   */
  static async checkDevicePermission(
    permission: DevicePermission
  ): Promise<boolean> {
    const { deviceId, userId, userRole, action } = permission;

    try {
      // Importar aquí para evitar dependencias circulares
      const Dispositivo = (await import("../models/Dispositivo")).default;

      const device = await Dispositivo.findById(deviceId).populate("cliente");
      if (!device) {
        return false; // Dispositivo no existe
      }

      switch (userRole) {
        case "superadmin":
          return true; // Superadmin puede todo

        case "empresa":
          // Verificar si el dispositivo pertenece a un cliente asignado a esta empresa
          const empresa =
            await Empresa.findById(userId).populate("clientesAsignados");
          if (!empresa) return false;

          const clientesIds =
            empresa.clientesAsignados?.map((c: any) => c._id.toString()) || [];
          const deviceClienteId =
            (device as any).clienteAsignado?._id?.toString() ||
            (device as any).clienteAsignado?.toString();

          if (!clientesIds.includes(deviceClienteId)) {
            return false; // Dispositivo no asignado a esta empresa
          }

          // Empresas tienen control limitado
          return ["read", "control"].includes(action);

        case "cliente":
          // Verificar si el dispositivo pertenece a este cliente
          const deviceClienteId2 =
            (device as any).clienteAsignado?._id?.toString() ||
            (device as any).clienteAsignado?.toString();
          if (deviceClienteId2 !== userId) {
            return false; // No es su dispositivo
          }

          // Clientes solo pueden leer y control básico
          return ["read", "control"].includes(action);

        default:
          return false;
      }
    } catch (error) {
      logger.error("Error verificando permisos de dispositivo:", error);
      return false;
    }
  }

  /**
   * Validar permisos para comandos de control
   */
  static async validateCommandPermissions(
    command: any,
    userRole: string,
    userId: string
  ): Promise<boolean> {
    const { deviceId, command: commandType } = command;

    // Comandos críticos solo para superadmin
    const criticalCommands = [
      "reset",
      "configure",
      "update_firmware",
      "factory_reset",
    ];
    if (criticalCommands.includes(commandType) && userRole !== "superadmin") {
      return false;
    }

    // Verificar acceso al dispositivo
    return await PermissionMiddleware.checkDevicePermission({
      deviceId,
      userId,
      userRole,
      action: "control",
    });
  }

  /**
   * Middleware para rate limiting por rol
   */
  static rateLimitByRole() {
    const rateLimits = new Map<string, { count: number; resetTime: number }>();
    const limits = {
      superadmin: { requests: 1000, window: 60000 }, // 1000 req/min
      empresa: { requests: 500, window: 60000 }, // 500 req/min
      cliente: { requests: 100, window: 60000 }, // 100 req/min
    };

    return (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      if (!user) return next();

      const key = `${user.role}:${user.id}`;
      const now = Date.now();
      const userLimit =
        limits[user.role as keyof typeof limits] || limits.cliente;

      let userRate = rateLimits.get(key);
      if (!userRate || now > userRate.resetTime) {
        userRate = { count: 0, resetTime: now + userLimit.window };
        rateLimits.set(key, userRate);
      }

      userRate.count++;

      if (userRate.count > userLimit.requests) {
        return res.status(429).json({
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Demasiadas solicitudes. Intenta más tarde.",
          },
          timestamp: new Date().toISOString(),
        });
      }

      next();
    };
  }
}

export default PermissionMiddleware;
