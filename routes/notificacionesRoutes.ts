import { Router } from "express";
import { z } from "zod";
import NotificacionesController from "../controllers/NotificacionesController";
import { PermissionMiddleware } from "../middleware/permissionMiddleware";
import { authMiddleware } from "../middleware/authMiddleware";
import { validate, validateObjectId } from "../middleware/validation";

const router = Router();

// Middleware de autenticación
router.use(authMiddleware);

/**
 * @route GET /api/notificaciones/usuario/:usuarioId
 * @desc Obtener notificaciones de un usuario
 * @access Authenticated
 */
router.get(
  "/usuario/:usuarioId",
  validateObjectId("usuarioId"),
  NotificacionesController.obtenerPorUsuario
);

/**
 * @route GET /api/notificaciones/estadisticas/:usuarioId
 * @desc Obtener estadísticas de notificaciones de un usuario
 * @access Authenticated
 */
router.get(
  "/estadisticas/:usuarioId",
  validateObjectId("usuarioId"),
  NotificacionesController.obtenerEstadisticas
);

/**
 * @route GET /api/notificaciones/:id
 * @desc Obtener notificación por ID
 * @access Authenticated
 */
router.get("/:id", validateObjectId(), NotificacionesController.obtenerPorId);

/**
 * @route POST /api/notificaciones
 * @desc Crear nueva notificación
 * @access Authenticated
 */
router.post(
  "/",
  validate(
    z.object({
      body: z.object({
        destinatario: z.string(),
        titulo: z.string().min(1),
        mensaje: z.string().min(1),
        tipo: z.enum(["info", "warning", "error", "success"]).optional(),
        prioridad: z.enum(["baja", "normal", "alta"]).optional(),
      }),
    })
  ),
  NotificacionesController.crear
);

/**
 * @route POST /api/notificaciones/masiva
 * @desc Crear notificación masiva
 * @access Admin only
 */
router.post(
  "/masiva",
  PermissionMiddleware.requireRole(["admin"]),
  validate(
    z.object({
      body: z.object({
        destinatarios: z.array(z.string()).min(1),
        titulo: z.string().min(1),
        mensaje: z.string().min(1),
        tipo: z.enum(["info", "warning", "error", "success"]).optional(),
        prioridad: z.enum(["baja", "normal", "alta"]).optional(),
      }),
    })
  ),
  NotificacionesController.crearMasiva
);

/**
 * @route PUT /api/notificaciones/:id/marcar-leida
 * @desc Marcar notificación como leída
 * @access Authenticated
 */
router.put(
  "/:id/marcar-leida",
  validateObjectId(),
  NotificacionesController.marcarComoLeida
);

/**
 * @route PUT /api/notificaciones/marcar-todas-leidas/:usuarioId
 * @desc Marcar todas las notificaciones como leídas
 * @access Authenticated
 */
router.put(
  "/marcar-todas-leidas/:usuarioId",
  validateObjectId("usuarioId"),
  NotificacionesController.marcarTodasComoLeidas
);

/**
 * @route DELETE /api/notificaciones/:id
 * @desc Eliminar notificación
 * @access Authenticated
 */
router.delete("/:id", validateObjectId(), NotificacionesController.eliminar);

export default router;
