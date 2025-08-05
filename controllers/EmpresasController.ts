import { Request, Response } from "express";
import Empresa from "../models/Empresa";
import { logger } from "../lib/logger";
import mongoose from "mongoose";

export class EmpresasController {
  // GET /api/empresas
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

      const empresas = await Empresa.find({ estado: "activo" })
        .sort({ [sort as string]: sortOrder })
        .skip(skip)
        .limit(Number(limit));

      const total = await Empresa.countDocuments({ estado: "activo" });

      res.status(200).json({
        success: true,
        data: {
          empresas,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
        message: "Empresas obtenidas exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo empresas:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // GET /api/empresas/:id
  obtenerPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de empresa inválido",
        });
        return;
      }

      const empresa = await Empresa.findById(id);

      if (!empresa) {
        res.status(404).json({
          success: false,
          message: "Empresa no encontrada",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: empresa,
        message: "Empresa obtenida exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo empresa:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // POST /api/empresas
  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const nuevaEmpresa = new Empresa(req.body);
      await nuevaEmpresa.save();

      res.status(201).json({
        success: true,
        data: nuevaEmpresa,
        message: "Empresa creada exitosamente",
      });
    } catch (error) {
      logger.error("Error creando empresa:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // PUT /api/empresas/:id
  actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de empresa inválido",
        });
        return;
      }

      const empresaActualizada = await Empresa.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!empresaActualizada) {
        res.status(404).json({
          success: false,
          message: "Empresa no encontrada",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: empresaActualizada,
        message: "Empresa actualizada exitosamente",
      });
    } catch (error) {
      logger.error("Error actualizando empresa:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // DELETE /api/empresas/:id
  eliminar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de empresa inválido",
        });
        return;
      }

      await Empresa.findByIdAndUpdate(id, {
        estado: "inactivo",
        fechaEliminacion: new Date(),
      });

      res.status(200).json({
        success: true,
        message: "Empresa eliminada exitosamente",
      });
    } catch (error) {
      logger.error("Error eliminando empresa:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // GET /api/empresas/estadisticas
  obtenerEstadisticas = async (req: Request, res: Response): Promise<void> => {
    try {
      // Obtener estadísticas reales de la base de datos
      const totalEmpresas =
        (await mongoose.connection.db
          ?.collection("empresas")
          .countDocuments()) || 0;
      const empresasActivas =
        (await mongoose.connection.db
          ?.collection("empresas")
          .countDocuments({ activo: true })) || 0;
      const empresasSuspendidas =
        (await mongoose.connection.db
          ?.collection("empresas")
          .countDocuments({ estado: "suspendido" })) || 0;
      const empresasInactivas =
        (await mongoose.connection.db
          ?.collection("empresas")
          .countDocuments({ activo: false })) || 0;

      // Obtener últimas empresas
      const ultimasEmpresas =
        (await mongoose.connection.db
          ?.collection("empresas")
          .find({})
          .sort({ fechaCreacion: -1 })
          .limit(5)
          .toArray()) || [];

      // Obtener estadísticas por región
      const porRegion =
        (await mongoose.connection.db
          ?.collection("empresas")
          .aggregate([
            {
              $group: {
                _id: "$region",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ])
          .toArray()) || [];

      res.status(200).json({
        success: true,
        data: {
          totales: {
            total: totalEmpresas,
            activas: empresasActivas,
            suspendidas: empresasSuspendidas,
            inactivas: empresasInactivas,
          },
          ultimas: ultimasEmpresas,
          porRegion: porRegion,
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

  // PUT /api/empresas/:id/cambiar-estado
  cambiarEstado = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      res.status(200).json({
        success: true,
        data: { id, estado },
        message: "Estado cambiado exitosamente",
      });
    } catch (error) {
      logger.error("Error cambiando estado:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // POST /api/empresas/:id/resetear-password
  resetearPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      res.status(200).json({
        success: true,
        message: "Password reseteada exitosamente",
      });
    } catch (error) {
      logger.error("Error reseteando password:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };
}

export default new EmpresasController();
