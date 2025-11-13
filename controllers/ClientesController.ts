import { Request, Response } from "express";
import Cliente from "../models/Cliente";
import { logger } from "../lib/logger";
import mongoose from "mongoose";

export class ClientesController {
  // GET /api/clientes
  obtenerTodos = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 10,
        sort = "fechaCreacion",
        order = "desc",
      } = req.query;

      console.log("🔍 Obteniendo clientes desde colección MongoDB...");

      if (!mongoose.connection.db) {
        throw new Error("Base de datos no conectada");
      }

      // Buscar directamente en la colección 'clientes' de MongoDB
      const clientes = await mongoose.connection.db
        .collection("clientes")
        .find({ activo: true })
        .sort({ [sort as string]: order === "asc" ? 1 : -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .toArray();

      const total = await mongoose.connection.db
        .collection("clientes")
        .countDocuments({ activo: true });

      console.log(
        `✅ Encontrados ${clientes.length} clientes de ${total} total`
      );

      res.status(200).json({
        success: true,
        data: clientes, // Devolver directamente el array de clientes
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
        message: "Clientes obtenidos exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo clientes:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // GET /api/clientes/:id
  obtenerPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de cliente inválido",
        });
        return;
      }

      const cliente = await Cliente.findById(id).populate("empresa", "nombre");

      if (!cliente) {
        res.status(404).json({
          success: false,
          message: "Cliente no encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: cliente,
        message: "Cliente obtenido exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo cliente:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // POST /api/clientes
  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const nuevoCliente = new Cliente(req.body);
      await nuevoCliente.save();

      res.status(201).json({
        success: true,
        data: nuevoCliente,
        message: "Cliente creado exitosamente",
      });
    } catch (error) {
      logger.error("Error creando cliente:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // PUT /api/clientes/:id
  actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Intentar actualizar por _id de MongoDB
      if (mongoose.Types.ObjectId.isValid(id)) {
        const clienteActualizado = await Cliente.findByIdAndUpdate(
          id,
          req.body,
          {
            new: true,
            runValidators: true,
          }
        );

        if (clienteActualizado) {
          res.status(200).json({
            success: true,
            data: clienteActualizado,
            message: "Cliente actualizado exitosamente",
          });
          return;
        }
      }

      // Si no es un ObjectId válido o no se encontró, intentar buscar por numeroCliente
      const clienteActualizado = await Cliente.findOneAndUpdate(
        { numeroCliente: id },
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!clienteActualizado) {
        res.status(404).json({
          success: false,
          message: "Cliente no encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: clienteActualizado,
        message: "Cliente actualizado exitosamente",
      });
    } catch (error) {
      logger.error("Error actualizando cliente:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // DELETE /api/clientes/:id
  eliminar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de cliente inválido",
        });
        return;
      }

      await Cliente.findByIdAndUpdate(id, {
        estado: "inactivo",
        fechaEliminacion: new Date(),
      });

      res.status(200).json({
        success: true,
        message: "Cliente eliminado exitosamente",
      });
    } catch (error) {
      logger.error("Error eliminando cliente:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };
}

export default new ClientesController();
