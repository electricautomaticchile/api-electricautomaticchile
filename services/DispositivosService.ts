import Dispositivo, { IDispositivo } from "../models/Dispositivo";
import Cliente from "../models/Cliente";
import { SortOrder } from "mongoose";
import { websocketClient } from "../lib/websocket/websocketClient";
import { PermissionMiddleware } from "../middleware/permissionMiddleware";

// Tipos específicos para el servicio
export interface DeviceFilters {
  cliente?: string;
  estado?: string;
  tipoDispositivo?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
}

export interface DeviceQueryResult {
  devices: IDispositivo[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface DeviceCreationData {
  nombre: string;
  tipo: string;
  cliente: string;
  ubicacion?: string;
  configuracion?: Record<string, unknown>;
}

export interface DeviceUpdateData {
  nombre?: string;
  estado?: string;
  ubicacion?: string;
  configuracion?: Record<string, unknown>;
}

export class DispositivosService {
  // Obtener dispositivos con filtros y paginación (con filtrado por rol)
  static async getDevicesWithFilters(
    filters: DeviceFilters,
    pagination: PaginationOptions,
    userRole?: string,
    userId?: string
  ): Promise<DeviceQueryResult> {
    const mongoFilters: Record<string, unknown> = {};

    if (filters.cliente) mongoFilters.cliente = filters.cliente;
    if (filters.estado) mongoFilters.estado = filters.estado;
    if (filters.tipoDispositivo)
      mongoFilters.tipoDispositivo = filters.tipoDispositivo;

    const sortOptions = {
      [pagination.sort]: (pagination.order === "desc" ? -1 : 1) as SortOrder,
    };

    const populateOptions = {
      path: "cliente",
      select: "nombre email numeroCliente empresa",
    };

    const [allDevices, totalItems] = await Promise.all([
      Dispositivo.find(mongoFilters)
        .populate(populateOptions)
        .sort(sortOptions)
        .skip((pagination.page - 1) * pagination.limit)
        .limit(pagination.limit),
      Dispositivo.countDocuments(mongoFilters),
    ]);

    // Filtrar dispositivos por rol si se especifica
    let devices = allDevices;
    if (userRole && userId) {
      devices = await PermissionMiddleware.filterDevicesByRole(
        allDevices,
        userRole,
        userId
      );
    }

    const totalPages = Math.ceil(totalItems / pagination.limit);

    return {
      devices,
      pagination: {
        currentPage: pagination.page,
        totalPages,
        totalItems: devices.length, // Usar la cantidad filtrada
        hasNextPage: pagination.page < totalPages,
        hasPrevPage: pagination.page > 1,
      },
    };
  }

  // Obtener dispositivo por ID
  static async getDeviceById(id: string): Promise<IDispositivo | null> {
    return await Dispositivo.findById(id).populate({
      path: "cliente",
      select: "nombre email numeroCliente empresa",
    });
  }

  // Crear nuevo dispositivo
  static async createDevice(
    deviceData: DeviceCreationData
  ): Promise<IDispositivo> {
    // Validar que el cliente existe
    const cliente = await Cliente.findById(deviceData.cliente);
    if (!cliente) {
      throw new Error("Cliente no encontrado");
    }

    const newDevice = new Dispositivo({
      ...deviceData,
      fechaCreacion: new Date(),
      estado: "activo",
    });

    const savedDevice = await newDevice.save();
    await savedDevice.populate({
      path: "cliente",
      select: "nombre email numeroCliente empresa",
    });

    // Notificar via WebSocket
    websocketClient.reportDeviceConnection(
      (savedDevice._id as any).toString(),
      "connected"
    );

    return savedDevice;
  }

  // Actualizar dispositivo
  static async updateDevice(
    id: string,
    updateData: DeviceUpdateData
  ): Promise<IDispositivo | null> {
    const updatedDevice = await Dispositivo.findByIdAndUpdate(
      id,
      {
        ...updateData,
        fechaActualizacion: new Date(),
      },
      { new: true }
    ).populate({
      path: "cliente",
      select: "nombre email numeroCliente empresa",
    });

    if (updatedDevice) {
      // Notificar via WebSocket
      websocketClient.reportDeviceConnection(
        (updatedDevice._id as any).toString(),
        "connected"
      );
    }

    return updatedDevice;
  }

  // Eliminar dispositivo (soft delete)
  static async deleteDevice(id: string): Promise<boolean> {
    const device = await Dispositivo.findByIdAndUpdate(
      id,
      {
        estado: "inactivo",
        fechaEliminacion: new Date(),
      },
      { new: true }
    );

    if (device) {
      // Notificar via WebSocket
      websocketClient.reportDeviceConnection(
        (device._id as any).toString(),
        "disconnected"
      );
      return true;
    }

    return false;
  }

  // Obtener estadísticas de dispositivos
  static async getDeviceStatistics(
    clienteId?: string
  ): Promise<Record<string, unknown>> {
    const matchStage: Record<string, unknown> = {};
    if (clienteId) {
      matchStage.cliente = clienteId;
    }

    const stats = await Dispositivo.aggregate([
      { $match: matchStage },
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
          porTipo: {
            $push: {
              tipo: "$tipoDispositivo",
              estado: "$estado",
            },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        total: 0,
        activos: 0,
        inactivos: 0,
        mantenimiento: 0,
        porTipo: [],
      }
    );
  }

  // Buscar dispositivos por texto
  static async searchDevices(
    searchTerm: string,
    clienteId?: string
  ): Promise<IDispositivo[]> {
    const matchStage: Record<string, unknown> = {
      $or: [
        { nombre: { $regex: searchTerm, $options: "i" } },
        { tipoDispositivo: { $regex: searchTerm, $options: "i" } },
        { ubicacion: { $regex: searchTerm, $options: "i" } },
      ],
    };

    if (clienteId) {
      matchStage.cliente = clienteId;
    }

    return await Dispositivo.find(matchStage)
      .populate({
        path: "cliente",
        select: "nombre email numeroCliente empresa",
      })
      .limit(20);
  }

  // Obtener dispositivos por cliente
  static async getDevicesByClient(clienteId: string): Promise<IDispositivo[]> {
    return await Dispositivo.find({ cliente: clienteId, estado: "activo" })
      .populate({
        path: "cliente",
        select: "nombre email numeroCliente empresa",
      })
      .sort({ fechaCreacion: -1 });
  }

  // Cambiar estado de dispositivo
  static async changeDeviceStatus(
    id: string,
    newStatus: string
  ): Promise<IDispositivo | null> {
    const device = await Dispositivo.findByIdAndUpdate(
      id,
      {
        estado: newStatus,
        fechaActualizacion: new Date(),
      },
      { new: true }
    ).populate({
      path: "cliente",
      select: "nombre email numeroCliente empresa",
    });

    if (device) {
      // Notificar via WebSocket
      websocketClient.notifyStatusChange(
        (device._id as any).toString(),
        newStatus,
        (device as any).nombre
      );
    }

    return device;
  }

  // Obtener estadísticas globales del sistema
  static async obtenerEstadisticasGlobales(): Promise<Record<string, unknown>> {
    const stats = await Dispositivo.aggregate([
      {
        $group: {
          _id: null,
          totalDispositivos: { $sum: 1 },
          activos: {
            $sum: { $cond: [{ $eq: ["$estado", "activo"] }, 1, 0] },
          },
          inactivos: {
            $sum: { $cond: [{ $eq: ["$estado", "inactivo"] }, 1, 0] },
          },
          mantenimiento: {
            $sum: { $cond: [{ $eq: ["$estado", "mantenimiento"] }, 1, 0] },
          },
          porTipo: {
            $push: {
              tipo: "$tipoDispositivo",
              estado: "$estado",
            },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalDispositivos: 0,
        activos: 0,
        inactivos: 0,
        mantenimiento: 0,
        porTipo: [],
      }
    );
  }
}
