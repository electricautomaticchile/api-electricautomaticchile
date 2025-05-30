import { Router } from 'express';
import { usuariosRouter } from './usuarios';
import { productosRouter } from './productos';
import { ventasRouter } from './ventas';
import { clientesRouter } from './clientes';

export const router = Router();

// Rutas principales
router.use('/usuarios', usuariosRouter);
router.use('/productos', productosRouter);
router.use('/ventas', ventasRouter);
router.use('/clientes', clientesRouter);

// Ruta de información de la API
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Electric Automatic Chile',
    version: '1.0.0',
    endpoints: {
      usuarios: '/api/usuarios',
      productos: '/api/productos',
      ventas: '/api/ventas',
      clientes: '/api/clientes'
    }
  });
}); 