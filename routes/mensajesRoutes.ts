import { Router } from 'express';
import { MensajesController } from '../controllers/MensajesController';

const router = Router();
const mensajesController = new MensajesController();

// Rutas de mensajes
router.get('/', mensajesController.obtenerTodos);
router.get('/bandeja/:usuarioId', mensajesController.obtenerBandejaUsuario);
router.get('/conversacion/:usuario1/:usuario2', mensajesController.obtenerConversacion);
router.get('/estadisticas/:usuarioId', mensajesController.obtenerEstadisticas);
router.get('/:id', mensajesController.obtenerPorId);
router.post('/', mensajesController.crear);
router.put('/:id/marcar-leido', mensajesController.marcarComoLeido);
router.put('/marcar-todos-leidos/:usuarioId', mensajesController.marcarTodosComoLeidos);

export default router; 