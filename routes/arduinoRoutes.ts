import { Router } from "express";
import { ArduinoController } from "../controllers/ArduinoController";
import { validate, validationSchemas } from "../middleware/validation";

const router = Router();

// Rutas para control de Arduino
router.get("/status", ArduinoController.obtenerEstado);

router.post("/connect", ArduinoController.conectar);

router.post("/disconnect", ArduinoController.desconectar);

router.post("/control/:action", ArduinoController.enviarComando);

router.get("/stats/:empresaId", ArduinoController.obtenerEstadisticas);

router.get("/export/:empresaId", ArduinoController.exportarDatos);

// Rutas para gestión de dispositivos Arduino específicos
router.get("/devices/:empresaId", ArduinoController.obtenerDispositivosEmpresa);

router.post(
  "/devices/:empresaId/register",
  ArduinoController.registrarDispositivo
);

router.put(
  "/devices/:deviceId/configure",
  ArduinoController.configurarDispositivo
);

export default router;
