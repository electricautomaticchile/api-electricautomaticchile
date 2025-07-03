import ExcelJS from "exceljs";
import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import fs from "fs";
import zlib from "zlib";
import {
  IColumnaReporte,
  IResultadoReporte,
  IConfiguracionReporte,
} from "./types";
import { ReportePDFService } from "./ReportePDFService";

export class ReporteGenerador {
  // Generar buffer Excel
  static async generarExcelBuffer(
    titulo: string,
    datos: any[],
    columnas: IColumnaReporte[]
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Electric Automatic Chile";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Datos");

    // Título
    worksheet.mergeCells(
      "A1:" + String.fromCharCode(65 + columnas.length - 1) + "1"
    );
    const titleCell = worksheet.getCell("A1");
    titleCell.value = titulo;
    titleCell.font = { bold: true, size: 16, color: { argb: "FFEA580C" } };
    titleCell.alignment = { horizontal: "center" };

    // Info
    worksheet.mergeCells(
      "A2:" + String.fromCharCode(65 + columnas.length - 1) + "2"
    );
    const infoCell = worksheet.getCell("A2");
    infoCell.value = `Generado: ${new Date().toLocaleDateString("es-CL")} ${new Date().toLocaleTimeString("es-CL")}`;
    infoCell.font = { size: 10, color: { argb: "FF666666" } };
    infoCell.alignment = { horizontal: "center" };

    // Headers
    const headerRow = worksheet.getRow(4);
    columnas.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = col.header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEA580C" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      worksheet.getColumn(index + 1).width = col.width || 15;
    });

    // Datos
    datos.forEach((fila, filaIndex) => {
      const dataRow = worksheet.getRow(filaIndex + 5);
      columnas.forEach((col, colIndex) => {
        const cell = dataRow.getCell(colIndex + 1);
        let valor = fila[col.key];

        // Formatear según tipo
        switch (col.type) {
          case "date":
            if (valor) {
              valor = new Date(valor).toLocaleDateString("es-CL");
            }
            break;
          case "currency":
            if (typeof valor === "number") {
              cell.numFmt = '"$"#,##0';
              cell.value = valor;
              return;
            }
            break;
        }

        cell.value = valor || "";
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // Generar buffer CSV
  static async generarCSVBuffer(
    datos: any[],
    columnas: IColumnaReporte[]
  ): Promise<Buffer> {
    const tmpPath = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpPath)) {
      fs.mkdirSync(tmpPath, { recursive: true });
    }

    const fileName = `reporte_${Date.now()}.csv`;
    const filePath = path.join(tmpPath, fileName);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: columnas.map((col) => ({
        id: col.key,
        title: col.header,
      })),
      encoding: "utf8",
    });

    await csvWriter.writeRecords(datos);
    const csvContent = fs.readFileSync(filePath);
    fs.unlinkSync(filePath); // Limpiar archivo temporal

    return csvContent;
  }

  // Generar buffer PDF - NUEVO
  static async generarPDFBuffer(
    titulo: string,
    datos: any[],
    columnas: IColumnaReporte[]
  ): Promise<Buffer> {
    // Validar datos antes de generar PDF
    const validacion = ReportePDFService.validarDatosPDF(datos, columnas);
    if (!validacion.valido) {
      throw new Error(validacion.mensaje);
    }

    return await ReportePDFService.generarPDFBuffer(titulo, datos, columnas);
  }

  // Generar reporte completo con compresión - ACTUALIZADO
  static async generarReporteOptimizado(
    config: IConfiguracionReporte,
    datos: any[],
    columnas: IColumnaReporte[]
  ): Promise<IResultadoReporte> {
    const tiempoInicio = Date.now();

    // Generar buffer según formato
    let buffer: Buffer;

    switch (config.formato) {
      case "excel":
        buffer = await this.generarExcelBuffer(
          `Reporte de ${config.tipo}`,
          datos,
          columnas
        );
        break;
      case "csv":
        buffer = await this.generarCSVBuffer(datos, columnas);
        break;
      case "pdf":
        buffer = await this.generarPDFBuffer(
          `Reporte de ${config.tipo}`,
          datos,
          columnas
        );
        break;
      default:
        throw new Error(`Formato no soportado: ${config.formato}`);
    }

    // Comprimir si el archivo es grande (> 1MB) y no es PDF
    if (buffer.length > 1024 * 1024 && config.formato !== "pdf") {
      buffer = zlib.gzipSync(buffer);
    }

    const tiempoGeneracion = Date.now() - tiempoInicio;
    const estadisticas = {
      totalRegistros: datos.length,
      tamañoArchivo: buffer.length,
      tiempoGeneracion,
    };

    return { buffer, estadisticas };
  }

  // Determinar tipo MIME según formato - ACTUALIZADO
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

  // Generar nombre de archivo según formato - ACTUALIZADO
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

  // Validar configuración de reporte
  static validarConfiguracion(config: IConfiguracionReporte): {
    valido: boolean;
    mensaje?: string;
  } {
    if (!config.tipo) {
      return { valido: false, mensaje: "Tipo de reporte es requerido" };
    }

    if (!config.formato) {
      return { valido: false, mensaje: "Formato de reporte es requerido" };
    }

    const formatosValidos = ["excel", "csv", "pdf"];
    if (!formatosValidos.includes(config.formato)) {
      return {
        valido: false,
        mensaje: `Formato no válido. Formatos soportados: ${formatosValidos.join(", ")}`,
      };
    }

    return { valido: true };
  }
}
