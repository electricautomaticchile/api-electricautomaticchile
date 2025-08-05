import { Router } from "express";
import { z } from "zod";
import AdminDispositivosController from "../controllers/AdminDispositivosController";
import { PermissionMiddleware } from "../middleware/permissionMiddleware";
import { validate } from "../middleware/validation";

const router = Router();

// Middleware para verificar que solo superadmin puede acceder
router.use(PermissionMiddleware.requireRole(["superadmin"]));

// Middleware de rate limiting
router.use(PermissionMiddleware.rateLimitByRole());

/**
 * @route GET /api/admin/dispositivos/global-stats
 * @desc Obtener estadísticas globales del sistema
 * @access Superadmin only
 */
router.get(
  "/global-stats",
  AdminDispositivosController.obtenerEstadisticasGlobales
);

/**
 * @route GET /api/admin/dispositivos/all-devices
 * @desc Obtener todos los dispositivos del sistema con filtros
 * @access Superadmin only
 */
router.get(
  "/all-devices",
  AdminDispositivosController.obtenerTodosDispositivos
);

/**
 * @route POST /api/admin/dispositivos/bulk-control
 * @desc Control masivo de dispositivos
 * @access Superadmin only
 */
router.post(
  "/bulk-control",
  validate(
    z.object({
      body: z.object({
        deviceIds: z.array(z.string()).min(1).max(100),
        command: z.enum([
          "on",
          "off",
          "reset",
          "restart",
          "configure",
          "update_firmware",
        ]),
        parameters: z.record(z.any()).optional(),
      }),
    })
  ),
  AdminDispositivosController.controlMasivo
);

/**
 * @route GET /api/admin/dispositivos/connection-status
 * @desc Obtener estado de conexión de todos los dispositivos
 * @access Superadmin only
 */
router.get(
  "/connection-status",
  AdminDispositivosController.obtenerEstadoConexion
);

/**
 * @route GET /api/admin/dispositivos/performance-metrics
 * @desc Obtener métricas de rendimiento del sistema
 * @access Superadmin only
 */
router.get(
  "/performance-metrics",
  validate(
    z.object({
      query: z.object({
        periodo: z.enum(["1h", "24h", "7d", "30d"]).optional(),
      }),
    })
  ),
  AdminDispositivosController.obtenerMetricasRendimiento
);

/**
 * @route GET /api/admin/dispositivos/analytics/consumption-trends
 * @desc Obtener tendencias de consumo globales
 * @access Superadmin only
 */
router.get(
  "/analytics/consumption-trends",
  validate(
    z.object({
      query: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        granularity: z.enum(["hour", "day", "week", "month"]).optional(),
        deviceIds: z.string().optional(),
        hardwareTypes: z.string().optional(),
      }),
    })
  ),
  AdminDispositivosController.obtenerTendenciasConsumo
);

/**
 * @route GET /api/admin/dispositivos/analytics/alerts
 * @desc Obtener estadísticas de alertas globales
 * @access Superadmin only
 */
router.get(
  "/analytics/alerts",
  AdminDispositivosController.obtenerEstadisticasAlertas
);

/**
 * @route GET /api/admin/dispositivos/analytics/commands
 * @desc Obtener estadísticas de comandos globales
 * @access Superadmin only
 */
router.get(
  "/analytics/commands",
  AdminDispositivosController.obtenerEstadisticasComandos
);

export default router;
