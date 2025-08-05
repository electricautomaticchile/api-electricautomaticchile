import { Router } from "express";
import { z } from "zod";
import LeadMagnetController from "../controllers/LeadMagnetController";
import { PermissionMiddleware } from "../middleware/permissionMiddleware";
import { validate } from "../middleware/validation";

const router = Router();

/**
 * @route POST /api/lead-magnet/enviar-pdf
 * @desc Enviar PDF de lead magnet
 * @access Public
 */
router.post(
  "/enviar-pdf",
  validate(
    z.object({
      body: z.object({
        email: z.string().email(),
        nombre: z.string().min(2),
        empresa: z.string().optional(),
        telefono: z.string().optional(),
      }),
    })
  ),
  LeadMagnetController.enviarPDFLeadMagnet
);

/**
 * @route GET /api/lead-magnet/test-s3
 * @desc Test S3 connection
 * @access Admin only
 */
router.get(
  "/test-s3",
  PermissionMiddleware.requireRole(["admin"]),
  LeadMagnetController.testS3Connection
);

/**
 * @route GET /api/lead-magnet/estadisticas-leads
 * @desc Obtener estadísticas de leads
 * @access Admin only
 */
router.get(
  "/estadisticas-leads",
  PermissionMiddleware.requireRole(["admin"]),
  validate(
    z.object({
      query: z.object({
        periodo: z.enum(["7d", "30d", "90d", "12m"]).optional(),
      }),
    })
  ),
  LeadMagnetController.obtenerEstadisticasLeads
);

/**
 * @route GET /api/lead-magnet/leads
 * @desc Obtener lista de leads
 * @access Admin only
 */
router.get(
  "/leads",
  PermissionMiddleware.requireRole(["admin"]),
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
        sort: z.enum(["fechaCreacion", "nombre", "email"]).optional(),
        order: z.enum(["asc", "desc"]).optional(),
      }),
    })
  ),
  LeadMagnetController.obtenerLeads
);

export default router;
