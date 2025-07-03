import { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { ReporteUtils } from "./ReporteUtils";
import { ReporteGenerador } from "./ReporteGenerador";
import { ReporteDataService } from "./ReporteDataService";
import { ReporteRegistroService } from "./ReporteRegistroService";
import { IConfiguracionReporte } from "./types";

// Rate limiting para reportes
export const reportesRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 reportes por ventana de 15 min
  message: {
    success: false,
    message:
      "Demasiadas solicitudes de reportes. Intenta de nuevo en 15 minutos.",
    error: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export class ReportesController {
  // ===== MÉTODOS PRINCIPALES DE GENERACIÓN =====

  // Generar reporte de clientes
  static async reporteClientesExcel(
    req: Request,
    res: Response
  ): Promise<void> {
    await ReportesController.procesarReporte(req, res, "clientes");
  }

  // Generar reporte de empresas
  static async reporteEmpresasExcel(
    req: Request,
    res: Response
  ): Promise<void> {
    await ReportesController.procesarReporte(req, res, "empresas");
  }

  // Generar reporte de cotizaciones
  static async reporteCotizacionesExcel(
    req: Request,
    res: Response
  ): Promise<void> {
    await ReportesController.procesarReporte(req, res, "cotizaciones");
  }

  // Generar reporte de estadísticas
  static async reporteEstadisticasExcel(
    req: Request,
    res: Response
  ): Promise<void> {
    const { subtipo } = req.params;
    await ReportesController.procesarReporte(req, res, "estadisticas", subtipo);
  }

  // Generar reporte de consumo sectorial
  static async reporteConsumoSectorialExcel(
    req: Request,
    res: Response
  ): Promise<void> {
    const { subtipo } = req.params;
    await ReportesController.procesarReporte(
      req,
      res,
      "consumo-sectorial",
      subtipo
    );
  }

  // ===== MÉTODOS CSV =====

  static async reporteCotizacionesCSV(req: Request, res: Response) {
    req.query.formato = "csv";
    return ReportesController.reporteCotizacionesExcel(req, res);
  }

  static async reporteEstadisticasCSV(req: Request, res: Response) {
    req.query.formato = "csv";
    return ReportesController.reporteEstadisticasExcel(req, res);
  }

  static async reporteConsumoSectorialCSV(req: Request, res: Response) {
    req.query.formato = "csv";
    return ReportesController.reporteConsumoSectorialExcel(req, res);
  }

  // ===== MÉTODOS PDF - NUEVOS =====

  static async reporteClientesPDF(req: Request, res: Response): Promise<void> {
    req.query.formato = "pdf";
    await ReportesController.procesarReporte(req, res, "clientes");
  }

  static async reporteEmpresasPDF(req: Request, res: Response): Promise<void> {
    req.query.formato = "pdf";
    await ReportesController.procesarReporte(req, res, "empresas");
  }

  static async reporteCotizacionesPDF(
    req: Request,
    res: Response
  ): Promise<void> {
    req.query.formato = "pdf";
    await ReportesController.procesarReporte(req, res, "cotizaciones");
  }

  static async reporteEstadisticasPDF(
    req: Request,
    res: Response
  ): Promise<void> {
    const { subtipo } = req.params;
    req.query.formato = "pdf";
    await ReportesController.procesarReporte(req, res, "estadisticas", subtipo);
  }

  static async reporteConsumoSectorialPDF(
    req: Request,
    res: Response
  ): Promise<void> {
    const { subtipo } = req.params;
    req.query.formato = "pdf";
    await ReportesController.procesarReporte(
      req,
      res,
      "consumo-sectorial",
      subtipo
    );
  }

  // ===== MÉTODOS DE GESTIÓN =====

  // Obtener historial de reportes del usuario
  static async obtenerHistorialReportes(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const usuario = ReporteUtils.extraerContextoUsuario(req);
      const { page = 1, limit = 10, tipo, formato, estado } = req.query;

      // Construir filtros
      const filtros: any = { usuarioId: usuario.id };
      if (usuario.empresaId) filtros.empresaId = usuario.empresaId;
      if (tipo) filtros.tipo = tipo;
      if (formato) filtros.formato = formato;
      if (estado) filtros.estado = estado;

      const resultado = await ReporteRegistroService.obtenerHistorialReportes(
        filtros,
        { page, limit }
      );

      res.json({
        success: true,
        data: resultado,
      });
    } catch (error) {
      console.error("❌ Error obteniendo historial de reportes:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener historial de reportes",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Obtener estadísticas de uso de reportes
  static async obtenerEstadisticasReportes(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const usuario = ReporteUtils.extraerContextoUsuario(req);
      const { diasAtras = 30 } = req.query;

      const estadisticas =
        await ReporteRegistroService.obtenerEstadisticasReportes(
          usuario.id,
          usuario.empresaId,
          Number(diasAtras)
        );

      res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error) {
      console.error("❌ Error obteniendo estadísticas de reportes:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas de reportes",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Eliminar reportes antiguos (cleanup manual)
  static async limpiarReportesAntiguos(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { diasAntiguedad = 30 } = req.query;

      const resultado = await ReporteRegistroService.limpiarReportesAntiguos(
        Number(diasAntiguedad)
      );

      res.json({
        success: true,
        message: `Limpieza completada: ${resultado.eliminados} reportes eliminados`,
        data: resultado,
      });
    } catch (error) {
      console.error("❌ Error en limpieza de reportes:", error);
      res.status(500).json({
        success: false,
        message: "Error en limpieza de reportes",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // ===== MÉTODOS DE CONVENIENCIA =====

  // Generar reporte de consumo sectorial (Excel por defecto)
  static async generarReporteConsumoSectorial(req: Request, res: Response) {
    const formato = (req.query.formato as string) || "excel";
    if (formato === "csv") {
      return ReportesController.reporteConsumoSectorialCSV(req, res);
    } else if (formato === "pdf") {
      return ReportesController.reporteConsumoSectorialPDF(req, res);
    }
    return ReportesController.reporteConsumoSectorialExcel(req, res);
  }

  // Generar reporte de estadísticas (Excel por defecto)
  static async generarReporteEstadisticas(req: Request, res: Response) {
    const formato = (req.query.formato as string) || "excel";
    if (formato === "csv") {
      return ReportesController.reporteEstadisticasCSV(req, res);
    } else if (formato === "pdf") {
      return ReportesController.reporteEstadisticasPDF(req, res);
    }
    return ReportesController.reporteEstadisticasExcel(req, res);
  }

  // Obtener información de formatos disponibles - NUEVO
  static async obtenerFormatosDisponibles(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const formatos = [
        {
          formato: "excel",
          ...ReporteUtils.obtenerInfoFormato("excel"),
          limites: ReporteUtils.obtenerLimitesFormato("excel"),
        },
        {
          formato: "csv",
          ...ReporteUtils.obtenerInfoFormato("csv"),
          limites: ReporteUtils.obtenerLimitesFormato("csv"),
        },
        {
          formato: "pdf",
          ...ReporteUtils.obtenerInfoFormato("pdf"),
          limites: ReporteUtils.obtenerLimitesFormato("pdf"),
        },
      ];

      res.json({
        success: true,
        data: formatos,
      });
    } catch (error) {
      console.error("❌ Error obteniendo formatos:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener formatos disponibles",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Obtener estadísticas de dispositivos en tiempo real (placeholder)
  static async obtenerEstadisticasDispositivosTiempoReal(
    req: Request,
    res: Response
  ) {
    try {
      const { empresaId } = req.params;
      res.status(200).json({
        success: true,
        message: "Endpoint en desarrollo",
        data: {
          empresaId,
          dispositivosActivos: 0,
          consumoPromedio: 0,
          ultimaActualizacion: new Date(),
        },
      });
    } catch (error) {
      console.error("Error obtener estadísticas tiempo real:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // ===== MÉTODO PRINCIPAL UNIFICADO =====

  private static async procesarReporte(
    req: Request,
    res: Response,
    tipo: string,
    subtipo?: string
  ): Promise<void> {
    let registro: any = null;

    try {
      // Extraer parámetros
      const { formato = "excel" } = req.query;
      let filtros = req.query;

      // Manejar filtros en JSON string
      if (typeof req.query.filtros === "string") {
        try {
          filtros = { ...filtros, ...JSON.parse(req.query.filtros) };
        } catch (e) {
          // Si no se puede parsear, usar filtros originales
        }
      }

      // Agregar subtipo si existe
      if (subtipo) {
        filtros = { ...filtros, subtipo };
      }

      const usuario = ReporteUtils.extraerContextoUsuario(req);

      // Configuración del reporte
      const config: IConfiguracionReporte = {
        tipo: tipo as any,
        formato: formato as "excel" | "csv" | "pdf",
        filtros,
        usuario,
      };

      // Validar configuración
      const validacionConfig = ReporteGenerador.validarConfiguracion(config);
      if (!validacionConfig.valido) {
        res.status(400).json({
          success: false,
          message: validacionConfig.mensaje,
        });
        return;
      }

      // Log de auditoría - INICIADO
      ReporteUtils.logAuditoriaReporte(config, "INICIADO");

      // Crear registro de seguimiento
      registro = await ReporteRegistroService.crearRegistroReporte(config);

      console.log(
        `📊 [HÍBRIDO] Generando reporte de ${tipo} en formato ${formato}:`,
        {
          registroId: registro._id,
          subtipo,
          formato,
          usuario: usuario.id,
        }
      );

      // Obtener datos según el tipo
      let datosReporte;
      switch (tipo) {
        case "clientes":
          datosReporte = await ReporteDataService.obtenerDatosClientes(filtros);
          break;
        case "empresas":
          datosReporte = await ReporteDataService.obtenerDatosEmpresas(filtros);
          break;
        case "cotizaciones":
          datosReporte =
            await ReporteDataService.obtenerDatosCotizaciones(filtros);
          break;
        case "estadisticas":
          datosReporte =
            await ReporteDataService.obtenerDatosEstadisticas(filtros);
          break;
        case "consumo-sectorial":
          datosReporte =
            await ReporteDataService.obtenerDatosConsumoSectorial(filtros);
          break;
        default:
          throw new Error(`Tipo de reporte no soportado: ${tipo}`);
      }

      // Validar compatibilidad de formato con los datos
      const validacionCompatibilidad =
        ReporteUtils.validarCompatibilidadFormato(
          formato as string,
          datosReporte.datos,
          datosReporte.columnas
        );

      if (!validacionCompatibilidad.valido) {
        res.status(400).json({
          success: false,
          message: validacionCompatibilidad.mensaje,
          sugerencia:
            formato === "pdf"
              ? "Use formato Excel o CSV para datasets grandes"
              : "Reduzca los filtros para obtener menos datos",
        });
        return;
      }

      // Generar reporte
      const { buffer, estadisticas } =
        await ReporteGenerador.generarReporteOptimizado(
          config,
          datosReporte.datos,
          datosReporte.columnas
        );

      console.log(
        `📋 [HÍBRIDO] ${estadisticas.totalRegistros} registros encontrados para el reporte ${String(formato).toUpperCase()}`
      );
      console.log(
        `📊 [HÍBRIDO] Reporte ${String(formato).toUpperCase()} generado en ${estadisticas.tiempoGeneracion}ms, tamaño: ${(estadisticas.tamañoArchivo / 1024).toFixed(2)}KB`
      );

      // Finalizar registro exitoso
      await ReporteRegistroService.finalizarRegistroReporte(
        registro._id,
        estadisticas
      );

      // Log de auditoría - EXITOSO
      ReporteUtils.logAuditoriaReporte(config, "EXITOSO");

      // Enviar respuesta
      ReportesController.enviarRespuestaReporte(
        res,
        buffer,
        estadisticas,
        config,
        registro._id,
        subtipo
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";

      console.error(`❌ [HÍBRIDO] Error generando reporte de ${tipo}:`, error);

      // Finalizar registro con error
      if (registro) {
        await ReporteRegistroService.finalizarRegistroReporte(
          registro._id,
          { totalRegistros: 0, tamañoArchivo: 0, tiempoGeneracion: 0 },
          errorMessage
        );
      }

      res.status(500).json({
        success: false,
        message: `Error al generar reporte de ${tipo}`,
        error: errorMessage,
        reporteId: registro?._id,
      });
    }
  }

  private static enviarRespuestaReporte(
    res: Response,
    buffer: Buffer,
    estadisticas: any,
    config: IConfiguracionReporte,
    registroId: string,
    subtipo?: string
  ): void {
    const esComprimido = ReporteUtils.debeComprimir(
      config.formato,
      estadisticas.tamañoArchivo
    );
    const nombreArchivo = ReporteUtils.generarNombreArchivo(
      config.tipo,
      config.formato,
      subtipo
    );
    const tipoMime = ReporteUtils.determinarTipoMime(config.formato);

    // Headers de contenido
    res.setHeader("Content-Type", tipoMime);

    if (esComprimido) {
      res.setHeader("Content-Encoding", "gzip");
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreArchivo}"`
    );

    // Headers de metadata
    res.setHeader(
      "X-Reporte-Registros",
      estadisticas.totalRegistros.toString()
    );
    res.setHeader("X-Reporte-Tiempo", estadisticas.tiempoGeneracion.toString());
    res.setHeader("X-Reporte-ID", registroId);
    res.setHeader("X-Reporte-Formato", config.formato);

    if (subtipo) {
      res.setHeader("X-Reporte-Subtipo", subtipo);
    }

    res.send(buffer);
  }
}
