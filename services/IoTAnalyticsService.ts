import { logger } from "../lib/logger";
import Dispositivo from "../models/Dispositivo";

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  deviceType?: string;
  status?: string;
}

export interface DeviceStatistics {
  totalDevices: number;
  activeDevices: number;
  connectedDevices: number;
  disconnectedDevices: number;
  totalEnergy: number;
  averageVoltage: number;
  averageCurrent: number;
  devicesByType: Record<string, number>;
  devicesByStatus: Record<string, number>;
}

export class IoTAnalyticsService {
  /**
   * Obtener estadísticas globales del sistema
   */
  static async getGlobalStats(
    filters: AnalyticsFilters = {}
  ): Promise<DeviceStatistics> {
    try {
      const matchStage: any = {};

      if (filters.startDate || filters.endDate) {
        matchStage.fechaCreacion = {};
        if (filters.startDate)
          matchStage.fechaCreacion.$gte = filters.startDate;
        if (filters.endDate) matchStage.fechaCreacion.$lte = filters.endDate;
      }

      if (filters.deviceType) matchStage.tipoDispositivo = filters.deviceType;
      if (filters.status) matchStage.estado = filters.status;

      const [statistics, devicesByType, devicesByStatus] = await Promise.all([
        Dispositivo.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalDevices: { $sum: 1 },
              activeDevices: {
                $sum: { $cond: [{ $eq: ["$estado", "activo"] }, 1, 0] },
              },
              connectedDevices: {
                $sum: {
                  $cond: [{ $eq: ["$connectionStatus", "connected"] }, 1, 0],
                },
              },
              disconnectedDevices: {
                $sum: {
                  $cond: [{ $eq: ["$connectionStatus", "disconnected"] }, 1, 0],
                },
              },
              totalEnergy: { $sum: { $ifNull: ["$consumoEnergia", 0] } },
              averageVoltage: { $avg: { $ifNull: ["$voltaje", 0] } },
              averageCurrent: { $avg: { $ifNull: ["$corriente", 0] } },
            },
          },
        ]),
        Dispositivo.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: "$tipoDispositivo",
              count: { $sum: 1 },
            },
          },
        ]),
        Dispositivo.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: "$estado",
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

      const stats = statistics[0] || {
        totalDevices: 0,
        activeDevices: 0,
        connectedDevices: 0,
        disconnectedDevices: 0,
        totalEnergy: 0,
        averageVoltage: 0,
        averageCurrent: 0,
      };

      return {
        ...stats,
        devicesByType: devicesByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        devicesByStatus: devicesByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      };
    } catch (error) {
      logger.error("Error en getGlobalStats:", error);
      return {
        totalDevices: 0,
        activeDevices: 0,
        connectedDevices: 0,
        disconnectedDevices: 0,
        totalEnergy: 0,
        averageVoltage: 0,
        averageCurrent: 0,
        devicesByType: {},
        devicesByStatus: {},
      };
    }
  }

  /**
   * Obtener estadísticas de dispositivos por empresa
   */
  static async getEmpresaDeviceStatistics(
    empresaId: string,
    filters: AnalyticsFilters = {}
  ): Promise<DeviceStatistics> {
    try {
      const matchStage: any = { empresa: empresaId };

      if (filters.startDate || filters.endDate) {
        matchStage.fechaCreacion = {};
        if (filters.startDate)
          matchStage.fechaCreacion.$gte = filters.startDate;
        if (filters.endDate) matchStage.fechaCreacion.$lte = filters.endDate;
      }

      return await this.getGlobalStats({ ...filters });
    } catch (error) {
      logger.error("Error obteniendo estadísticas de empresa:", error);
      throw error;
    }
  }

  /**
   * Obtener métricas de rendimiento
   */
  static async getPerformanceMetrics(
    filters: AnalyticsFilters = {}
  ): Promise<any> {
    try {
      // TODO: Implementar métricas de rendimiento
      return {
        uptime: 99.5,
        responseTime: 150,
        throughput: 1000,
        errorRate: 0.1,
      };
    } catch (error) {
      logger.error("Error obteniendo métricas de rendimiento:", error);
      throw error;
    }
  }

  /**
   * Obtener tendencias de consumo
   */
  static async getConsumptionTrends(
    filters: AnalyticsFilters = {}
  ): Promise<any> {
    try {
      // TODO: Implementar tendencias de consumo
      return {
        trends: [],
        predictions: [],
      };
    } catch (error) {
      logger.error("Error obteniendo tendencias de consumo:", error);
      throw error;
    }
  }
}
