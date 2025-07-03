import { Router } from "express";
import { AlertasController } from "../controllers/AlertasController";
import {
  validate,
  validationSchemas,
  validateObjectId,
} from "../middleware/validation";

const router = Router();

// Rutas para obtener alertas
router.get(
  "/",
  validate(validationSchemas.paginacion),
  AlertasController.obtenerAlertas
);

router.get("/activas", AlertasController.obtenerAlertasActivas);

router.get(
  "/empresa/:empresaId",
  validateObjectId("empresaId"),
  AlertasController.obtenerAlertasPorEmpresa
);

router.get(
  "/resumen/:empresaId",
  validateObjectId("empresaId"),
  AlertasController.obtenerResumenAlertas
);

router.get("/:id", validateObjectId(), AlertasController.obtenerAlerta);

// Rutas para gestionar alertas
router.post(
  "/",
  validate(validationSchemas.crearAlerta),
  AlertasController.crearAlerta
);

router.put(
  "/:id/resolver",
  validateObjectId(),
  AlertasController.resolverAlerta
);

router.put("/:id/asignar", validateObjectId(), AlertasController.asignarAlerta);

router.delete("/:id", validateObjectId(), AlertasController.eliminarAlerta);

// Rutas específicas para simulación (desarrollo)
router.post("/simular", AlertasController.simularAlerta);

router.post("/simular-batch", AlertasController.simularAlertasBatch);

export default router;
