import { Request, Response } from 'express';
import { INotificacion, ICrearNotificacion, IActualizarNotificacion, INotificacionMasiva } from '../models/Notificacion';

// Simulamos una base de datos en memoria
let notificaciones: INotificacion[] = [
  {
    id: 1,
    usuarioId: 1,
    titulo: 'Nueva cotización recibida',
    mensaje: 'Se ha recibido una nueva solicitud de cotización.',
    tipo: 'cotizacion',
    prioridad: 'media',
    leida: false,
    accion: {
      texto: 'Ver cotización',
      url: '/cotizaciones/1',
      tipo: 'link'
    },
    entidadRelacionada: {
      tipo: 'cotizacion',
      id: 1
    },
    fechaCreacion: new Date()
  }
];

let nextId = 2;

export class NotificacionesController {
  // GET /api/notificaciones
  obtenerTodos = (req: Request, res: Response): void => {
    try {
      const { usuarioId, tipo, leida, prioridad, limite, pagina } = req.query;
      
      let notificacionesFiltradas = [...notificaciones];

      // Filtros
      if (usuarioId) {
        notificacionesFiltradas = notificacionesFiltradas.filter(n => n.usuarioId === Number(usuarioId));
      }
      if (tipo) {
        notificacionesFiltradas = notificacionesFiltradas.filter(n => n.tipo === tipo);
      }
      if (leida !== undefined) {
        notificacionesFiltradas = notificacionesFiltradas.filter(n => n.leida === (leida === 'true'));
      }
      if (prioridad) {
        notificacionesFiltradas = notificacionesFiltradas.filter(n => n.prioridad === prioridad);
      }

      // Filtrar notificaciones expiradas
      const ahora = new Date();
      notificacionesFiltradas = notificacionesFiltradas.filter(n => 
        !n.fechaExpiracion || n.fechaExpiracion > ahora
      );

      // Ordenar por fecha más reciente y prioridad
      notificacionesFiltradas.sort((a, b) => {
        const prioridadOrden = { 'urgente': 4, 'alta': 3, 'media': 2, 'baja': 1 };
        const prioridadA = prioridadOrden[a.prioridad] || 1;
        const prioridadB = prioridadOrden[b.prioridad] || 1;
        
        if (prioridadA !== prioridadB) {
          return prioridadB - prioridadA; // Mayor prioridad primero
        }
        return b.fechaCreacion.getTime() - a.fechaCreacion.getTime(); // Más reciente primero
      });

      // Paginación
      const limitNum = limite ? Number(limite) : 10;
      const paginaNum = pagina ? Number(pagina) : 1;
      const offset = (paginaNum - 1) * limitNum;
      const notificacionesPaginadas = notificacionesFiltradas.slice(offset, offset + limitNum);

      res.status(200).json({
        success: true,
        data: notificacionesPaginadas,
        meta: {
          total: notificacionesFiltradas.length,
          pagina: paginaNum,
          limite: limitNum,
          totalPaginas: Math.ceil(notificacionesFiltradas.length / limitNum),
          noLeidas: notificacionesFiltradas.filter(n => !n.leida).length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener notificaciones',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // GET /api/notificaciones/usuario/:usuarioId
  obtenerPorUsuario = (req: Request, res: Response): void => {
    try {
      const usuarioId = parseInt(req.params.usuarioId);
      const { incluirLeidas = 'true', limite, pagina } = req.query;
      
      let notificacionesUsuario = notificaciones.filter(n => n.usuarioId === usuarioId);
      
      // Filtrar leídas si se solicita
      if (incluirLeidas === 'false') {
        notificacionesUsuario = notificacionesUsuario.filter(n => !n.leida);
      }

      // Filtrar notificaciones expiradas
      const ahora = new Date();
      notificacionesUsuario = notificacionesUsuario.filter(n => 
        !n.fechaExpiracion || n.fechaExpiracion > ahora
      );

      // Ordenar por prioridad y fecha
      notificacionesUsuario.sort((a, b) => {
        const prioridadOrden = { 'urgente': 4, 'alta': 3, 'media': 2, 'baja': 1 };
        const prioridadA = prioridadOrden[a.prioridad] || 1;
        const prioridadB = prioridadOrden[b.prioridad] || 1;
        
        if (prioridadA !== prioridadB) {
          return prioridadB - prioridadA;
        }
        return b.fechaCreacion.getTime() - a.fechaCreacion.getTime();
      });

      // Paginación
      const limitNum = limite ? Number(limite) : 10;
      const paginaNum = pagina ? Number(pagina) : 1;
      const offset = (paginaNum - 1) * limitNum;
      const notificacionesPaginadas = notificacionesUsuario.slice(offset, offset + limitNum);

      res.status(200).json({
        success: true,
        data: notificacionesPaginadas,
        meta: {
          total: notificacionesUsuario.length,
          pagina: paginaNum,
          limite: limitNum,
          totalPaginas: Math.ceil(notificacionesUsuario.length / limitNum),
          noLeidas: notificacionesUsuario.filter(n => !n.leida).length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener notificaciones del usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // GET /api/notificaciones/:id
  obtenerPorId = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const notificacion = notificaciones.find(n => n.id === id);
      
      if (!notificacion) {
        res.status(404).json({
          success: false,
          message: 'Notificación no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: notificacion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener notificación',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // POST /api/notificaciones
  crear = (req: Request, res: Response): void => {
    try {
      const datosNotificacion: ICrearNotificacion = req.body;
      
      // Validaciones básicas
      if (!datosNotificacion.usuarioId || !datosNotificacion.titulo || !datosNotificacion.mensaje) {
        res.status(400).json({
          success: false,
          message: 'Usuario, título y mensaje son requeridos'
        });
        return;
      }

      const nuevaNotificacion: INotificacion = {
        id: nextId++,
        ...datosNotificacion,
        tipo: datosNotificacion.tipo || 'info',
        prioridad: datosNotificacion.prioridad || 'media',
        leida: false,
        fechaCreacion: new Date()
      };

      notificaciones.push(nuevaNotificacion);

      res.status(201).json({
        success: true,
        message: 'Notificación creada exitosamente',
        data: nuevaNotificacion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear notificación',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // POST /api/notificaciones/masiva
  crearMasiva = (req: Request, res: Response): void => {
    try {
      const datosNotificacion: INotificacionMasiva = req.body;
      
      // Validaciones básicas
      if (!datosNotificacion.tiposUsuario || !datosNotificacion.titulo || !datosNotificacion.mensaje) {
        res.status(400).json({
          success: false,
          message: 'Tipos de usuario, título y mensaje son requeridos'
        });
        return;
      }

      // En un escenario real, aquí buscarías todos los usuarios que coincidan con los criterios
      // Por ahora, simularemos que se envía a algunos usuarios
      const usuariosDestino = [1, 2, 3]; // IDs de usuarios ejemplo
      
      const notificacionesCreadas: INotificacion[] = [];

      usuariosDestino.forEach(usuarioId => {
        const nuevaNotificacion: INotificacion = {
          id: nextId++,
          usuarioId,
          titulo: datosNotificacion.titulo,
          mensaje: datosNotificacion.mensaje,
          tipo: datosNotificacion.tipo || 'sistema',
          prioridad: datosNotificacion.prioridad || 'media',
          leida: false,
          accion: datosNotificacion.accion,
          fechaExpiracion: datosNotificacion.fechaExpiracion,
          fechaCreacion: new Date()
        };

        notificaciones.push(nuevaNotificacion);
        notificacionesCreadas.push(nuevaNotificacion);
      });

      res.status(201).json({
        success: true,
        message: `${notificacionesCreadas.length} notificaciones creadas exitosamente`,
        data: {
          cantidad: notificacionesCreadas.length,
          notificaciones: notificacionesCreadas
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear notificación masiva',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // PUT /api/notificaciones/:id/marcar-leida
  marcarComoLeida = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const notificacionIndex = notificaciones.findIndex(n => n.id === id);
      
      if (notificacionIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Notificación no encontrada'
        });
        return;
      }

      notificaciones[notificacionIndex].leida = true;
      notificaciones[notificacionIndex].fechaLectura = new Date();
      notificaciones[notificacionIndex].fechaActualizacion = new Date();

      res.status(200).json({
        success: true,
        message: 'Notificación marcada como leída',
        data: notificaciones[notificacionIndex]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al marcar notificación como leída',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // PUT /api/notificaciones/marcar-todas-leidas/:usuarioId
  marcarTodasComoLeidas = (req: Request, res: Response): void => {
    try {
      const usuarioId = parseInt(req.params.usuarioId);
      
      let notificacionesActualizadas = 0;
      const fechaActual = new Date();

      notificaciones.forEach((notificacion, index) => {
        if (notificacion.usuarioId === usuarioId && !notificacion.leida) {
          notificaciones[index].leida = true;
          notificaciones[index].fechaLectura = fechaActual;
          notificaciones[index].fechaActualizacion = fechaActual;
          notificacionesActualizadas++;
        }
      });

      res.status(200).json({
        success: true,
        message: `${notificacionesActualizadas} notificaciones marcadas como leídas`,
        data: { notificacionesActualizadas }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al marcar todas las notificaciones como leídas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // DELETE /api/notificaciones/:id
  eliminar = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const notificacionIndex = notificaciones.findIndex(n => n.id === id);
      
      if (notificacionIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Notificación no encontrada'
        });
        return;
      }

      notificaciones.splice(notificacionIndex, 1);

      res.status(200).json({
        success: true,
        message: 'Notificación eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar notificación',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // GET /api/notificaciones/estadisticas/:usuarioId
  obtenerEstadisticas = (req: Request, res: Response): void => {
    try {
      const usuarioId = parseInt(req.params.usuarioId);
      
      const notificacionesUsuario = notificaciones.filter(n => n.usuarioId === usuarioId);
      const notificacionesNoLeidas = notificacionesUsuario.filter(n => !n.leida);

      const estadisticasPorTipo = {
        info: notificacionesUsuario.filter(n => n.tipo === 'info').length,
        success: notificacionesUsuario.filter(n => n.tipo === 'success').length,
        warning: notificacionesUsuario.filter(n => n.tipo === 'warning').length,
        error: notificacionesUsuario.filter(n => n.tipo === 'error').length,
        cotizacion: notificacionesUsuario.filter(n => n.tipo === 'cotizacion').length,
        venta: notificacionesUsuario.filter(n => n.tipo === 'venta').length,
        mensaje: notificacionesUsuario.filter(n => n.tipo === 'mensaje').length,
        sistema: notificacionesUsuario.filter(n => n.tipo === 'sistema').length
      };

      const estadisticasPorPrioridad = {
        baja: notificacionesUsuario.filter(n => n.prioridad === 'baja').length,
        media: notificacionesUsuario.filter(n => n.prioridad === 'media').length,
        alta: notificacionesUsuario.filter(n => n.prioridad === 'alta').length,
        urgente: notificacionesUsuario.filter(n => n.prioridad === 'urgente').length
      };

      res.status(200).json({
        success: true,
        data: {
          total: notificacionesUsuario.length,
          noLeidas: notificacionesNoLeidas.length,
          porTipo: estadisticasPorTipo,
          porPrioridad: estadisticasPorPrioridad
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de notificaciones',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
} 