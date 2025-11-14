import { Router } from "express";
import { TicketsController } from "../controllers/TicketsController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
const ticketsController = new TicketsController();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de tickets
router.post("/", ticketsController.crear.bind(ticketsController));
router.get("/", ticketsController.obtenerTodos.bind(ticketsController));
router.get(
  "/estadisticas",
  ticketsController.obtenerEstadisticas.bind(ticketsController)
);
router.get("/:id", ticketsController.obtenerPorId.bind(ticketsController));
router.get(
  "/numero/:numeroTicket",
  ticketsController.obtenerPorNumero.bind(ticketsController)
);

// Rutas de actualización
router.post(
  "/:id/respuestas",
  ticketsController.agregarRespuesta.bind(ticketsController)
);
router.put(
  "/:id/estado",
  ticketsController.actualizarEstado.bind(ticketsController)
);
router.put(
  "/:id/prioridad",
  ticketsController.actualizarPrioridad.bind(ticketsController)
);
router.put("/:id/asignar", ticketsController.asignar.bind(ticketsController));

export default router;
