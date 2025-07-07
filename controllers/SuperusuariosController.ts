import { Request, Response } from "express";
import Superusuario, {
  ISuperusuario,
  ICrearSuperusuario,
  IActualizarSuperusuario,
} from "../models/Superusuario";
import mongoose from "mongoose";

export class SuperusuariosController {
  // GET /api/superusuarios
  obtenerTodos = async (req: Request, res: Response): Promise<void> => {
    try {
      const superusuarios = await Superusuario.findActivos().select(
        "-password +passwordVisible"
      );
      res.status(200).json({
        success: true,
        data: superusuarios,
        total: superusuarios.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener superusuarios",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // POST /api/superusuarios
  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const datosSuperusuario: ICrearSuperusuario = req.body;

      // Validaciones básicas
      if (
        !datosSuperusuario.nombre ||
        !datosSuperusuario.correo ||
        !datosSuperusuario.password
      ) {
        res.status(400).json({
          success: false,
          message: "Nombre, correo y contraseña son requeridos",
        });
        return;
      }

      // Validar contraseña segura
      if (datosSuperusuario.password.length < 8) {
        res.status(400).json({
          success: false,
          message: "La contraseña debe tener al menos 8 caracteres",
        });
        return;
      }

      // Verificar correo único
      const correoExiste = await Superusuario.findByCorreo(
        datosSuperusuario.correo
      );
      if (correoExiste) {
        res.status(400).json({
          success: false,
          message: "El correo ya está registrado",
        });
        return;
      }

      // Crear nuevo superusuario
      const nuevoSuperusuario = new Superusuario(datosSuperusuario);
      await nuevoSuperusuario.save();

      // Devolver superusuario con contraseña visible pero sin hash
      const superusuarioSinPassword = await Superusuario.findById(
        nuevoSuperusuario._id
      ).select("-password +passwordVisible");

      res.status(201).json({
        success: true,
        message: "Superusuario creado exitosamente",
        data: superusuarioSinPassword,
        credenciales: {
          numeroCliente: superusuarioSinPassword?.numeroCliente,
          correo: superusuarioSinPassword?.correo,
          password: superusuarioSinPassword?.passwordVisible, // Mostrar contraseña original
          mensaje: "Guarde estas credenciales de forma segura",
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
          message: "El correo ya está registrado",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Error al crear superusuario",
          error: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }
  };

  // GET /api/superusuarios/estadisticas
  obtenerEstadisticas = async (req: Request, res: Response): Promise<void> => {
    try {
      const totalSuperusuarios = await Superusuario.countDocuments();
      const superusuariosActivos = await Superusuario.countDocuments({
        activo: true,
      });

      const ultimosSuperusuarios = await Superusuario.find()
        .sort({ fechaCreacion: -1 })
        .limit(5)
        .select("-password +passwordVisible");

      res.status(200).json({
        success: true,
        data: {
          total: totalSuperusuarios,
          activos: superusuariosActivos,
          ultimos: ultimosSuperusuarios,
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

  // PUT /api/superusuarios/:id
  actualizar = async (req: Request, res: Response): Promise<void> => {
    console.log("[SUPERADMIN] PUT actualizar", req.params.id, req.body);
    try {
      const { id } = req.params;
      const datosActualizacion: Partial<IActualizarSuperusuario> = req.body;

      // Verificar ID válido
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "ID de superusuario inválido",
        });
        return;
      }

      const superusuario = await Superusuario.findById(id);
      if (!superusuario) {
        res.status(404).json({
          success: false,
          message: "Superusuario no encontrado",
        });
        return;
      }

      // Evitar cambiar campos sensibles directamente
      if (datosActualizacion.password) {
        delete datosActualizacion.password;
      }

      // Actualizar campos permitidos
      Object.assign(superusuario, datosActualizacion, {
        fechaActualizacion: new Date(),
      });

      await superusuario.save();

      const superusuarioActualizado = await Superusuario.findById(id).select(
        "-password +passwordVisible"
      );

      console.log("[SUPERADMIN] Actualizado OK", superusuarioActualizado);
      res.status(200).json({
        success: true,
        message: "Superusuario actualizado correctamente",
        data: superusuarioActualizado,
      });
    } catch (error) {
      console.error("[SUPERADMIN] Error actualizar", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar superusuario",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };
}
