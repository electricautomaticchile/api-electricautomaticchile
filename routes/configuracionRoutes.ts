import { Router } from "express";
import { ConfiguracionController } from "../controllers/ConfiguracionController";

const router = Router();

// Obtener configuraciones por categoría
router.get("/", ConfiguracionController.obtenerConfiguraciones);

// Obtener categorías disponibles
router.get("/categorias", ConfiguracionController.obtenerCategorias);

// Obtener una configuración específica
router.get("/:clave", ConfiguracionController.obtenerConfiguracion);

// Establecer una configuración
router.post("/", ConfiguracionController.establecerConfiguracion);

// Actualizar múltiples configuraciones
router.put("/batch", ConfiguracionController.actualizarConfiguraciones);

// Inicializar configuraciones por defecto
router.post(
  "/inicializar",
  ConfiguracionController.inicializarConfiguracionesPorDefecto
);

// Eliminar configuración
router.delete("/:clave", ConfiguracionController.eliminarConfiguracion);

export default router;
