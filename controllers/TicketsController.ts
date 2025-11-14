import { Request, Response } from "express";
import Ticket from "../models/Ticket";
import Cliente from "../models/Cliente";
import Dispositivo from "../models/Dispositivo";
import { NotificationService } from "../services/notificationService";

export class TicketsController {
  /**
   * Crear un nuevo ticket
   */
  async crear(req: Request, res: Response): Promise<void> {
    try {
      const {
        clienteId,
        asunto,
        descripcion,
        categoria,
        prioridad,
        dispositivoId,
      } = req.body;

      // Validar campos requeridos
      if (!clienteId || !asunto || !descripcion || !categoria) {
        res.status(400).json({
          success: false,
          message: "Faltan campos requeridos",
        });
        return;
      }

      // Obtener información del cliente
      const cliente = await Cliente.findById(clienteId);
      if (!cliente) {
        res.status(404).json({
          success: false,
          message: "Cliente no encontrado",
        });
        return;
      }

      // Generar número de ticket
      const numeroTicket = await (Ticket as any).generarNumeroTicket();

      // Preparar datos del ticket
      const ticketData: any = {
        numeroTicket,
        clienteId: cliente._id,
        numeroCliente: cliente.numeroCliente,
        nombreCliente: cliente.nombre,
        emailCliente: cliente.correo || (cliente as any).email,
        telefonoCliente: cliente.telefono,
        asunto,
        descripcion,
        categoria,
        prioridad: prioridad || "media",
        estado: "abierto",
      };

      // Solo agregar empresaId si existe y no está vacío
      if (cliente.empresa && cliente.empresa.toString() !== "") {
        ticketData.empresaId = cliente.empresa;
      }

      // Si se especifica un dispositivo, obtener su información
      if (dispositivoId) {
        const dispositivo = await Dispositivo.findById(dispositivoId);
        if (dispositivo) {
          ticketData.dispositivoId = dispositivo._id;
          ticketData.numeroDispositivo = dispositivo.numeroDispositivo;
          ticketData.nombreDispositivo = dispositivo.nombre;
        }
      }

      // Crear el ticket
      const ticket = await Ticket.create(ticketData);

      // Enviar notificaciones
      try {
        await NotificationService.notificarTicketCreado(ticket);

        // Registrar notificación enviada
        ticket.notificacionesEnviadas.push({
          tipo: "email",
          destinatario: ticket.emailCliente,
          fecha: new Date(),
          estado: "enviado",
        });
        await ticket.save();
      } catch (emailError) {
        console.error("Error enviando notificaciones:", emailError);
        // No fallar la creación del ticket si falla el email
      }

      res.status(201).json({
        success: true,
        message: "Ticket creado exitosamente",
        data: ticket,
      });
    } catch (error) {
      console.error("Error creando ticket:", error);
      res.status(500).json({
        success: false,
        message: "Error al crear el ticket",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Obtener todos los tickets (con filtros)
   */
  async obtenerTodos(req: Request, res: Response): Promise<void> {
    try {
      const {
        clienteId,
        empresaId,
        estado,
        categoria,
        prioridad,
        page = 1,
        limit = 10,
      } = req.query;

      // Construir filtros
      const filtros: any = {};

      if (clienteId) filtros.clienteId = clienteId;
      if (empresaId) filtros.empresaId = empresaId;
      if (estado) filtros.estado = estado;
      if (categoria) filtros.categoria = categoria;
      if (prioridad) filtros.prioridad = prioridad;

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);

      // Obtener tickets
      const tickets = await Ticket.find(filtros)
        .sort({ fechaCreacion: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("clienteId", "nombre numeroCliente")
        .populate("dispositivoId", "nombre numeroDispositivo");

      // Contar total
      const total = await Ticket.countDocuments(filtros);

      res.json({
        success: true,
        data: tickets,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Error obteniendo tickets:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener los tickets",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Obtener un ticket por ID
   */
  async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const ticket = await Ticket.findById(id)
        .populate("clienteId", "nombre numeroCliente email telefono")
        .populate("dispositivoId", "nombre numeroDispositivo tipo")
        .populate("asignadoA", "nombre email");

      if (!ticket) {
        res.status(404).json({
          success: false,
          message: "Ticket no encontrado",
        });
        return;
      }

      res.json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      console.error("Error obteniendo ticket:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener el ticket",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Obtener ticket por número
   */
  async obtenerPorNumero(req: Request, res: Response): Promise<void> {
    try {
      const { numeroTicket } = req.params;

      const ticket = await Ticket.findOne({ numeroTicket })
        .populate("clienteId", "nombre numeroCliente email telefono")
        .populate("dispositivoId", "nombre numeroDispositivo tipo")
        .populate("asignadoA", "nombre email");

      if (!ticket) {
        res.status(404).json({
          success: false,
          message: "Ticket no encontrado",
        });
        return;
      }

      res.json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      console.error("Error obteniendo ticket:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener el ticket",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Agregar respuesta a un ticket
   */
  async agregarRespuesta(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { autorId, autorNombre, autorTipo, mensaje } = req.body;

      if (!autorId || !autorNombre || !autorTipo || !mensaje) {
        res.status(400).json({
          success: false,
          message: "Faltan campos requeridos",
        });
        return;
      }

      const ticket = await Ticket.findById(id);
      if (!ticket) {
        res.status(404).json({
          success: false,
          message: "Ticket no encontrado",
        });
        return;
      }

      // Agregar respuesta
      const respuesta = {
        autorId,
        autorNombre,
        autorTipo,
        mensaje,
        fecha: new Date(),
      };

      ticket.respuestas.push(respuesta);
      ticket.fechaActualizacion = new Date();

      // Si el ticket estaba abierto, cambiar a en-proceso
      if (ticket.estado === "abierto") {
        ticket.estado = "en-proceso";
      }

      await ticket.save();

      // Enviar notificación
      try {
        await NotificationService.notificarNuevaRespuesta(ticket, respuesta);
      } catch (emailError) {
        console.error("Error enviando notificación:", emailError);
      }

      res.json({
        success: true,
        message: "Respuesta agregada exitosamente",
        data: ticket,
      });
    } catch (error) {
      console.error("Error agregando respuesta:", error);
      res.status(500).json({
        success: false,
        message: "Error al agregar la respuesta",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Actualizar estado del ticket
   */
  async actualizarEstado(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!estado) {
        res.status(400).json({
          success: false,
          message: "Estado es requerido",
        });
        return;
      }

      const ticket = await Ticket.findById(id);
      if (!ticket) {
        res.status(404).json({
          success: false,
          message: "Ticket no encontrado",
        });
        return;
      }

      const estadoAnterior = ticket.estado;
      ticket.estado = estado;
      ticket.fechaActualizacion = new Date();

      if (estado === "cerrado") {
        ticket.fechaCierre = new Date();
      }

      await ticket.save();

      // Enviar notificación
      try {
        if (estado === "cerrado") {
          await NotificationService.notificarTicketCerrado(ticket);
        } else {
          await NotificationService.notificarCambioEstado(
            ticket,
            estadoAnterior
          );
        }
      } catch (emailError) {
        console.error("Error enviando notificación:", emailError);
      }

      res.json({
        success: true,
        message: "Estado actualizado exitosamente",
        data: ticket,
      });
    } catch (error) {
      console.error("Error actualizando estado:", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar el estado",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Actualizar prioridad del ticket
   */
  async actualizarPrioridad(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { prioridad } = req.body;

      if (!prioridad) {
        res.status(400).json({
          success: false,
          message: "Prioridad es requerida",
        });
        return;
      }

      const ticket = await Ticket.findByIdAndUpdate(
        id,
        { prioridad, fechaActualizacion: new Date() },
        { new: true }
      );

      if (!ticket) {
        res.status(404).json({
          success: false,
          message: "Ticket no encontrado",
        });
        return;
      }

      res.json({
        success: true,
        message: "Prioridad actualizada exitosamente",
        data: ticket,
      });
    } catch (error) {
      console.error("Error actualizando prioridad:", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar la prioridad",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Asignar ticket a un usuario
   */
  async asignar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { asignadoA, asignadoNombre } = req.body;

      const ticket = await Ticket.findByIdAndUpdate(
        id,
        {
          asignadoA,
          asignadoNombre,
          fechaActualizacion: new Date(),
        },
        { new: true }
      );

      if (!ticket) {
        res.status(404).json({
          success: false,
          message: "Ticket no encontrado",
        });
        return;
      }

      res.json({
        success: true,
        message: "Ticket asignado exitosamente",
        data: ticket,
      });
    } catch (error) {
      console.error("Error asignando ticket:", error);
      res.status(500).json({
        success: false,
        message: "Error al asignar el ticket",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Obtener estadísticas de tickets
   */
  async obtenerEstadisticas(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId, clienteId } = req.query;

      const filtros: any = {};
      if (empresaId) filtros.empresaId = empresaId;
      if (clienteId) filtros.clienteId = clienteId;

      const [
        total,
        abiertos,
        enProceso,
        resueltos,
        cerrados,
        porCategoria,
        porPrioridad,
      ] = await Promise.all([
        Ticket.countDocuments(filtros),
        Ticket.countDocuments({ ...filtros, estado: "abierto" }),
        Ticket.countDocuments({ ...filtros, estado: "en-proceso" }),
        Ticket.countDocuments({ ...filtros, estado: "resuelto" }),
        Ticket.countDocuments({ ...filtros, estado: "cerrado" }),
        Ticket.aggregate([
          { $match: filtros },
          { $group: { _id: "$categoria", count: { $sum: 1 } } },
        ]),
        Ticket.aggregate([
          { $match: filtros },
          { $group: { _id: "$prioridad", count: { $sum: 1 } } },
        ]),
      ]);

      res.json({
        success: true,
        data: {
          total,
          porEstado: {
            abiertos,
            enProceso,
            resueltos,
            cerrados,
          },
          porCategoria: porCategoria.reduce((acc: any, item: any) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          porPrioridad: porPrioridad.reduce((acc: any, item: any) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
        },
      });
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
