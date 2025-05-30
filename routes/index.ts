import { Router } from 'express';
import authRoutes from './authRoutes';
import usuariosRoutes from './usuariosRoutes';
import clientesRoutes from './clientesRoutes';
import cotizacionesRoutes from './cotizacionesRoutes';
import documentosRoutes from './documentosRoutes';
import mensajesRoutes from './mensajesRoutes';
import notificacionesRoutes from './notificacionesRoutes';
import empresasRoutes from './empresasRoutes';

export const router = Router();

// Rutas principales
router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/clientes', clientesRoutes);
router.use('/cotizaciones', cotizacionesRoutes);
router.use('/documentos', documentosRoutes);
router.use('/mensajes', mensajesRoutes);
router.use('/notificaciones', notificacionesRoutes);
router.use('/empresas', empresasRoutes);

// Ruta de información de la API
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Electric Automatic Chile',
    version: '1.0.0',
    description: 'API para gestión de cotizaciones eléctricas y servicios automatizados',
    endpoints: {
      auth: '/api/auth',
      usuarios: '/api/usuarios',
      clientes: '/api/clientes',
      cotizaciones: '/api/cotizaciones',
      documentos: '/api/documentos',
      mensajes: '/api/mensajes',
      notificaciones: '/api/notificaciones',
      empresas: '/api/empresas'
    },
    features: [
      'Sistema de autenticación completo',
      'Gestión de cotizaciones con estados',
      'Sistema de mensajería interno',
      'Notificaciones push y en tiempo real',
      'Gestión de documentos y archivos',
      'Administración de empresas y clientes',
      'API RESTful con paginación y filtros'
    ]
  });
}); 