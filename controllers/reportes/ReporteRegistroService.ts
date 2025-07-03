import ReporteGenerado from "../../models/ReporteGenerado";
import { IConfiguracionReporte, IEstadisticasReporte } from "./types";

export class ReporteRegistroService {
  // Crear registro inicial del reporte
  static async crearRegistroReporte(
    config: IConfiguracionReporte
  ): Promise<any> {
    try {
      const nombreArchivo = this.generarNombreArchivo(config);
      const tipoMime = this.determinarTipoMime(config.formato);

      const registro = new ReporteGenerado({
        tipo: config.tipo,
        formato: config.formato,
        usuarioId: config.usuario.id,
        usuarioTipo: config.usuario.tipo,
        empresaId: config.usuario.empresaId,
        filtros: config.filtros,
        estadisticas: {
          totalRegistros: 0,
          tamañoArchivo: 0,
          tiempoGeneracion: 0,
          filtrosAplicados: Object.keys(config.filtros).length,
        },
        metadatos: {
          ipAddress: config.usuario.ipAddress,
          userAgent: config.usuario.userAgent,
          nombreArchivo,
          tipoMime,
        },
      });

      await registro.save();
      return registro;
    } catch (error) {
      console.error("❌ Error creando registro de reporte:", error);
      throw error;
    }
  }

  // Finalizar registro del reporte (exitoso o con error)
  static async finalizarRegistroReporte(
    registroId: string,
    estadisticas: IEstadisticasReporte,
    error?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        estado: error ? "error" : "completado",
        estadisticas,
        fechaActualizacion: new Date(),
      };

      if (error) {
        updateData.error = {
          mensaje: error,
          timestamp: new Date(),
        };
      }

      await ReporteGenerado.findByIdAndUpdate(registroId, updateData);
    } catch (updateError) {
      console.error("❌ Error actualizando registro de reporte:", updateError);
    }
  }

  // Obtener historial de reportes del usuario
  static async obtenerHistorialReportes(
    filtros: any,
    pagination: any
  ): Promise<any> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (Number(page) - 1) * Number(limit);

    const [reportes, total] = await Promise.all([
      ReporteGenerado.find(filtros)
        .sort({ fechaGeneracion: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ReporteGenerado.countDocuments(filtros),
    ]);

    return {
      reportes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  // Obtener estadísticas de uso de reportes
  static async obtenerEstadisticasReportes(
    usuarioId: string,
    empresaId?: string,
    diasAtras: number = 30
  ): Promise<any> {
    // Obtener estadísticas generales
    const estadisticasGenerales = await (
      ReporteGenerado as any
    ).obtenerEstadisticasUso(usuarioId, empresaId);

    // Obtener tendencias
    const tendencias = await (ReporteGenerado as any).obtenerTendenciasUso(
      Number(diasAtras)
    );

    // Estadísticas por tipo de reporte
    const fechaInicio = new Date(
      Date.now() - Number(diasAtras) * 24 * 60 * 60 * 1000
    );

    const estadisticasPorTipo = await ReporteGenerado.aggregate([
      {
        $match: {
          usuarioId: usuarioId,
          fechaGeneracion: { $gte: fechaInicio },
          ...(empresaId && { empresaId: empresaId }),
        },
      },
      {
        $group: {
          _id: {
            tipo: "$tipo",
            formato: "$formato",
          },
          cantidad: { $sum: 1 },
          exitosos: {
            $sum: { $cond: [{ $eq: ["$estado", "completado"] }, 1, 0] },
          },
          errores: { $sum: { $cond: [{ $eq: ["$estado", "error"] }, 1, 0] } },
          tamañoPromedio: { $avg: "$estadisticas.tamañoArchivo" },
          tiempoPromedio: { $avg: "$estadisticas.tiempoGeneracion" },
        },
      },
      { $sort: { cantidad: -1 } },
    ]);

    return {
      general: estadisticasGenerales,
      tendencias,
      porTipo: estadisticasPorTipo,
      periodo: {
        desde: fechaInicio,
        hasta: new Date(),
        dias: Number(diasAtras),
      },
    };
  }

  // Limpiar reportes antiguos
  static async limpiarReportesAntiguos(
    diasAntiguedad: number = 30
  ): Promise<any> {
    const fechaLimite = new Date(
      Date.now() - Number(diasAntiguedad) * 24 * 60 * 60 * 1000
    );

    const resultado = await ReporteGenerado.deleteMany({
      fechaGeneracion: { $lt: fechaLimite },
      estado: { $in: ["completado", "error"] },
    });

    console.log(
      `🧹 Limpieza de reportes: ${resultado.deletedCount} reportes eliminados`
    );

    return {
      eliminados: resultado.deletedCount,
      fechaLimite,
      diasAntiguedad: Number(diasAntiguedad),
    };
  }

  // ===== MÉTODOS PRIVADOS =====

  private static generarNombreArchivo(config: IConfiguracionReporte): string {
    const fecha = new Date().toISOString().split("T")[0];
    const extension = config.formato === "excel" ? "xlsx" : "csv";
    const subtipo = config.filtros.subtipo;
    const tipoCompleto = subtipo ? `${config.tipo}_${subtipo}` : config.tipo;
    return `reporte_${tipoCompleto}_${fecha}.${extension}`;
  }

  private static determinarTipoMime(formato: string): string {
    return formato === "excel"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "text/csv";
  }
}
