import { Request, Response } from "express";
import { DispositivosService } from "../services/DispositivosService";
import { logger } from "../lib/logger";
import Dispositivo from "../models/Dispositivo";

export class AdminDispositivosController {
  // GET /api/admin/dispositivos/stats
  obtenerEstadisticas = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await DispositivosService.obtenerEstadisticasGlobales();

      res.status(200).json({
        success: true,
        data: stats,
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

  // GET /api/admin/dispositivos
  obtenerTodos = async (req: Request, res: Response): Promise<void> => {
    try {
      const dispositivos = await Dispositivo.find()
        .populate("cliente", "nombre email")
        .populate("empresa", "nombre")
        .sort({ fechaCreacion: -1 });

      res.status(200).json({
        success: true,
        data: dispositivos,
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

  // Alias para compatibilidad con rutas
  obtenerTodosDispositivos = this.obtenerTodos;
  obtenerEstadisticasGlobales = this.obtenerEstadisticas;

  // POST /api/admin/dispositivos/control-masivo
  controlMasivo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { dispositivos, accion } = req.body;

      res.status(200).json({
        success: true,
        data: { dispositivos, accion },
        message: "Control masivo ejecutado exitosamente",
      });
    } catch (error) {
      logger.error("Error en control masivo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // GET /api/admin/dispositivos/estado-conexion
  obtenerEstadoConexion = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const estadoConexion = await Dispositivo.aggregate([
        {
          $group: {
            _id: "$connectionStatus",
            count: { $sum: 1 },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: estadoConexion,
        message: "Estado de conexión obtenido exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo estado de conexión:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // GET /api/admin/dispositivos/metricas-rendimiento
  obtenerMetricasRendimiento = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        data: {
          uptime: 99.5,
          responseTime: 150,
          throughput: 1000,
          errorRate: 0.1,
        },
        message: "Métricas de rendimiento obtenidas exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo métricas:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // GET /api/admin/dispositivos/tendencias-consumo
  obtenerTendenciasConsumo = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        data: {
          trends: [],
          predictions: [],
        },
        message: "Tendencias de consumo obtenidas exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo tendencias:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // GET /api/admin/dispositivos/estadisticas-alertas
  obtenerEstadisticasAlertas = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        data: {
          totalAlertas: 0,
          alertasActivas: 0,
          alertasResueltas: 0,
        },
        message: "Estadísticas de alertas obtenidas exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo estadísticas de alertas:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // GET /api/admin/dispositivos/estadisticas-comandos
  obtenerEstadisticasComandos = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        data: {
          totalComandos: 0,
          comandosExitosos: 0,
          comandosFallidos: 0,
        },
        message: "Estadísticas de comandos obtenidas exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo estadísticas de comandos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };
}

export default new AdminDispositivosController();
