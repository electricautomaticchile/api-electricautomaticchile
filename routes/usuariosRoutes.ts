import { Router } from 'express';
import { UsuariosController } from '../controllers/UsuariosController';

const router = Router();
const usuariosController = new UsuariosController();

// Rutas de usuarios
router.get('/', usuariosController.obtenerTodos);
router.get('/:id', usuariosController.obtenerPorId);
router.post('/', usuariosController.crear);
router.put('/:id', usuariosController.actualizar);
router.delete('/:id', usuariosController.eliminar);

export default router; 