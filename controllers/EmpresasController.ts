import { Request, Response } from "express";
import Empresa, {
  IEmpresa,
  ICrearEmpresa,
  IActualizarEmpresa,
} from "../models/Empresa";
import mongoose from "mongoose";

export class EmpresasController {
  // GET /api/empresas
  obtenerTodas = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 10,
        estado,
        ciudad,
        region,
        search,
      } = req.query;

      const filtros: any = {};

      if (estado && estado !== "todos") {
        filtros.estado = estado;
      }

      if (ciudad) {
        filtros.ciudad = { $regex: ciudad as string, $options: "i" };
      }

      if (region) {
        filtros.region = { $regex: region as string, $options: "i" };
      }

      if (search) {
        filtros.$or = [
          { nombreEmpresa: { $regex: search as string, $options: "i" } },
          { razonSocial: { $regex: search as string, $options: "i" } },
          { rut: { $regex: search as string, $options: "i" } },
          { numeroCliente: { $regex: search as string, $options: "i" } },
        ];
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const empresas = await Empresa.find(filtros)
        .select("-password +passwordVisible")
        .sort({ fechaCreacion: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await Empresa.countDocuments(filtros);

      res.status(200).json({
        success: true,
        data: empresas,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener empresas",
        error: error instanceof Error ? error.message : "Error desconocido",
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

      const empresa = await Empresa.findById(id).select(
        "-password +passwordVisible"
      );

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
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener empresa",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // POST /api/empresas
  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const datosEmpresa: ICrearEmpresa = req.body;

      // Validaciones básicas
      if (
        !datosEmpresa.nombreEmpresa ||
        !datosEmpresa.razonSocial ||
        !datosEmpresa.rut ||
        !datosEmpresa.correo
      ) {
        res.status(400).json({
          success: false,
          message: "Nombre, razón social, RUT y correo son requeridos",
        });
        return;
      }

      // Verificar RUT único
      const rutExiste = await Empresa.findByRut(datosEmpresa.rut);
      if (rutExiste) {
        res.status(400).json({
          success: false,
          message: "El RUT ya está registrado",
        });
        return;
      }

      // Verificar correo único
      const correoExiste = await Empresa.findByCorreo(datosEmpresa.correo);
      if (correoExiste) {
        res.status(400).json({
          success: false,
          message: "El correo ya está registrado",
        });
        return;
      }

      // Crear nueva empresa (la contraseña se genera automáticamente)
      const nuevaEmpresa = new Empresa(datosEmpresa);

      // Ya no generar contraseña manualmente - dejar que el middleware se encargue
      await nuevaEmpresa.save();

      // Obtener empresa creada con passwordVisible usando select simple
      const empresaCreada = await Empresa.findById(nuevaEmpresa._id).select(
        "+passwordVisible -password"
      );

      // Usar passwordVisible de la consulta o de la instancia como fallback
      const passwordFinal =
        empresaCreada?.passwordVisible || nuevaEmpresa.passwordVisible;

      res.status(201).json({
        success: true,
        message: "Empresa creada exitosamente",
        data: empresaCreada,
        credenciales: {
          numeroCliente: empresaCreada?.numeroCliente,
          correo: empresaCreada?.correo,
          password: passwordFinal,
          passwordTemporal: empresaCreada?.passwordTemporal,
          mensaje: "Credenciales para acceso al dashboard de empresa",
        },
      });
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
          success: false,
          message: "Error de validación",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      } else if (
        error instanceof Error &&
        error.message.includes("duplicate key")
      ) {
        res.status(400).json({
          success: false,
          message: "RUT o correo ya registrado",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Error al crear empresa",
          error: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }
  };

  // PUT /api/empresas/:id
  actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const datosActualizacion: IActualizarEmpresa = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de empresa inválido",
        });
        return;
      }

      // Verificar que la empresa existe
      const empresa = await Empresa.findById(id);
      if (!empresa) {
        res.status(404).json({
          success: false,
          message: "Empresa no encontrada",
        });
        return;
      }

      // Verificar RUT único si se está actualizando
      if (datosActualizacion.rut) {
        const rutExiste = await Empresa.findOne({
          rut: datosActualizacion.rut.toUpperCase(),
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

      // Verificar correo único si se está actualizando
      if (datosActualizacion.correo) {
        const correoExiste = await Empresa.findOne({
          correo: datosActualizacion.correo.toLowerCase(),
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

      // Actualizar fechas según estado
      if (datosActualizacion.estado) {
        if (datosActualizacion.estado === "suspendido") {
          datosActualizacion.fechaSuspension = new Date();
        } else if (
          datosActualizacion.estado === "activo" &&
          empresa.estado !== "activo"
        ) {
          datosActualizacion.fechaActivacion = new Date();
          datosActualizacion.motivoSuspension = undefined;
        }
      }

      const empresaActualizada = await Empresa.findByIdAndUpdate(
        id,
        { ...datosActualizacion, fechaActualizacion: new Date() },
        { new: true, runValidators: true }
      ).select("-password +passwordVisible");

      res.status(200).json({
        success: true,
        message: "Empresa actualizada exitosamente",
        data: empresaActualizada,
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
          message: "Error al actualizar empresa",
          error: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }
  };

  // DELETE /api/empresas/:id (soft delete - cambiar a inactivo)
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

      const empresa = await Empresa.findById(id);
      if (!empresa) {
        res.status(404).json({
          success: false,
          message: "Empresa no encontrada",
        });
        return;
      }

      // Soft delete - cambiar estado a inactivo
      await Empresa.findByIdAndUpdate(id, {
        estado: "inactivo",
        fechaActualizacion: new Date(),
      });

      res.status(200).json({
        success: true,
        message: "Empresa marcada como inactiva exitosamente",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al eliminar empresa",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // PUT /api/empresas/:id/cambiar-estado
  cambiarEstado = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { estado, motivoSuspension } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de empresa inválido",
        });
        return;
      }

      if (!["activo", "suspendido", "inactivo"].includes(estado)) {
        res.status(400).json({
          success: false,
          message: "Estado inválido. Debe ser: activo, suspendido o inactivo",
        });
        return;
      }

      const actualizacion: any = {
        estado,
        fechaActualizacion: new Date(),
      };

      if (estado === "suspendido") {
        actualizacion.fechaSuspension = new Date();
        if (motivoSuspension) {
          actualizacion.motivoSuspension = motivoSuspension;
        }
      } else if (estado === "activo") {
        actualizacion.fechaActivacion = new Date();
        actualizacion.motivoSuspension = null;
      }

      const empresaActualizada = await Empresa.findByIdAndUpdate(
        id,
        actualizacion,
        { new: true }
      ).select("-password +passwordVisible");

      if (!empresaActualizada) {
        res.status(404).json({
          success: false,
          message: "Empresa no encontrada",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Estado cambiado a ${estado} exitosamente`,
        data: empresaActualizada,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al cambiar estado de empresa",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // POST /api/empresas/:id/resetear-password
  resetearPassword = async (req: Request, res: Response): Promise<void> => {
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

      // Generar nueva contraseña temporal
      const nuevaPassword = Empresa.generarPasswordTemporal();
      empresa.password = nuevaPassword;
      empresa.passwordTemporal = true;
      await empresa.save();

      // Obtener empresa actualizada
      const empresaActualizada = await Empresa.findById(id).select(
        "-password +passwordVisible"
      );

      res.status(200).json({
        success: true,
        message: "Contraseña reseteada exitosamente",
        data: empresaActualizada,
        nuevaPassword: nuevaPassword,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al resetear contraseña",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // GET /api/empresas/estadisticas
  obtenerEstadisticas = async (req: Request, res: Response): Promise<void> => {
    try {
      const totalEmpresas = await Empresa.countDocuments();
      const empresasActivas = await Empresa.countDocuments({
        estado: "activo",
      });
      const empresasSuspendidas = await Empresa.countDocuments({
        estado: "suspendido",
      });
      const empresasInactivas = await Empresa.countDocuments({
        estado: "inactivo",
      });

      const ultimasEmpresas = await Empresa.find()
        .sort({ fechaCreacion: -1 })
        .limit(5)
        .select("-password +passwordVisible");

      const empresasPorRegion = await Empresa.aggregate([
        {
          $group: {
            _id: "$region",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

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
          porRegion: empresasPorRegion,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };
}
