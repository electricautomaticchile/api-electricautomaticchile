import { Router } from "express";
import { z } from "zod";
import ClienteDispositivosController from "../controllers/ClienteDispositivosController";
import { PermissionMiddleware } from "../middleware/permissionMiddleware";
import { validate, validateObjectId } from "../middleware/validation";

const router = Router();

// Middleware para verificar que solo clientes pueden acceder
router.use(PermissionMiddleware.requireRole(["cliente"]));

/**
 * @route GET /api/cliente/dispositivos/mis-dispositivos
 * @desc Obtener dispositivos del cliente con filtros
 * @access Cliente only
 */
router.get(
  "/mis-dispositivos",
  validate(
    z.object({
      query: z.object({
        page: z
          .string()
          .regex(/^[1-9]\d*$/)
          .optional(),
        limit: z
          .string()
          .regex(/^[1-9]\d*$/)
          .optional(),
        sort: z
          .enum(["fechaCreacion", "nombre", "lastSeen", "power"])
          .optional(),
        order: z.enum(["asc", "desc"]).optional(),
        estado: z.enum(["activo", "inactivo", "mantenimiento"]).optional(),
        connectionStatus: z
          .enum(["connected", "disconnected", "reconnecting"])
          .optional(),
      }),
    })
  ),
  ClienteDispositivosController.obtenerMisDispositivos
);

/**
 * @route GET /api/cliente/dispositivos/consumo-personal
 * @desc Obtener consumo personal del cliente
 * @access Cliente only
 */
router.get(
  "/consumo-personal",
  validate(
    z.object({
      query: z.object({
        periodo: z.enum(["24h", "7d", "30d", "12m"]).optional(),
      }),
    })
  ),
  ClienteDispositivosController.obtenerConsumoPersonal
);

/**
 * @route PUT /api/cliente/dispositivos/:id/control-basico
 * @desc Control básico de dispositivos (solo on/off)
 * @access Cliente only
 */
router.put(
  "/:id/control-basico",
  validateObjectId(),
  PermissionMiddleware.validateDeviceAccess("control"),
  validate(
    z.object({
      body: z.object({
        command: z.enum(["on", "off"]),
        parameters: z.record(z.any()).optional(),
      }),
    })
  ),
  ClienteDispositivosController.controlBasico
);

/**
 * @route GET /api/cliente/dispositivos/alertas-personales
 * @desc Obtener alertas personales del cliente
 * @access Cliente only
 */
router.get(
  "/alertas-personales",
  validate(
    z.object({
      query: z.object({
        estado: z.enum(["activa", "resuelta", "todas"]).optional(),
        prioridad: z.enum(["baja", "media", "alta", "critica"]).optional(),
      }),
    })
  ),
  ClienteDispositivosController.obtenerAlertasPersonales
);

/**
 * @route GET /api/cliente/dispositivos/resumen-personal
 * @desc Obtener resumen personal del cliente
 * @access Cliente only
 */
router.get(
  "/resumen-personal",
  ClienteDispositivosController.obtenerResumenPersonal
);

/**
 * @route GET /api/cliente/dispositivos/historial-consumo
 * @desc Obtener historial de consumo del cliente
 * @access Cliente only
 */
router.get(
  "/historial-consumo",
  validate(
    z.object({
      query: z.object({
        periodo: z.enum(["7d", "30d", "90d", "12m"]).optional(),
        granularidad: z.enum(["hora", "dia", "semana", "mes"]).optional(),
      }),
    })
  ),
  ClienteDispositivosController.obtenerHistorialConsumo
);

/**
 * @route GET /api/cliente/dispositivos/predicciones-personales
 * @desc Obtener predicciones personales de consumo
 * @access Cliente only
 */
router.get(
  "/predicciones-personales",
  validate(
    z.object({
      query: z.object({
        horizonte: z.enum(["7d", "30d", "90d"]).optional(),
      }),
    })
  ),
  ClienteDispositivosController.obtenerPrediccionesPersonales
);

/**
 * @route GET /api/cliente/dispositivos/metricas-eficiencia
 * @desc Obtener métricas de eficiencia del cliente
 * @access Cliente only
 */
router.get(
  "/metricas-eficiencia",
  ClienteDispositivosController.obtenerMetricasEficiencia
);

export default router;
