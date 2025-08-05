import { Router } from "express";
import { z } from "zod";
import MensajesController from "../controllers/MensajesController";
import { PermissionMiddleware } from "../middleware/permissionMiddleware";
import { authMiddleware } from "../middleware/authMiddleware";
import { validate, validateObjectId } from "../middleware/validation";

const router = Router();

// Middleware de autenticación
router.use(authMiddleware);

/**
 * @route GET /api/mensajes/bandeja/:usuarioId
 * @desc Obtener bandeja de mensajes de un usuario
 * @access Authenticated
 */
router.get(
  "/bandeja/:usuarioId",
  validateObjectId("usuarioId"),
  MensajesController.obtenerBandejaUsuario
);

/**
 * @route GET /api/mensajes/conversacion/:usuario1/:usuario2
 * @desc Obtener conversación entre dos usuarios
 * @access Authenticated
 */
router.get(
  "/conversacion/:usuario1/:usuario2",
  MensajesController.obtenerConversacion
);

/**
 * @route GET /api/mensajes/estadisticas/:usuarioId
 * @desc Obtener estadísticas de mensajes de un usuario
 * @access Authenticated
 */
router.get(
  "/estadisticas/:usuarioId",
  validateObjectId("usuarioId"),
  MensajesController.obtenerEstadisticas
);

/**
 * @route GET /api/mensajes/:id
 * @desc Obtener mensaje por ID
 * @access Authenticated
 */
router.get("/:id", validateObjectId(), MensajesController.obtenerPorId);

/**
 * @route POST /api/mensajes
 * @desc Crear nuevo mensaje
 * @access Authenticated
 */
router.post(
  "/",
  validate(
    z.object({
      body: z.object({
        destinatario: z.string(),
        asunto: z.string().min(1),
        contenido: z.string().min(1),
        prioridad: z.enum(["baja", "normal", "alta"]).optional(),
      }),
    })
  ),
  MensajesController.crear
);

/**
 * @route PUT /api/mensajes/:id/marcar-leido
 * @desc Marcar mensaje como leído
 * @access Authenticated
 */
router.put(
  "/:id/marcar-leido",
  validateObjectId(),
  MensajesController.marcarComoLeido
);

/**
 * @route PUT /api/mensajes/marcar-todos-leidos/:usuarioId
 * @desc Marcar todos los mensajes como leídos
 * @access Authenticated
 */
router.put(
  "/marcar-todos-leidos/:usuarioId",
  validateObjectId("usuarioId"),
  MensajesController.marcarTodosComoLeidos
);

export default router;
