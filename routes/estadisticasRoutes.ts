import { Router } from "express";
import { EstadisticasController } from "../controllers/EstadisticasController";
import { validateObjectId } from "../middleware/validation";

const router = Router();

// Ruta para obtener estadísticas de consumo eléctrico de un cliente específico
router.get(
  "/consumo-electrico/:clienteId",
  validateObjectId("clienteId"),
  EstadisticasController.obtenerConsumoElectrico
);

// Ruta para obtener estadísticas globales (dashboard admin)
router.get(
  "/globales",
  // aquí iría middleware de autenticación y autorización admin
  EstadisticasController.obtenerEstadisticasGlobales
);

export default router;
