import { Router } from "express";
import { LeadMagnetController } from "../controllers/LeadMagnetController";
import { validate, validationSchemas } from "../middleware/validation";

const router = Router();

// Ruta pública para enviar PDF lead magnet
router.post(
  "/enviar-pdf",
  validate(validationSchemas.leadMagnet),
  LeadMagnetController.enviarPDFLeadMagnet
);

// Ruta de prueba para verificar S3 (solo en desarrollo)
router.get("/test-s3", LeadMagnetController.testS3Connection);

// Rutas protegidas para dashboard admin (requieren autenticación)
router.get(
  "/estadisticas",
  // aquí iría middleware de autenticación y autorización admin
  LeadMagnetController.obtenerEstadisticasLeads
);

router.get(
  "/leads",
  // aquí iría middleware de autenticación y autorización admin
  validate(validationSchemas.paginacion),
  LeadMagnetController.obtenerLeads
);

export default router;
