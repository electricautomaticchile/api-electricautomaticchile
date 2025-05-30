import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

// Rutas de autenticación
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.get('/me', authController.obtenerPerfilUsuario);
router.post('/refresh-token', authController.refreshToken);

export default router; 