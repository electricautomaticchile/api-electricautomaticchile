import { Router } from 'express';
import { ProductosController } from '../controllers/ProductosController';

export const productosRouter = Router();
const productosController = new ProductosController();

// GET /api/productos - Obtener todos los productos
productosRouter.get('/', productosController.obtenerTodos);

// GET /api/productos/:id - Obtener producto por ID
productosRouter.get('/:id', productosController.obtenerPorId);

// POST /api/productos - Crear nuevo producto
productosRouter.post('/', productosController.crear);

// PUT /api/productos/:id - Actualizar producto
productosRouter.put('/:id', productosController.actualizar);

// DELETE /api/productos/:id - Eliminar producto
productosRouter.delete('/:id', productosController.eliminar); 