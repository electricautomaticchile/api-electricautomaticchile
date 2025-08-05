import { Router } from "express";
import DispositivosController from "../controllers/DispositivosController";
import {
  validate,
  validationSchemas,
  validateObjectId,
} from "../middleware/validation";

const router = Router();

// Rutas para dispositivos
router.get(
  "/",
  validate(validationSchemas.paginacion),
  DispositivosController.obtenerDispositivos
);

router.get("/inactivos", DispositivosController.obtenerDispositivosInactivos);

router.get(
  "/estadisticas-consumo/:clienteId",
  validateObjectId("clienteId"),
  DispositivosController.obtenerEstadisticasConsumo
);

router.get(
  "/:id",
  validateObjectId(),
  DispositivosController.obtenerDispositivo
);

router.post(
  "/",
  validate(validationSchemas.crearDispositivo),
  DispositivosController.crearDispositivo
);

router.put(
  "/:id",
  validateObjectId(),
  DispositivosController.actualizarDispositivo
);

router.delete(
  "/:id",
  validateObjectId(),
  DispositivosController.eliminarDispositivo
);

// Rutas para lecturas
router.post(
  "/:id/lecturas",
  validateObjectId(),
  validate(validationSchemas.nuevaMedicion),
  DispositivosController.agregarLectura
);

// Rutas para alertas
router.post(
  "/:id/alertas",
  validateObjectId(),
  DispositivosController.crearAlerta
);

router.put(
  "/:id/alertas/:alertaId/resolver",
  validateObjectId(),
  DispositivosController.resolverAlerta
);

router.post(
  "/:id/control",
  validateObjectId(),
  DispositivosController.controlarDispositivo
);

export default router;
