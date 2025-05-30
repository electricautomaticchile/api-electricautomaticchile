import { Router } from 'express';
import { ClientesController } from '../controllers/ClientesController';

export const clientesRouter = Router();
const clientesController = new ClientesController();

// GET /api/clientes - Obtener todos los clientes
clientesRouter.get('/', clientesController.obtenerTodos);

// GET /api/clientes/:id - Obtener cliente por ID
clientesRouter.get('/:id', clientesController.obtenerPorId);

// POST /api/clientes - Crear nuevo cliente
clientesRouter.post('/', clientesController.crear);

// PUT /api/clientes/:id - Actualizar cliente
clientesRouter.put('/:id', clientesController.actualizar);

// DELETE /api/clientes/:id - Eliminar cliente
clientesRouter.delete('/:id', clientesController.eliminar); 