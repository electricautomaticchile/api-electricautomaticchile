import { Router } from 'express';
import { UsuariosController } from '../controllers/UsuariosController';

export const usuariosRouter = Router();
const usuariosController = new UsuariosController();

// GET /api/usuarios - Obtener todos los usuarios
usuariosRouter.get('/', usuariosController.obtenerTodos);

// GET /api/usuarios/:id - Obtener usuario por ID
usuariosRouter.get('/:id', usuariosController.obtenerPorId);

// POST /api/usuarios - Crear nuevo usuario
usuariosRouter.post('/', usuariosController.crear);

// PUT /api/usuarios/:id - Actualizar usuario
usuariosRouter.put('/:id', usuariosController.actualizar);

// DELETE /api/usuarios/:id - Eliminar usuario
usuariosRouter.delete('/:id', usuariosController.eliminar); 