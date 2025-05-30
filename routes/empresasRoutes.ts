import { Router } from 'express';
import { EmpresasController } from '../controllers/EmpresasController';

const router = Router();
const empresasController = new EmpresasController();

// Rutas de empresas
router.get('/', empresasController.obtenerTodos);
router.get('/estadisticas', empresasController.obtenerEstadisticas);
router.get('/buscar/:termino', empresasController.buscar);
router.get('/:id', empresasController.obtenerPorId);
router.post('/', empresasController.crear);
router.put('/:id', empresasController.actualizar);
router.put('/:id/estado', empresasController.cambiarEstado);
router.delete('/:id', empresasController.eliminar);

export default router; 