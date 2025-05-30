import { Request, Response } from 'express';
import Cotizacion, { ICotizacion, ICrearCotizacion, IActualizarCotizacion } from '../models/Cotizacion';
import Cliente from '../models/Cliente';
import mongoose from 'mongoose';

export class CotizacionesController {
  
  // =================== FLUJO FORMULARIO DE CONTACTO ===================
  
  // POST /api/cotizaciones/contacto - Recibir formulario desde frontend
  recibirFormularioContacto = async (req: Request, res: Response): Promise<void> => {
    try {
      const datosFormulario: ICrearCotizacion = req.body;
      
      // Validaciones básicas
      if (!datosFormulario.nombre || !datosFormulario.email || !datosFormulario.mensaje || !datosFormulario.servicio) {
        res.status(400).json({
          success: false,
          message: 'Datos requeridos: nombre, email, mensaje y servicio'
        });
        return;
      }

      // Crear nueva cotización desde formulario
      const nuevaCotizacion = new Cotizacion({
        ...datosFormulario,
        estado: 'pendiente'
      });

      await nuevaCotizacion.save();

      // TODO: Aquí se podría integrar envío de emails y notificaciones
      
      res.status(201).json({
        success: true,
        message: 'Formulario recibido exitosamente',
        data: {
          id: nuevaCotizacion._id,
          numero: nuevaCotizacion.numero,
          estado: nuevaCotizacion.estado
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al procesar formulario de contacto',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // =================== GESTIÓN DE COTIZACIONES ===================
  
  // GET /api/cotizaciones - Listar todas las cotizaciones
  obtenerTodos = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      
      // Filtros opcionales
      const filtros: any = {};
      if (req.query.estado) filtros.estado = req.query.estado;
      if (req.query.prioridad) filtros.prioridad = req.query.prioridad;
      if (req.query.servicio) filtros.servicio = req.query.servicio;
      
      const cotizaciones = await Cotizacion.find(filtros)
        .populate('clienteId', 'nombre email telefono')
        .populate('asignadoA', 'nombre email')
        .skip(skip)
        .limit(limit)
        .sort({ prioridad: -1, fechaCreacion: -1 });

      const total = await Cotizacion.countDocuments(filtros);

      res.status(200).json({
        success: true,
        data: cotizaciones,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener cotizaciones',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // GET /api/cotizaciones/pendientes - Cotizaciones pendientes de revisión
  obtenerPendientes = async (req: Request, res: Response): Promise<void> => {
    try {
      const cotizaciones = await Cotizacion.find({ 
        estado: { $in: ['pendiente', 'en_revision'] } 
      })
        .populate('asignadoA', 'nombre email')
        .sort({ prioridad: -1, fechaCreacion: -1 });

      res.status(200).json({
        success: true,
        data: cotizaciones,
        count: cotizaciones.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener cotizaciones pendientes',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // GET /api/cotizaciones/estadisticas - Dashboard de estadísticas
  obtenerEstadisticas = async (req: Request, res: Response): Promise<void> => {
    try {
      const [estadoStats, servicioStats, prioridadStats, tendencias] = await Promise.all([
        // Estadísticas por estado
        Cotizacion.aggregate([
          {
            $group: {
              _id: '$estado',
              count: { $sum: 1 },
              valorTotal: { $sum: '$total' }
            }
          }
        ]),
        
        // Estadísticas por servicio
        Cotizacion.aggregate([
          {
            $group: {
              _id: '$servicio',
              count: { $sum: 1 },
              valorPromedio: { $avg: '$total' }
            }
          }
        ]),
        
        // Estadísticas por prioridad
        Cotizacion.aggregate([
          {
            $group: {
              _id: '$prioridad',
              count: { $sum: 1 }
            }
          }
        ]),
        
        // Tendencias por mes (últimos 6 meses)
        Cotizacion.aggregate([
          {
            $match: {
              fechaCreacion: {
                $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
              }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$fechaCreacion' },
                month: { $month: '$fechaCreacion' }
              },
              count: { $sum: 1 },
              valor: { $sum: '$total' }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])
      ]);

      res.status(200).json({
        success: true,
        data: {
          porEstado: estadoStats,
          porServicio: servicioStats,
          porPrioridad: prioridadStats,
          tendencias: tendencias
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // GET /api/cotizaciones/:id - Obtener cotización específica
  obtenerPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'ID de cotización inválido'
        });
        return;
      }

      const cotizacion = await Cotizacion.findById(id)
        .populate('clienteId', 'nombre email telefono empresa')
        .populate('asignadoA', 'nombre email');
      
      if (!cotizacion) {
        res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: cotizacion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener cotización',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // PUT /api/cotizaciones/:id/estado - Cambiar estado de cotización
  cambiarEstado = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { estado, notas } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'ID de cotización inválido'
        });
        return;
      }

      const estadosValidos = ['pendiente', 'en_revision', 'cotizando', 'cotizada', 'aprobada', 'rechazada', 'convertida_cliente'];
      if (!estadosValidos.includes(estado)) {
        res.status(400).json({
          success: false,
          message: 'Estado inválido'
        });
        return;
      }

      const cotizacion = await Cotizacion.findByIdAndUpdate(
        id,
        { 
          estado, 
          notas: notas || '',
          fechaActualizacion: new Date()
        },
        { new: true }
      );

      if (!cotizacion) {
        res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Estado cambiado a: ${estado}`,
        data: cotizacion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // PUT /api/cotizaciones/:id/cotizar - Agregar datos de cotización
  agregarCotizacion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const datosActualizacion: IActualizarCotizacion = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'ID de cotización inválido'
        });
        return;
      }

      // Validar que tenga datos de cotización
      if (!datosActualizacion.titulo || !datosActualizacion.items || !datosActualizacion.total) {
        res.status(400).json({
          success: false,
          message: 'Datos requeridos: título, items y total'
        });
        return;
      }

      const cotizacion = await Cotizacion.findByIdAndUpdate(
        id,
        { 
          ...datosActualizacion, 
          estado: 'cotizada',
          fechaCotizacion: new Date(),
          fechaActualizacion: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!cotizacion) {
        res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Cotización agregada exitosamente',
        data: cotizacion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al agregar cotización',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // =================== CONVERSIÓN A CLIENTE ===================
  
  // POST /api/cotizaciones/:id/convertir-cliente - Convertir cotización aprobada a cliente
  convertirACliente = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { passwordTemporal, planSeleccionado = 'basico', montoMensual = 0 } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'ID de cotización inválido'
        });
        return;
      }

      // Buscar cotización
      const cotizacion = await Cotizacion.findById(id);
      if (!cotizacion) {
        res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
        return;
      }

      // Verificar que esté aprobada
      if (cotizacion.estado !== 'aprobada') {
        res.status(400).json({
          success: false,
          message: 'Solo se pueden convertir cotizaciones aprobadas'
        });
        return;
      }

      // Verificar si ya existe un cliente con este email
      let cliente = await Cliente.findOne({ 
        $or: [
          { email: cotizacion.email },
          { correo: cotizacion.email }
        ]
      });

      if (!cliente) {
        // Crear nuevo cliente
        const numeroCliente = Math.floor(100000 + Math.random() * 900000).toString();
        
        cliente = new Cliente({
          nombre: cotizacion.nombre,
          email: cotizacion.email,
          correo: cotizacion.email, // Para compatibilidad
          telefono: cotizacion.telefono || '',
          empresa: cotizacion.empresa || '',
          numeroCliente: numeroCliente,
          role: 'cliente',
          esActivo: true,
          activo: true,
          passwordTemporal: passwordTemporal || Math.random().toString(36).slice(-8),
          planSeleccionado: planSeleccionado,
          montoMensual: montoMensual,
          fechaRegistro: new Date(),
          fechaActivacion: new Date(),
          notas: `Cliente creado desde cotización ${cotizacion.numero}`
        });

        await cliente.save();
      }

      // Actualizar cotización
      await Cotizacion.findByIdAndUpdate(id, {
        estado: 'convertida_cliente',
        clienteId: cliente._id,
        fechaConversion: new Date(),
        fechaActualizacion: new Date()
      });

      // TODO: Aquí se enviaría el email con la contraseña temporal

      res.status(200).json({
        success: true,
        message: 'Cliente creado exitosamente',
        data: {
          cliente: {
            id: cliente._id,
            nombre: cliente.nombre,
            email: cliente.email || cliente.correo,
            numeroCliente: cliente.numeroCliente,
            planSeleccionado: cliente.planSeleccionado
          },
          cotizacion: {
            id: cotizacion._id,
            numero: cotizacion.numero,
            estado: 'convertida_cliente'
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al convertir a cliente',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // POST /api/cotizaciones - Crear cotización manual (opcional)
  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const datosCotizacion: ICrearCotizacion = req.body;
      
      const nuevaCotizacion = new Cotizacion(datosCotizacion);
      await nuevaCotizacion.save();

      res.status(201).json({
        success: true,
        message: 'Cotización creada exitosamente',
        data: nuevaCotizacion
      });
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: Object.values(error.errors).map(err => err.message)
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error al crear cotización',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
  };

  // DELETE /api/cotizaciones/:id - Eliminar cotización
  eliminar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'ID de cotización inválido'
        });
        return;
      }

      const cotizacion = await Cotizacion.findByIdAndDelete(id);
      
      if (!cotizacion) {
        res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Cotización eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar cotización',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
} 