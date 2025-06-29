import { Router } from "express";
import { EmpresasController } from "../controllers/EmpresasController";

const router = Router();
const empresasController = new EmpresasController();

// Rutas de empresas
router.get("/", empresasController.obtenerTodas);
router.get("/estadisticas", empresasController.obtenerEstadisticas);
router.get("/:id", empresasController.obtenerPorId);
router.post("/", empresasController.crear);
router.put("/:id", empresasController.actualizar);
router.delete("/:id", empresasController.eliminar);
router.put("/:id/cambiar-estado", empresasController.cambiarEstado);
router.post("/:id/resetear-password", empresasController.resetearPassword);

export default router;
