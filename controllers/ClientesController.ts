import { Request, Response } from "express";
import Cliente, {
  ICliente,
  ICrearCliente,
  IActualizarCliente,
} from "../models/Cliente";
import mongoose from "mongoose";

export class ClientesController {
  // GET /api/clientes
  obtenerTodos = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Filtro compatible con ambos esquemas: activo y esActivo
      const filtroActivo = {
        $or: [{ activo: true }, { esActivo: true }],
      };

      const clientes = await Cliente.find(filtroActivo)
        .skip(skip)
        .limit(limit)
        .sort({ fechaCreacion: -1, fechaRegistro: -1 });

      const total = await Cliente.countDocuments(filtroActivo);

      res.status(200).json({
        success: true,
        data: clientes,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener clientes",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // GET /api/clientes/:id
  obtenerPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Validar ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de cliente inválido",
        });
        return;
      }

      // Filtro compatible con ambos esquemas: activo y esActivo
      const filtroActivo = {
        _id: id,
        $or: [{ activo: true }, { esActivo: true }],
      };

      const cliente = await Cliente.findOne(filtroActivo);

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
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener cliente",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // POST /api/clientes
  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const datosCliente: ICrearCliente = req.body;

      // Validaciones básicas
      if (!datosCliente.nombre || !datosCliente.telefono) {
        res.status(400).json({
          success: false,
          message: "Nombre y teléfono son requeridos",
        });
        return;
      }

      // Verificar correo único
      const correoExiste = await Cliente.findOne({
        correo: datosCliente.correo,
      });
      if (correoExiste) {
        res.status(400).json({
          success: false,
          message: "El correo ya está registrado",
        });
        return;
      }

      // Verificar RUT único si se proporciona
      if (datosCliente.rut) {
        const rutExiste = await Cliente.findOne({ rut: datosCliente.rut });
        if (rutExiste) {
          res.status(400).json({
            success: false,
            message: "El RUT ya está registrado",
          });
          return;
        }
      }

      // Crear nuevo cliente
      const nuevoCliente = new Cliente(datosCliente);
      await nuevoCliente.save();

      res.status(201).json({
        success: true,
        message: "Cliente creado exitosamente",
        data: nuevoCliente,
      });
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
          success: false,
          message: "Error de validación",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Error al crear cliente",
          error: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }
  };

  // PUT /api/clientes/:id
  actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const datosActualizacion: IActualizarCliente = req.body;

      // Validar ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de cliente inválido",
        });
        return;
      }

      // Verificar que el cliente existe
      const cliente = await Cliente.findById(id);
      if (!cliente) {
        res.status(404).json({
          success: false,
          message: "Cliente no encontrado",
        });
        return;
      }

      // Verificar correo único si se está actualizando
      if (datosActualizacion.correo) {
        const correoExiste = await Cliente.findOne({
          correo: datosActualizacion.correo,
          _id: { $ne: id },
        });
        if (correoExiste) {
          res.status(400).json({
            success: false,
            message: "El correo ya está registrado",
          });
          return;
        }
      }

      // Verificar RUT único si se está actualizando
      if (datosActualizacion.rut) {
        const rutExiste = await Cliente.findOne({
          rut: datosActualizacion.rut,
          _id: { $ne: id },
        });
        if (rutExiste) {
          res.status(400).json({
            success: false,
            message: "El RUT ya está registrado",
          });
          return;
        }
      }

      // Actualizar cliente
      const clienteActualizado = await Cliente.findByIdAndUpdate(
        id,
        { ...datosActualizacion, fechaActualizacion: new Date() },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: "Cliente actualizado exitosamente",
        data: clienteActualizado,
      });
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
          success: false,
          message: "Error de validación",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Error al actualizar cliente",
          error: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }
  };

  // DELETE /api/clientes/:id
  eliminar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Validar ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de cliente inválido",
        });
        return;
      }

      // Verificar que el cliente existe
      const cliente = await Cliente.findById(id);
      if (!cliente) {
        res.status(404).json({
          success: false,
          message: "Cliente no encontrado",
        });
        return;
      }

      // Soft delete - marcar como inactivo
      await Cliente.findByIdAndUpdate(id, {
        activo: false,
        fechaActualizacion: new Date(),
      });

      res.status(200).json({
        success: true,
        message: "Cliente eliminado exitosamente",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al eliminar cliente",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };
}
