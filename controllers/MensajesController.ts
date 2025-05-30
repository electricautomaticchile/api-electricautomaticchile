import { Request, Response } from 'express';
import { IMensaje, ICrearMensaje, IActualizarMensaje, IMensajeConUsuarios } from '../models/Mensaje';

// Simulamos una base de datos en memoria
let mensajes: IMensaje[] = [
  {
    id: 1,
    remitenteId: 1,
    destinatarioId: 2,
    asunto: 'Consulta sobre cotización',
    contenido: 'Necesito más información sobre la cotización enviada.',
    tipoMensaje: 'cotizacion',
    prioridad: 'media',
    leido: false,
    entidadRelacionada: {
      tipo: 'cotizacion',
      id: 1
    },
    fechaEnvio: new Date(),
    fechaCreacion: new Date()
  }
];

let nextId = 2;

export class MensajesController {
  // GET /api/mensajes
  obtenerTodos = (req: Request, res: Response): void => {
    try {
      const { remitenteId, destinatarioId, tipoMensaje, leido, limite, pagina } = req.query;
      
      let mensajesFiltrados = [...mensajes];

      // Filtros
      if (remitenteId) {
        mensajesFiltrados = mensajesFiltrados.filter(m => m.remitenteId === Number(remitenteId));
      }
      if (destinatarioId) {
        mensajesFiltrados = mensajesFiltrados.filter(m => m.destinatarioId === Number(destinatarioId));
      }
      if (tipoMensaje) {
        mensajesFiltrados = mensajesFiltrados.filter(m => m.tipoMensaje === tipoMensaje);
      }
      if (leido !== undefined) {
        mensajesFiltrados = mensajesFiltrados.filter(m => m.leido === (leido === 'true'));
      }

      // Ordenar por fecha más reciente
      mensajesFiltrados.sort((a, b) => b.fechaEnvio.getTime() - a.fechaEnvio.getTime());

      // Paginación
      const limitNum = limite ? Number(limite) : 10;
      const paginaNum = pagina ? Number(pagina) : 1;
      const offset = (paginaNum - 1) * limitNum;
      const mensajesPaginados = mensajesFiltrados.slice(offset, offset + limitNum);

      res.status(200).json({
        success: true,
        data: mensajesPaginados,
        meta: {
          total: mensajesFiltrados.length,
          pagina: paginaNum,
          limite: limitNum,
          totalPaginas: Math.ceil(mensajesFiltrados.length / limitNum),
          noLeidos: mensajesFiltrados.filter(m => !m.leido).length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener mensajes',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // GET /api/mensajes/bandeja/:usuarioId
  obtenerBandejaUsuario = (req: Request, res: Response): void => {
    try {
      const usuarioId = parseInt(req.params.usuarioId);
      const { tipo = 'recibidos', limite, pagina } = req.query;
      
      let mensajesUsuario = [];
      
      if (tipo === 'recibidos') {
        mensajesUsuario = mensajes.filter(m => m.destinatarioId === usuarioId);
      } else if (tipo === 'enviados') {
        mensajesUsuario = mensajes.filter(m => m.remitenteId === usuarioId);
      } else {
        mensajesUsuario = mensajes.filter(m => 
          m.destinatarioId === usuarioId || m.remitenteId === usuarioId
        );
      }

      // Ordenar por fecha más reciente
      mensajesUsuario.sort((a, b) => b.fechaEnvio.getTime() - a.fechaEnvio.getTime());

      // Paginación
      const limitNum = limite ? Number(limite) : 10;
      const paginaNum = pagina ? Number(pagina) : 1;
      const offset = (paginaNum - 1) * limitNum;
      const mensajesPaginados = mensajesUsuario.slice(offset, offset + limitNum);

      res.status(200).json({
        success: true,
        data: mensajesPaginados,
        meta: {
          total: mensajesUsuario.length,
          pagina: paginaNum,
          limite: limitNum,
          totalPaginas: Math.ceil(mensajesUsuario.length / limitNum),
          noLeidos: mensajesUsuario.filter(m => !m.leido && m.destinatarioId === usuarioId).length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener bandeja de usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // GET /api/mensajes/:id
  obtenerPorId = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const mensaje = mensajes.find(m => m.id === id);
      
      if (!mensaje) {
        res.status(404).json({
          success: false,
          message: 'Mensaje no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: mensaje
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener mensaje',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // POST /api/mensajes
  crear = (req: Request, res: Response): void => {
    try {
      const datosMensaje: ICrearMensaje = req.body;
      
      // Validaciones básicas
      if (!datosMensaje.remitenteId || !datosMensaje.destinatarioId || !datosMensaje.contenido) {
        res.status(400).json({
          success: false,
          message: 'Remitente, destinatario y contenido son requeridos'
        });
        return;
      }

      const nuevoMensaje: IMensaje = {
        id: nextId++,
        ...datosMensaje,
        tipoMensaje: datosMensaje.tipoMensaje || 'privado',
        prioridad: datosMensaje.prioridad || 'media',
        leido: false,
        fechaEnvio: new Date(),
        fechaCreacion: new Date()
      };

      mensajes.push(nuevoMensaje);

      res.status(201).json({
        success: true,
        message: 'Mensaje enviado exitosamente',
        data: nuevoMensaje
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear mensaje',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // PUT /api/mensajes/:id/marcar-leido
  marcarComoLeido = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const mensajeIndex = mensajes.findIndex(m => m.id === id);
      
      if (mensajeIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Mensaje no encontrado'
        });
        return;
      }

      mensajes[mensajeIndex].leido = true;
      mensajes[mensajeIndex].fechaLectura = new Date();
      mensajes[mensajeIndex].fechaActualizacion = new Date();

      res.status(200).json({
        success: true,
        message: 'Mensaje marcado como leído',
        data: mensajes[mensajeIndex]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al marcar mensaje como leído',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // PUT /api/mensajes/marcar-todos-leidos/:usuarioId
  marcarTodosComoLeidos = (req: Request, res: Response): void => {
    try {
      const usuarioId = parseInt(req.params.usuarioId);
      
      let mensajesActualizados = 0;
      const fechaActual = new Date();

      mensajes.forEach((mensaje, index) => {
        if (mensaje.destinatarioId === usuarioId && !mensaje.leido) {
          mensajes[index].leido = true;
          mensajes[index].fechaLectura = fechaActual;
          mensajes[index].fechaActualizacion = fechaActual;
          mensajesActualizados++;
        }
      });

      res.status(200).json({
        success: true,
        message: `${mensajesActualizados} mensajes marcados como leídos`,
        data: { mensajesActualizados }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al marcar todos los mensajes como leídos',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // GET /api/mensajes/conversacion/:usuario1/:usuario2
  obtenerConversacion = (req: Request, res: Response): void => {
    try {
      const usuario1 = parseInt(req.params.usuario1);
      const usuario2 = parseInt(req.params.usuario2);
      const { limite, pagina } = req.query;

      const conversacion = mensajes.filter(m => 
        (m.remitenteId === usuario1 && m.destinatarioId === usuario2) ||
        (m.remitenteId === usuario2 && m.destinatarioId === usuario1)
      );

      // Ordenar cronológicamente
      conversacion.sort((a, b) => a.fechaEnvio.getTime() - b.fechaEnvio.getTime());

      // Paginación
      const limitNum = limite ? Number(limite) : 50;
      const paginaNum = pagina ? Number(pagina) : 1;
      const offset = (paginaNum - 1) * limitNum;
      const mensajesPaginados = conversacion.slice(offset, offset + limitNum);

      res.status(200).json({
        success: true,
        data: mensajesPaginados,
        meta: {
          total: conversacion.length,
          pagina: paginaNum,
          limite: limitNum,
          totalPaginas: Math.ceil(conversacion.length / limitNum)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener conversación',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // GET /api/mensajes/estadisticas/:usuarioId
  obtenerEstadisticas = (req: Request, res: Response): void => {
    try {
      const usuarioId = parseInt(req.params.usuarioId);
      
      const mensajesRecibidos = mensajes.filter(m => m.destinatarioId === usuarioId);
      const mensajesEnviados = mensajes.filter(m => m.remitenteId === usuarioId);
      const mensajesNoLeidos = mensajesRecibidos.filter(m => !m.leido);

      const estadisticasPorTipo = {
        privado: mensajesRecibidos.filter(m => m.tipoMensaje === 'privado').length,
        notificacion: mensajesRecibidos.filter(m => m.tipoMensaje === 'notificacion').length,
        sistema: mensajesRecibidos.filter(m => m.tipoMensaje === 'sistema').length,
        cotizacion: mensajesRecibidos.filter(m => m.tipoMensaje === 'cotizacion').length,
        soporte: mensajesRecibidos.filter(m => m.tipoMensaje === 'soporte').length
      };

      const estadisticasPorPrioridad = {
        baja: mensajesRecibidos.filter(m => m.prioridad === 'baja').length,
        media: mensajesRecibidos.filter(m => m.prioridad === 'media').length,
        alta: mensajesRecibidos.filter(m => m.prioridad === 'alta').length,
        urgente: mensajesRecibidos.filter(m => m.prioridad === 'urgente').length
      };

      res.status(200).json({
        success: true,
        data: {
          totalRecibidos: mensajesRecibidos.length,
          totalEnviados: mensajesEnviados.length,
          noLeidos: mensajesNoLeidos.length,
          porTipo: estadisticasPorTipo,
          porPrioridad: estadisticasPorPrioridad
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de mensajes',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
} 