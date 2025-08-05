import { Router } from "express";
import EmpresasController from "../controllers/EmpresasController";

const router = Router();

// Rutas de empresas
router.get("/", EmpresasController.obtenerTodos);
router.get("/estadisticas", EmpresasController.obtenerEstadisticas);
router.get("/:id", EmpresasController.obtenerPorId);
router.post("/", EmpresasController.crear);
router.put("/:id", EmpresasController.actualizar);
router.delete("/:id", EmpresasController.eliminar);
router.put("/:id/cambiar-estado", EmpresasController.cambiarEstado);
router.post("/:id/resetear-password", EmpresasController.resetearPassword);

export default router;
