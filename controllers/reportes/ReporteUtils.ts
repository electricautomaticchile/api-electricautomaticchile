import { Request } from "express";
import { IUsuarioContexto, IConfiguracionReporte } from "./types";

export class ReporteUtils {
  static extraerContextoUsuario(req: Request): IUsuarioContexto {
    const user = (req as any).user || {};
    const headers = req.headers;

    return {
      id: user.id || user._id || "anonimo",
      tipo: user.tipoUsuario || user.tipo || "cliente",
      empresaId: user.empresaId,
      ipAddress: (req.ip ||
        req.connection?.remoteAddress ||
        "127.0.0.1") as string,
      userAgent: headers["user-agent"] || "unknown",
    };
  }

  static logAuditoriaReporte(
    config: IConfiguracionReporte,
    resultado: "INICIADO" | "EXITOSO" | "ERROR",
    error?: string
  ) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      accion: `REPORTE_${resultado}`,
      tipo: config.tipo,
      formato: config.formato,
      usuario: config.usuario.id,
      empresaId: config.usuario.empresaId,
      filtros: Object.keys(config.filtros).length,
      error,
    };

    console.log(`📋 [AUDITORIA] ${JSON.stringify(logEntry)}`);
  }

  static generarNombreArchivo(
    tipo: string,
    formato: string,
    subtipo?: string
  ): string {
    const fecha = new Date().toISOString().split("T")[0];
    let extension = "";

    switch (formato) {
      case "excel":
        extension = "xlsx";
        break;
      case "csv":
        extension = "csv";
        break;
      case "pdf":
        extension = "pdf";
        break;
      default:
        extension = "bin";
    }

    const tipoCompleto = subtipo ? `${tipo}_${subtipo}` : tipo;
    return `reporte_${tipoCompleto}_${fecha}.${extension}`;
  }

  static determinarTipoMime(formato: string): string {
    switch (formato) {
      case "excel":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "csv":
        return "text/csv; charset=utf-8";
      case "pdf":
        return "application/pdf";
      default:
        return "application/octet-stream";
    }
  }

  static esArchivoGrande(tamaño: number): boolean {
    return tamaño > 1024 * 1024; // > 1MB
  }

  static debeComprimir(formato: string, tamaño: number): boolean {
    if (formato === "pdf") {
      return false;
    }

    return tamaño > 1024 * 1024;
  }

  static obtenerLimitesFormato(formato: string): {
    maxRegistros: number;
    maxColumnas: number;
  } {
    switch (formato) {
      case "pdf":
        return { maxRegistros: 1000, maxColumnas: 8 };
      case "excel":
        return { maxRegistros: 100000, maxColumnas: 50 };
      case "csv":
        return { maxRegistros: 500000, maxColumnas: 100 };
      default:
        return { maxRegistros: 10000, maxColumnas: 20 };
    }
  }

  static validarCompatibilidadFormato(
    formato: string,
    datos: any[],
    columnas: any[]
  ): { valido: boolean; mensaje?: string } {
    const limites = this.obtenerLimitesFormato(formato);

    if (datos.length > limites.maxRegistros) {
      return {
        valido: false,
        mensaje: `Demasiados registros para formato ${formato.toUpperCase()}. Máximo: ${limites.maxRegistros.toLocaleString("es-CL")}, encontrados: ${datos.length.toLocaleString("es-CL")}`,
      };
    }

    if (columnas.length > limites.maxColumnas) {
      return {
        valido: false,
        mensaje: `Demasiadas columnas para formato ${formato.toUpperCase()}. Máximo: ${limites.maxColumnas}, encontradas: ${columnas.length}`,
      };
    }

    return { valido: true };
  }

  static obtenerInfoFormato(formato: string): {
    nombre: string;
    descripcion: string;
    extension: string;
  } {
    switch (formato) {
      case "excel":
        return {
          nombre: "Microsoft Excel",
          descripcion: "Formato de hoja de cálculo con estilos y gráficos",
          extension: "xlsx",
        };
      case "csv":
        return {
          nombre: "Valores Separados por Comas",
          descripcion:
            "Formato de texto plano compatible con cualquier aplicación",
          extension: "csv",
        };
      case "pdf":
        return {
          nombre: "Documento PDF",
          descripcion:
            "Formato de documento portable para visualización e impresión",
          extension: "pdf",
        };
      default:
        return {
          nombre: "Formato Desconocido",
          descripcion: "Formato no reconocido",
          extension: "bin",
        };
    }
  }
}
