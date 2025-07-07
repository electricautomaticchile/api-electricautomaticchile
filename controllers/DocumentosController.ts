import { Request, Response } from "express";
import {
  IDocumento,
  ICrearDocumento,
  IActualizarDocumento,
} from "../models/Documento";
import { s3DocsService } from "../lib/s3DocsService";
import { DocumentoModel } from "../models/DocumentoModel";

// Simulamos una base de datos en memoria
let documentos: IDocumento[] = [
  {
    id: 1,
    nombre: "manual_motor_electrico.pdf",
    nombreOriginal: "Manual Motor Eléctrico.pdf",
    url: "https://ejemplo.s3.amazonaws.com/documentos/manual_motor_electrico.pdf",
    tipo: "application/pdf",
    tamaño: 1024000,
    extension: "pdf",
    entidadTipo: "producto",
    entidadId: 1,
    usuarioSubida: 1,
    fechaSubida: new Date(),
    esPublico: true,
    categoria: "manual",
    activo: true,
  },
];

let nextId = 2;

export class DocumentosController {
  // GET /api/documentos
  obtenerTodos = (req: Request, res: Response): void => {
    try {
      const { entidadTipo, entidadId, categoria, esPublico, limite, pagina } =
        req.query;

      let documentosFiltrados = documentos.filter((d) => d.activo);

      // Filtros
      if (entidadTipo) {
        documentosFiltrados = documentosFiltrados.filter(
          (d) => d.entidadTipo === entidadTipo
        );
      }
      if (entidadId) {
        documentosFiltrados = documentosFiltrados.filter(
          (d) => d.entidadId === Number(entidadId)
        );
      }
      if (categoria) {
        documentosFiltrados = documentosFiltrados.filter(
          (d) => d.categoria === categoria
        );
      }
      if (esPublico !== undefined) {
        documentosFiltrados = documentosFiltrados.filter(
          (d) => d.esPublico === (esPublico === "true")
        );
      }

      // Paginación
      const limitNum = limite ? Number(limite) : 10;
      const paginaNum = pagina ? Number(pagina) : 1;
      const offset = (paginaNum - 1) * limitNum;
      const documentosPaginados = documentosFiltrados.slice(
        offset,
        offset + limitNum
      );

      res.status(200).json({
        success: true,
        data: documentosPaginados,
        meta: {
          total: documentosFiltrados.length,
          pagina: paginaNum,
          limite: limitNum,
          totalPaginas: Math.ceil(documentosFiltrados.length / limitNum),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener documentos",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // GET /api/documentos/:id
  obtenerPorId = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const documento = documentos.find((d) => d.id === id && d.activo);

      if (!documento) {
        res.status(404).json({
          success: false,
          message: "Documento no encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: documento,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener documento",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // GET /api/documentos/entidad/:tipo/:id
  obtenerPorEntidad = (req: Request, res: Response): void => {
    try {
      const { tipo, id } = req.params;
      const entidadId = parseInt(id);

      const documentosEntidad = documentos.filter(
        (d) => d.entidadTipo === tipo && d.entidadId === entidadId && d.activo
      );

      res.status(200).json({
        success: true,
        data: documentosEntidad,
        total: documentosEntidad.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener documentos de la entidad",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // POST /api/documentos
  crear = (req: Request, res: Response): void => {
    try {
      const datosDocumento: ICrearDocumento = req.body;

      // Validaciones básicas
      if (
        !datosDocumento.nombre ||
        !datosDocumento.url ||
        !datosDocumento.entidadTipo ||
        !datosDocumento.entidadId
      ) {
        res.status(400).json({
          success: false,
          message:
            "Nombre, URL, tipo de entidad y ID de entidad son requeridos",
        });
        return;
      }

      const nuevoDocumento: IDocumento = {
        id: nextId++,
        ...datosDocumento,
        esPublico: datosDocumento.esPublico || false,
        categoria: datosDocumento.categoria || "documento",
        fechaSubida: new Date(),
        activo: true,
      };

      documentos.push(nuevoDocumento);

      res.status(201).json({
        success: true,
        message: "Documento creado exitosamente",
        data: nuevoDocumento,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al crear documento",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // POST /api/documentos/upload
  subirArchivo = async (req: Request, res: Response): Promise<void> => {
    try {
      // Archivo subido por multer
      const file = req.file;
      const { entidadTipo, entidadId, usuarioSubida, categoria, descripcion } =
        req.body;

      const isPublicForm = req.headers["x-form-type"] === "contacto";

      const finalEntidadTipo =
        entidadTipo || (isPublicForm ? "cliente" : undefined);
      const finalEntidadId = isPublicForm ? 0 : Number(entidadId);
      const finalUsuarioSubida = isPublicForm ? 0 : Number(usuarioSubida);

      if (
        !file ||
        !finalEntidadTipo ||
        finalEntidadId === undefined ||
        finalUsuarioSubida === undefined
      ) {
        res.status(400).json({
          success: false,
          message:
            "Archivo, tipo de entidad, ID de entidad y usuario son requeridos",
        });
        return;
      }

      // Generar nombre único y key para S3
      const timestamp = Date.now();
      const extension = file.originalname.split(".").pop() || "bin";
      const emailFolder = (req.body.email || "sin_email")
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "_");
      const key = `documentos/cotizaciones/${emailFolder}/${timestamp}_${file.originalname}`;

      // Subir a S3
      const urlArchivo = await s3DocsService.uploadFile(
        file.buffer,
        key,
        file.mimetype
      );

      const nuevoDocumento: IDocumento = {
        id: nextId++,
        nombre: `${timestamp}_${file.originalname}`,
        nombreOriginal: file.originalname,
        url: urlArchivo,
        tipo: file.mimetype,
        tamaño: file.size,
        extension,
        entidadTipo: finalEntidadTipo,
        entidadId: finalEntidadId,
        usuarioSubida: finalUsuarioSubida,
        descripcion,
        categoria: categoria || "documento",
        esPublico: true,
        fechaSubida: new Date(),
        activo: true,
      };

      documentos.push(nuevoDocumento);

      await DocumentoModel.create({
        nombre: nuevoDocumento.nombre,
        nombreOriginal: nuevoDocumento.nombreOriginal,
        url: urlArchivo,
        tipo: file.mimetype,
        tamaño: file.size,
        extension,
        entidadTipo: finalEntidadTipo,
        entidadId: finalEntidadId,
        usuarioSubida: finalUsuarioSubida,
        descripcion,
        categoria: categoria || "documento",
        esPublico: true,
      });

      res.status(201).json({
        success: true,
        message: "Archivo subido exitosamente",
        data: nuevoDocumento,
      });
    } catch (error) {
      console.error("Error al subir archivo:", error);
      res.status(500).json({
        success: false,
        message: "Error al subir archivo",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // PUT /api/documentos/:id
  actualizar = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const datosActualizacion: IActualizarDocumento = req.body;

      const documentoIndex = documentos.findIndex((d) => d.id === id);
      if (documentoIndex === -1) {
        res.status(404).json({
          success: false,
          message: "Documento no encontrado",
        });
        return;
      }

      documentos[documentoIndex] = {
        ...documentos[documentoIndex],
        ...datosActualizacion,
        fechaActualizacion: new Date(),
      };

      res.status(200).json({
        success: true,
        message: "Documento actualizado exitosamente",
        data: documentos[documentoIndex],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al actualizar documento",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // DELETE /api/documentos/:id
  eliminar = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const documentoIndex = documentos.findIndex((d) => d.id === id);

      if (documentoIndex === -1) {
        res.status(404).json({
          success: false,
          message: "Documento no encontrado",
        });
        return;
      }

      // Soft delete
      documentos[documentoIndex].activo = false;
      documentos[documentoIndex].fechaActualizacion = new Date();

      res.status(200).json({
        success: true,
        message: "Documento eliminado exitosamente",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al eliminar documento",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // GET /api/documentos/estadisticas
  obtenerEstadisticas = (req: Request, res: Response): void => {
    try {
      const totalDocumentos = documentos.filter((d) => d.activo).length;
      const documentosPorTipo = {
        cliente: documentos.filter(
          (d) => d.entidadTipo === "cliente" && d.activo
        ).length,
        cotizacion: documentos.filter(
          (d) => d.entidadTipo === "cotizacion" && d.activo
        ).length,
        venta: documentos.filter((d) => d.entidadTipo === "venta" && d.activo)
          .length,
        producto: documentos.filter(
          (d) => d.entidadTipo === "producto" && d.activo
        ).length,
        usuario: documentos.filter(
          (d) => d.entidadTipo === "usuario" && d.activo
        ).length,
      };

      const documentosPorCategoria = {
        reporte_tecnico: documentos.filter(
          (d) => d.categoria === "reporte_tecnico" && d.activo
        ).length,
        imagen: documentos.filter((d) => d.categoria === "imagen" && d.activo)
          .length,
        documento: documentos.filter(
          (d) => d.categoria === "documento" && d.activo
        ).length,
        manual: documentos.filter((d) => d.categoria === "manual" && d.activo)
          .length,
        factura: documentos.filter((d) => d.categoria === "factura" && d.activo)
          .length,
        otro: documentos.filter((d) => d.categoria === "otro" && d.activo)
          .length,
      };

      const tamañoTotal = documentos
        .filter((d) => d.activo)
        .reduce((acc, d) => acc + d.tamaño, 0);

      res.status(200).json({
        success: true,
        data: {
          total: totalDocumentos,
          porTipoEntidad: documentosPorTipo,
          porCategoria: documentosPorCategoria,
          tamañoTotalMB: Math.round(tamañoTotal / (1024 * 1024)),
          publicos: documentos.filter((d) => d.esPublico && d.activo).length,
          privados: documentos.filter((d) => !d.esPublico && d.activo).length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas de documentos",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };
}
