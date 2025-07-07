import { Router } from "express";
import { SuperusuariosController } from "../controllers/SuperusuariosController";

const router = Router();
const superusuariosController = new SuperusuariosController();

// Rutas de superusuarios
router.get("/", superusuariosController.obtenerTodos);
router.post("/", superusuariosController.crear);
router.put("/:id", superusuariosController.actualizar);
router.get("/estadisticas", superusuariosController.obtenerEstadisticas);

export default router;
