import { Router } from 'express';
import { DocumentosController } from '../controllers/DocumentosController';

const router = Router();
const documentosController = new DocumentosController();

// Rutas de documentos
router.get('/', documentosController.obtenerTodos);
router.get('/estadisticas', documentosController.obtenerEstadisticas);
router.get('/entidad/:tipo/:id', documentosController.obtenerPorEntidad);
router.get('/:id', documentosController.obtenerPorId);
router.post('/', documentosController.crear);
router.post('/upload', documentosController.subirArchivo);
router.put('/:id', documentosController.actualizar);
router.delete('/:id', documentosController.eliminar);

export default router; 