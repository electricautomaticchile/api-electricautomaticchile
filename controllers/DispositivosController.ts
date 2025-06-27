import { Request, Response } from "express";
import Dispositivo, { IDispositivo } from "../models/Dispositivo";
import Cliente from "../models/Cliente";
import { SortOrder } from "mongoose";

export class DispositivosController {
  // Obtener todos los dispositivos con filtros
  static async obtenerDispositivos(req: Request, res: Response): Promise<void> {
    try {
      const {
        cliente,
        estado,
        tipoDispositivo,
        page = 1,
        limit = 10,
        sort = "fechaCreacion",
        order = "desc",
      } = req.query;

      const filtros: any = {};

      if (cliente) filtros.cliente = cliente;
      if (estado) filtros.estado = estado;
      if (tipoDispositivo) filtros.tipoDispositivo = tipoDispositivo;

      const opciones = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: { [sort as string]: (order === "desc" ? -1 : 1) as SortOrder },
        populate: {
          path: "cliente",
          select: "nombre email numeroCliente empresa",
        },
      };

      const dispositivos = await Dispositivo.find(filtros)
        .populate(opciones.populate)
        .sort(opciones.sort)
        .skip((opciones.page - 1) * opciones.limit)
        .limit(opciones.limit);

      const total = await Dispositivo.countDocuments(filtros);

      res.status(200).json({
        success: true,
        data: dispositivos,
        pagination: {
          currentPage: opciones.page,
          totalPages: Math.ceil(total / opciones.limit),
          totalItems: total,
          itemsPerPage: opciones.limit,
        },
      });
    } catch (error) {
      console.error("Error al obtener dispositivos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Obtener un dispositivo por ID
  static async obtenerDispositivo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const dispositivo = await Dispositivo.findById(id).populate(
        "cliente",
        "nombre email numeroCliente empresa telefono"
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
      });
    } catch (error) {
      console.error("Error al obtener dispositivo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Crear nuevo dispositivo
  static async crearDispositivo(req: Request, res: Response): Promise<void> {
    try {
      const datosDispositivo = req.body;

      // Verificar que el cliente existe
      const cliente = await Cliente.findById(datosDispositivo.clienteId);
      if (!cliente) {
        res.status(400).json({
          success: false,
          message: "Cliente no encontrado",
        });
        return;
      }

      // Verificar que el ID del dispositivo sea único
      const dispositivoExistente = await Dispositivo.findOne({
        idDispositivo: datosDispositivo.idDispositivo,
      });

      if (dispositivoExistente) {
        res.status(400).json({
          success: false,
          message: "Ya existe un dispositivo con este ID",
        });
        return;
      }

      // Crear el dispositivo
      const nuevoDispositivo = new Dispositivo({
        ...datosDispositivo,
        cliente: datosDispositivo.clienteId,
        fechaInstalacion: new Date(datosDispositivo.fechaInstalacion),
      });

      await nuevoDispositivo.save();

      // Poblar los datos del cliente antes de responder
      await nuevoDispositivo.populate(
        "cliente",
        "nombre email numeroCliente empresa"
      );

      res.status(201).json({
        success: true,
        message: "Dispositivo creado exitosamente",
        data: nuevoDispositivo,
      });
    } catch (error) {
      console.error("Error al crear dispositivo:", error);

      if (error instanceof Error && error.name === "ValidationError") {
        res.status(400).json({
          success: false,
          message: "Error de validación",
          errors: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Actualizar dispositivo
  static async actualizarDispositivo(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const datosActualizacion = req.body;

      const dispositivo = await Dispositivo.findByIdAndUpdate(
        id,
        datosActualizacion,
        { new: true, runValidators: true }
      ).populate("cliente", "nombre email numeroCliente empresa");

      if (!dispositivo) {
        res.status(404).json({
          success: false,
          message: "Dispositivo no encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Dispositivo actualizado exitosamente",
        data: dispositivo,
      });
    } catch (error) {
      console.error("Error al actualizar dispositivo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Eliminar dispositivo
  static async eliminarDispositivo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const dispositivo = await Dispositivo.findByIdAndDelete(id);

      if (!dispositivo) {
        res.status(404).json({
          success: false,
          message: "Dispositivo no encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Dispositivo eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error al eliminar dispositivo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Agregar nueva lectura a un dispositivo
  static async agregarLectura(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { lecturas } = req.body;

      const dispositivo = await Dispositivo.findById(id);

      if (!dispositivo) {
        res.status(404).json({
          success: false,
          message: "Dispositivo no encontrado",
        });
        return;
      }

      // Agregar las nuevas lecturas
      dispositivo.lecturas.push(
        ...lecturas.map((lectura: any) => ({
          ...lectura,
          timestamp: new Date(),
        }))
      );

      // Actualizar fecha de última conexión
      dispositivo.fechaUltimaConexion = new Date();

      await dispositivo.save();

      res.status(200).json({
        success: true,
        message: "Lecturas agregadas exitosamente",
        data: {
          dispositivo: dispositivo.idDispositivo,
          lecturasAgregadas: lecturas.length,
          ultimaLectura: dispositivo.lecturas[dispositivo.lecturas.length - 1],
        },
      });
    } catch (error) {
      console.error("Error al agregar lectura:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Obtener estadísticas de consumo
  static async obtenerEstadisticasConsumo(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { clienteId } = req.params;
      const { fechaInicio, fechaFin } = req.query;

      const inicio = fechaInicio ? new Date(fechaInicio as string) : undefined;
      const fin = fechaFin ? new Date(fechaFin as string) : undefined;

      const estadisticas = await (
        Dispositivo as any
      ).obtenerEstadisticasConsumo(clienteId, inicio, fin);

      res.status(200).json({
        success: true,
        data: estadisticas[0] || {
          consumoTotal: 0,
          consumoPromedio: 0,
          consumoMaximo: 0,
          consumoMinimo: 0,
          cantidadLecturas: 0,
        },
      });
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Obtener dispositivos inactivos
  static async obtenerDispositivosInactivos(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { dias = 2 } = req.query;

      const dispositivosInactivos = await (
        Dispositivo as any
      ).obtenerDispositivosInactivos(parseInt(dias as string));

      res.status(200).json({
        success: true,
        data: dispositivosInactivos,
        total: dispositivosInactivos.length,
      });
    } catch (error) {
      console.error("Error al obtener dispositivos inactivos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Crear alerta para dispositivo
  static async crearAlerta(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { tipoAlerta, mensaje } = req.body;

      const dispositivo = await Dispositivo.findById(id);

      if (!dispositivo) {
        res.status(404).json({
          success: false,
          message: "Dispositivo no encontrado",
        });
        return;
      }

      const nuevaAlerta = {
        timestamp: new Date(),
        tipoAlerta,
        mensaje,
        esResuelta: false,
      };

      dispositivo.alertas.push(nuevaAlerta);
      await dispositivo.save();

      res.status(201).json({
        success: true,
        message: "Alerta creada exitosamente",
        data: nuevaAlerta,
      });
    } catch (error) {
      console.error("Error al crear alerta:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Resolver alerta
  static async resolverAlerta(req: Request, res: Response): Promise<void> {
    try {
      const { id, alertaId } = req.params;
      const { accionesTomadas } = req.body;

      const dispositivo = await Dispositivo.findById(id);

      if (!dispositivo) {
        res.status(404).json({
          success: false,
          message: "Dispositivo no encontrado",
        });
        return;
      }

      // Buscar la alerta específica en el array
      const alerta = dispositivo.alertas.find(
        (alert: any) => alert._id?.toString() === alertaId
      );

      if (!alerta) {
        res.status(404).json({
          success: false,
          message: "Alerta no encontrada",
        });
        return;
      }

      // Actualizar la alerta
      alerta.esResuelta = true;
      alerta.fechaResolucion = new Date();
      alerta.accionesTomadas = accionesTomadas;

      await dispositivo.save();

      res.status(200).json({
        success: true,
        message: "Alerta resuelta exitosamente",
        data: alerta,
      });
    } catch (error) {
      console.error("Error al resolver alerta:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
