import { Router } from 'express';
import { ClientesController } from '../controllers/ClientesController';

const router = Router();
const clientesController = new ClientesController();

// Rutas de clientes
router.get('/', clientesController.obtenerTodos);
router.get('/:id', clientesController.obtenerPorId);
router.post('/', clientesController.crear);
router.put('/:id', clientesController.actualizar);
router.delete('/:id', clientesController.eliminar);

export default router; 