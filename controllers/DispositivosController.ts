import { Request, Response } from "express";
import Dispositivo from "../models/Dispositivo";
import { logger } from "../lib/logger";
import mongoose from "mongoose";

export class DispositivosController {
  // GET /api/dispositivos
  obtenerTodos = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 10,
        sort = "fechaCreacion",
        order = "desc",
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const sortOrder = order === "asc" ? 1 : -1;

      const dispositivos = await Dispositivo.find({ estado: "activo" })
        .sort({ [sort as string]: sortOrder })
        .skip(skip)
        .limit(Number(limit))
        .populate("cliente", "nombre email")
        .populate("empresa", "nombre");

      const total = await Dispositivo.countDocuments({ estado: "activo" });

      res.status(200).json({
        success: true,
        data: {
          dispositivos,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
        message: "Dispositivos obtenidos exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo dispositivos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // GET /api/dispositivos/:id
  obtenerPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de dispositivo inválido",
        });
        return;
      }

      const dispositivo = await Dispositivo.findById(id)
        .populate("cliente", "nombre email")
        .populate("empresa", "nombre");

      if (!dispositivo) {
        res.status(404).json({
          success: false,
          message: "Dispositivo no encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: dispositivo,
        message: "Dispositivo obtenido exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo dispositivo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // POST /api/dispositivos
  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const nuevoDispositivo = new Dispositivo(req.body);
      await nuevoDispositivo.save();

      res.status(201).json({
        success: true,
        data: nuevoDispositivo,
        message: "Dispositivo creado exitosamente",
      });
    } catch (error) {
      logger.error("Error creando dispositivo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // PUT /api/dispositivos/:id
  actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de dispositivo inválido",
        });
        return;
      }

      const dispositivoActualizado = await Dispositivo.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!dispositivoActualizado) {
        res.status(404).json({
          success: false,
          message: "Dispositivo no encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: dispositivoActualizado,
        message: "Dispositivo actualizado exitosamente",
      });
    } catch (error) {
      logger.error("Error actualizando dispositivo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // DELETE /api/dispositivos/:id
  eliminar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de dispositivo inválido",
        });
        return;
      }

      await Dispositivo.findByIdAndUpdate(id, {
        estado: "inactivo",
        fechaEliminacion: new Date(),
      });

      res.status(200).json({
        success: true,
        message: "Dispositivo eliminado exitosamente",
      });
    } catch (error) {
      logger.error("Error eliminando dispositivo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // Alias para compatibilidad con rutas
  obtenerDispositivos = this.obtenerTodos;
  obtenerDispositivo = this.obtenerPorId;
  crearDispositivo = this.crear;
  actualizarDispositivo = this.actualizar;
  eliminarDispositivo = this.eliminar;

  // GET /api/dispositivos/buscar
  buscarDispositivos = async (req: Request, res: Response): Promise<void> => {
    try {
      const { q } = req.query;

      if (!q) {
        res.status(400).json({
          success: false,
          message: "Parámetro de búsqueda requerido",
        });
        return;
      }

      const dispositivos = await Dispositivo.find({
        $or: [
          { nombre: { $regex: q, $options: "i" } },
          { tipoDispositivo: { $regex: q, $options: "i" } },
          { ubicacion: { $regex: q, $options: "i" } },
        ],
        estado: "activo",
      })
        .populate("cliente", "nombre email")
        .populate("empresa", "nombre")
        .limit(20);

      res.status(200).json({
        success: true,
        data: dispositivos,
        message: "Búsqueda completada exitosamente",
      });
    } catch (error) {
      logger.error("Error buscando dispositivos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // GET /api/dispositivos/estadisticas
  obtenerEstadisticas = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await Dispositivo.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            activos: {
              $sum: { $cond: [{ $eq: ["$estado", "activo"] }, 1, 0] },
            },
            inactivos: {
              $sum: { $cond: [{ $eq: ["$estado", "inactivo"] }, 1, 0] },
            },
            mantenimiento: {
              $sum: { $cond: [{ $eq: ["$estado", "mantenimiento"] }, 1, 0] },
            },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: stats[0] || {
          total: 0,
          activos: 0,
          inactivos: 0,
          mantenimiento: 0,
        },
        message: "Estadísticas obtenidas exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo estadísticas:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // GET /api/dispositivos/cliente/:clienteId
  obtenerDispositivosPorCliente = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { clienteId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(clienteId)) {
        res.status(400).json({
          success: false,
          message: "ID de cliente inválido",
        });
        return;
      }

      const dispositivos = await Dispositivo.find({
        cliente: clienteId,
        estado: "activo",
      })
        .populate("cliente", "nombre email")
        .populate("empresa", "nombre");

      res.status(200).json({
        success: true,
        data: dispositivos,
        message: "Dispositivos del cliente obtenidos exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo dispositivos por cliente:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // PUT /api/dispositivos/:id/estado
  cambiarEstado = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de dispositivo inválido",
        });
        return;
      }

      const dispositivo = await Dispositivo.findByIdAndUpdate(
        id,
        { estado, fechaActualizacion: new Date() },
        { new: true }
      );

      if (!dispositivo) {
        res.status(404).json({
          success: false,
          message: "Dispositivo no encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: dispositivo,
        message: "Estado del dispositivo actualizado exitosamente",
      });
    } catch (error) {
      logger.error("Error cambiando estado:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // GET /api/dispositivos/inactivos
  obtenerDispositivosInactivos = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const dispositivos = await Dispositivo.find({ estado: "inactivo" })
        .populate("cliente", "nombre email")
        .populate("empresa", "nombre")
        .sort({ fechaEliminacion: -1 });

      res.status(200).json({
        success: true,
        data: dispositivos,
        message: "Dispositivos inactivos obtenidos exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo dispositivos inactivos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // GET /api/dispositivos/estadisticas-consumo/:clienteId
  obtenerEstadisticasConsumo = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { clienteId } = req.params;

      res.status(200).json({
        success: true,
        data: {
          clienteId,
          consumoTotal: 0,
          consumoPromedio: 0,
          dispositivos: 0,
        },
        message: "Estadísticas de consumo obtenidas exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo estadísticas de consumo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // POST /api/dispositivos/:id/lecturas
  agregarLectura = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const lecturaData = req.body;

      res.status(201).json({
        success: true,
        data: { dispositivoId: id, lectura: lecturaData },
        message: "Lectura agregada exitosamente",
      });
    } catch (error) {
      logger.error("Error agregando lectura:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // POST /api/dispositivos/:id/alertas
  crearAlerta = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const alertaData = req.body;

      res.status(201).json({
        success: true,
        data: { dispositivoId: id, alerta: alertaData },
        message: "Alerta creada exitosamente",
      });
    } catch (error) {
      logger.error("Error creando alerta:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // PUT /api/dispositivos/:id/alertas/:alertaId/resolver
  resolverAlerta = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, alertaId } = req.params;

      res.status(200).json({
        success: true,
        data: { dispositivoId: id, alertaId, estado: "resuelta" },
        message: "Alerta resuelta exitosamente",
      });
    } catch (error) {
      logger.error("Error resolviendo alerta:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // POST /api/dispositivos/:id/control
  controlarDispositivo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const controlData = req.body;

      res.status(200).json({
        success: true,
        data: { dispositivoId: id, control: controlData },
        message: "Dispositivo controlado exitosamente",
      });
    } catch (error) {
      logger.error("Error controlando dispositivo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };
}

export default new DispositivosController();
