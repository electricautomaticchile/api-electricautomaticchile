import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Rutas de autenticación - usando métodos estáticos
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/me", authMiddleware, AuthController.obtenerPerfilUsuario);
router.post("/refresh-token", AuthController.refreshToken);
router.post(
  "/cambiar-password",
  authMiddleware,
  AuthController.cambiarPassword
);

// Rutas de recuperación de contraseña
router.post("/solicitar-recuperacion", AuthController.solicitarRecuperacion);
router.post("/restablecer-password", AuthController.restablecerPassword);

// Nota: El método 'register' no está implementado en la versión refactorizada
// ya que se manejaba desde otros controladores específicos (ClientesController, etc.)

export default router;
