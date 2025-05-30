import { Router } from 'express';
import { VentasController } from '../controllers/VentasController';

export const ventasRouter = Router();
const ventasController = new VentasController();

// GET /api/ventas - Obtener todas las ventas
ventasRouter.get('/', ventasController.obtenerTodos);

// GET /api/ventas/:id - Obtener venta por ID
ventasRouter.get('/:id', ventasController.obtenerPorId);

// POST /api/ventas - Crear nueva venta
ventasRouter.post('/', ventasController.crear);

// PUT /api/ventas/:id - Actualizar venta
ventasRouter.put('/:id', ventasController.actualizar);

// DELETE /api/ventas/:id - Eliminar venta
ventasRouter.delete('/:id', ventasController.eliminar); 