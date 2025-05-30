import { Router } from 'express';
import { NotificacionesController } from '../controllers/NotificacionesController';

const router = Router();
const notificacionesController = new NotificacionesController();

// Rutas de notificaciones
router.get('/', notificacionesController.obtenerTodos);
router.get('/usuario/:usuarioId', notificacionesController.obtenerPorUsuario);
router.get('/estadisticas/:usuarioId', notificacionesController.obtenerEstadisticas);
router.get('/:id', notificacionesController.obtenerPorId);
router.post('/', notificacionesController.crear);
router.post('/masiva', notificacionesController.crearMasiva);
router.put('/:id/marcar-leida', notificacionesController.marcarComoLeida);
router.put('/marcar-todas-leidas/:usuarioId', notificacionesController.marcarTodasComoLeidas);
router.delete('/:id', notificacionesController.eliminar);

export default router; 