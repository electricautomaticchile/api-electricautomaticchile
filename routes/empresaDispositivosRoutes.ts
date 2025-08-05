import { Router } from "express";
import { z } from "zod";
import EmpresaDispositivosController from "../controllers/EmpresaDispositivosController";
import { PermissionMiddleware } from "../middleware/permissionMiddleware";
import { validate, validateObjectId } from "../middleware/validation";

const router = Router();

// Middleware para verificar que solo empresas pueden acceder
router.use(PermissionMiddleware.requireRole(["empresa"]));

/**
 * @route GET /api/empresa/dispositivos/mis-clientes
 * @desc Obtener dispositivos de los clientes que gestiona la empresa
 * @access Empresa only
 */
router.get(
  "/mis-clientes",
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
        clienteId: z.string().optional(),
      }),
    })
  ),
  EmpresaDispositivosController.obtenerDispositivosMisClientes
);

/**
 * @route GET /api/empresa/dispositivos/stats-por-cliente
 * @desc Obtener estadísticas por cliente que gestiona la empresa
 * @access Empresa only
 */
router.get(
  "/stats-por-cliente",
  EmpresaDispositivosController.obtenerEstadisticasPorCliente
);

/**
 * @route POST /api/empresa/dispositivos/:id/control-limitado
 * @desc Control limitado de dispositivos (on/off/reset)
 * @access Empresa only
 */
router.post(
  "/:id/control-limitado",
  validateObjectId(),
  PermissionMiddleware.validateDeviceAccess("control"),
  validate(
    z.object({
      body: z.object({
        command: z.enum(["on", "off", "reset", "status"]),
        parameters: z.record(z.any()).optional(),
      }),
    })
  ),
  EmpresaDispositivosController.controlLimitado
);

/**
 * @route GET /api/empresa/dispositivos/alertas-mis-dispositivos
 * @desc Obtener alertas de los dispositivos que gestiona la empresa
 * @access Empresa only
 */
router.get(
  "/alertas-mis-dispositivos",
  validate(
    z.object({
      query: z.object({
        estado: z.enum(["activa", "resuelta", "todas"]).optional(),
        prioridad: z.enum(["baja", "media", "alta", "critica"]).optional(),
        clienteId: z.string().optional(),
      }),
    })
  ),
  EmpresaDispositivosController.obtenerAlertasMisDispositivos
);

/**
 * @route GET /api/empresa/dispositivos/resumen-estado
 * @desc Obtener resumen del estado de dispositivos de la empresa
 * @access Empresa only
 */
router.get(
  "/resumen-estado",
  EmpresaDispositivosController.obtenerResumenEstado
);

/**
 * @route GET /api/empresa/dispositivos/tendencias-consumo
 * @desc Obtener tendencias de consumo de los clientes de la empresa
 * @access Empresa only
 */
router.get(
  "/tendencias-consumo",
  validate(
    z.object({
      query: z.object({
        periodo: z.enum(["7d", "30d", "90d", "12m"]).optional(),
        granularidad: z.enum(["hora", "dia", "semana", "mes"]).optional(),
        clienteId: z.string().optional(),
      }),
    })
  ),
  EmpresaDispositivosController.obtenerTendenciasConsumo
);

/**
 * @route GET /api/empresa/dispositivos/predicciones-consumo
 * @desc Obtener predicciones de consumo para los clientes de la empresa
 * @access Empresa only
 */
router.get(
  "/predicciones-consumo",
  validate(
    z.object({
      query: z.object({
        horizonte: z.enum(["7d", "30d", "90d"]).optional(),
        clienteId: z.string().optional(),
      }),
    })
  ),
  EmpresaDispositivosController.obtenerPrediccionesConsumo
);

export default router;
