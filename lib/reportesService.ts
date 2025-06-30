import ExcelJS from "exceljs";
import { createObjectCsvWriter } from "csv-writer";
// import puppeteer from "puppeteer"; // Comentado para build sin puppeteer
import path from "path";
import fs from "fs";

export interface IReporteConfig {
  titulo: string;
  subtitulo?: string;
  datos: any[];
  columnas: {
    key: string;
    header: string;
    width?: number;
    type?: "string" | "number" | "date" | "currency";
  }[];
  filtros?: { [key: string]: any };
  empresa?: {
    nombre: string;
    logo?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
  };
  usuario?: {
    nombre: string;
    email: string;
    rol: string;
  };
}

export interface IEstadisticasReporte {
  totalRegistros: number;
  resumen: { [key: string]: any };
  graficos?: {
    tipo: "bar" | "line" | "pie";
    datos: any[];
    titulo: string;
  }[];
}

export class ReportesService {
  // Generar reporte en Excel
  static async generarExcel(
    config: IReporteConfig,
    estadisticas?: IEstadisticasReporte
  ): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();

      // Metadatos del libro
      workbook.creator = config.usuario?.nombre || "Electric Automatic Chile";
      workbook.lastModifiedBy = config.usuario?.nombre || "Sistema";
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.lastPrinted = new Date();

      // Hoja principal de datos
      const worksheet = workbook.addWorksheet("Datos", {
        pageSetup: {
          paperSize: 9, // A4
          orientation: "landscape",
          fitToPage: true,
          margins: {
            left: 0.7,
            right: 0.7,
            top: 0.75,
            bottom: 0.75,
            header: 0.3,
            footer: 0.3,
          },
        },
      });

      // Configurar header del reporte
      let rowIndex = 1;

      // Logo y título de la empresa
      if (config.empresa) {
        worksheet.mergeCells(
          `A${rowIndex}:${String.fromCharCode(65 + config.columnas.length - 1)}${rowIndex}`
        );
        const titleCell = worksheet.getCell(`A${rowIndex}`);
        titleCell.value = config.empresa.nombre;
        titleCell.font = { bold: true, size: 16, color: { argb: "FF1F2937" } };
        titleCell.alignment = { horizontal: "center" };
        rowIndex += 2;
      }

      // Título del reporte
      worksheet.mergeCells(
        `A${rowIndex}:${String.fromCharCode(65 + config.columnas.length - 1)}${rowIndex}`
      );
      const reportTitleCell = worksheet.getCell(`A${rowIndex}`);
      reportTitleCell.value = config.titulo;
      reportTitleCell.font = {
        bold: true,
        size: 14,
        color: { argb: "FFEA580C" },
      };
      reportTitleCell.alignment = { horizontal: "center" };
      rowIndex++;

      // Subtítulo
      if (config.subtitulo) {
        worksheet.mergeCells(
          `A${rowIndex}:${String.fromCharCode(65 + config.columnas.length - 1)}${rowIndex}`
        );
        const subtitleCell = worksheet.getCell(`A${rowIndex}`);
        subtitleCell.value = config.subtitulo;
        subtitleCell.font = { size: 12, color: { argb: "FF6B7280" } };
        subtitleCell.alignment = { horizontal: "center" };
        rowIndex++;
      }

      // Información de generación
      worksheet.mergeCells(
        `A${rowIndex}:${String.fromCharCode(65 + config.columnas.length - 1)}${rowIndex}`
      );
      const infoCell = worksheet.getCell(`A${rowIndex}`);
      infoCell.value = `Generado: ${new Date().toLocaleDateString("es-CL")} ${new Date().toLocaleTimeString("es-CL")} | Usuario: ${config.usuario?.nombre || "Sistema"}`;
      infoCell.font = { size: 10, color: { argb: "FF9CA3AF" } };
      infoCell.alignment = { horizontal: "center" };
      rowIndex += 2;

      // Filtros aplicados
      if (config.filtros && Object.keys(config.filtros).length > 0) {
        const filtrosStr = Object.entries(config.filtros)
          .filter(
            ([_, value]) =>
              value !== undefined && value !== null && value !== ""
          )
          .map(([key, value]) => `${key}: ${value}`)
          .join(" | ");

        if (filtrosStr) {
          worksheet.mergeCells(
            `A${rowIndex}:${String.fromCharCode(65 + config.columnas.length - 1)}${rowIndex}`
          );
          const filtersCell = worksheet.getCell(`A${rowIndex}`);
          filtersCell.value = `Filtros aplicados: ${filtrosStr}`;
          filtersCell.font = {
            size: 10,
            italic: true,
            color: { argb: "FF6B7280" },
          };
          filtersCell.alignment = { horizontal: "left" };
          rowIndex += 2;
        }
      }

      // Estadísticas resumen
      if (estadisticas) {
        const resumenCell = worksheet.getCell(`A${rowIndex}`);
        resumenCell.value = "RESUMEN ESTADÍSTICO";
        resumenCell.font = {
          bold: true,
          size: 12,
          color: { argb: "FF1F2937" },
        };
        rowIndex++;

        Object.entries(estadisticas.resumen).forEach(([key, value]) => {
          const keyCell = worksheet.getCell(`A${rowIndex}`);
          const valueCell = worksheet.getCell(`B${rowIndex}`);
          keyCell.value = key;
          valueCell.value = value;
          keyCell.font = { bold: true };
          rowIndex++;
        });
        rowIndex++;
      }

      // Headers de las columnas
      const headerRow = worksheet.getRow(rowIndex);
      config.columnas.forEach((col, index) => {
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
        cell.alignment = { horizontal: "center", vertical: "middle" };

        // Configurar ancho de columna
        worksheet.getColumn(index + 1).width = col.width || 15;
      });
      rowIndex++;

      // Datos
      config.datos.forEach((fila) => {
        const dataRow = worksheet.getRow(rowIndex);
        config.columnas.forEach((col, index) => {
          const cell = dataRow.getCell(index + 1);
          let valor = fila[col.key];

          // Formatear según el tipo
          switch (col.type) {
            case "date":
              if (valor) {
                valor = new Date(valor).toLocaleDateString("es-CL");
              }
              break;
            case "currency":
              if (typeof valor === "number") {
                valor = new Intl.NumberFormat("es-CL", {
                  style: "currency",
                  currency: "CLP",
                }).format(valor);
              }
              break;
            case "number":
              if (typeof valor === "number") {
                valor = new Intl.NumberFormat("es-CL").format(valor);
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

          // Alternar color de filas
          if (rowIndex % 2 === 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF9FAFB" },
            };
          }
        });
        rowIndex++;
      });

      // Hoja de estadísticas adicionales si existe
      if (estadisticas && estadisticas.graficos) {
        const statsWorksheet = workbook.addWorksheet("Estadísticas");

        let statsRow = 1;
        estadisticas.graficos.forEach((grafico, index) => {
          // Título del gráfico
          const chartTitleCell = statsWorksheet.getCell(`A${statsRow}`);
          chartTitleCell.value = grafico.titulo;
          chartTitleCell.font = { bold: true, size: 14 };
          statsRow += 2;

          // Headers
          if (grafico.datos.length > 0) {
            const keys = Object.keys(grafico.datos[0]);
            keys.forEach((key, keyIndex) => {
              const headerCell = statsWorksheet.getCell(statsRow, keyIndex + 1);
              headerCell.value = key;
              headerCell.font = { bold: true };
            });
            statsRow++;

            // Datos del gráfico
            grafico.datos.forEach((dato) => {
              keys.forEach((key, keyIndex) => {
                const dataCell = statsWorksheet.getCell(statsRow, keyIndex + 1);
                dataCell.value = dato[key];
              });
              statsRow++;
            });
            statsRow += 2;
          }
        });
      }

      // Generar buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      console.error("Error generando Excel:", error);
      throw new Error(
        `Error al generar reporte Excel: ${error instanceof Error ? error.message : "Error desconocido"}`
      );
    }
  }

  // Generar reporte en CSV
  static async generarCSV(config: IReporteConfig): Promise<Buffer> {
    try {
      const tmpPath = path.join(process.cwd(), "tmp");
      if (!fs.existsSync(tmpPath)) {
        fs.mkdirSync(tmpPath, { recursive: true });
      }

      const fileName = `reporte_${Date.now()}.csv`;
      const filePath = path.join(tmpPath, fileName);

      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: config.columnas.map((col) => ({
          id: col.key,
          title: col.header,
        })),
        encoding: "utf8",
      });

      // Formatear datos según el tipo de columna
      const datosFormateados = config.datos.map((fila) => {
        const filaFormateada: any = {};
        config.columnas.forEach((col) => {
          let valor = fila[col.key];

          switch (col.type) {
            case "date":
              if (valor) {
                valor = new Date(valor).toLocaleDateString("es-CL");
              }
              break;
            case "currency":
              if (typeof valor === "number") {
                valor = valor.toString();
              }
              break;
          }

          filaFormateada[col.key] = valor || "";
        });
        return filaFormateada;
      });

      await csvWriter.writeRecords(datosFormateados);

      const csvContent = fs.readFileSync(filePath);

      // Limpiar archivo temporal
      fs.unlinkSync(filePath);

      return csvContent;
    } catch (error) {
      console.error("Error generando CSV:", error);
      throw new Error(
        `Error al generar reporte CSV: ${error instanceof Error ? error.message : "Error desconocido"}`
      );
    }
  }

  // Generar reporte en PDF
  static async generarPDF(
    config: IReporteConfig,
    estadisticas?: IEstadisticasReporte
  ): Promise<Buffer> {
    // Funcionalidad de PDF deshabilitada temporalmente - requiere puppeteer
    throw new Error(
      "Generación de PDF no disponible en esta versión. Use Excel o CSV como alternativa."
    );

    /*
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      // HTML del reporte
      const html = this.generarHTMLReporte(config, estadisticas);

      await page.setContent(html, { waitUntil: "domcontentloaded" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        landscape: config.columnas.length > 6,
        margin: {
          top: "20mm",
          right: "15mm",
          bottom: "20mm",
          left: "15mm",
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="width: 100%; font-size: 10px; text-align: center; color: #666;">
            ${config.titulo}
          </div>
        `,
        footerTemplate: `
          <div style="width: 100%; font-size: 10px; text-align: center; color: #666;">
            <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
            <span style="float: right;">Generado: ${new Date().toLocaleDateString("es-CL")}</span>
          </div>
        `,
      });

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      console.error("Error generando PDF:", error);
      throw new Error(
        `Error al generar reporte PDF: ${error instanceof Error ? error.message : "Error desconocido"}`
      );
    }
    */
  }

  // Generar HTML para el reporte
  private static generarHTMLReporte(
    config: IReporteConfig,
    estadisticas?: IEstadisticasReporte
  ): string {
    const filtrosHtml =
      config.filtros && Object.keys(config.filtros).length > 0
        ? Object.entries(config.filtros)
            .filter(
              ([_, value]) =>
                value !== undefined && value !== null && value !== ""
            )
            .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
            .join(" | ")
        : "";

    const estadisticasHtml = estadisticas
      ? `
        <div class="estadisticas">
          <h3>Resumen Estadístico</h3>
          <div class="resumen-grid">
            ${Object.entries(estadisticas.resumen)
              .map(
                ([key, value]) =>
                  `<div class="stat-item">
                <span class="stat-label">${key}:</span>
                <span class="stat-value">${value}</span>
              </div>`
              )
              .join("")}
          </div>
        </div>
      `
      : "";

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${config.titulo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #ea580c;
            padding-bottom: 15px;
          }
          .header h1 {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 5px;
          }
          .header h2 {
            color: #ea580c;
            font-size: 18px;
            margin-bottom: 5px;
          }
          .header .subtitle {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .header .info {
            color: #9ca3af;
            font-size: 10px;
          }
          .filtros {
            background: #f3f4f6;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-size: 10px;
          }
          .estadisticas {
            margin-bottom: 25px;
            padding: 15px;
            background: #f9fafb;
            border-radius: 5px;
          }
          .estadisticas h3 {
            color: #1f2937;
            margin-bottom: 10px;
          }
          .resumen-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
          }
          .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }
          .stat-label {
            font-weight: bold;
          }
          .stat-value {
            color: #ea580c;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #ea580c;
            color: white;
            font-weight: bold;
            text-align: center;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          tr:hover {
            background-color: #f3f4f6;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
            border-top: 1px solid #d1d5db;
            padding-top: 10px;
          }
          @media print {
            body { font-size: 10px; }
            .header h1 { font-size: 20px; }
            .header h2 { font-size: 16px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${config.empresa ? `<h1>${config.empresa.nombre}</h1>` : ""}
          <h2>${config.titulo}</h2>
          ${config.subtitulo ? `<div class="subtitle">${config.subtitulo}</div>` : ""}
          <div class="info">
            Generado: ${new Date().toLocaleDateString("es-CL")} ${new Date().toLocaleTimeString("es-CL")} |
            Usuario: ${config.usuario?.nombre || "Sistema"}
          </div>
        </div>

        ${filtrosHtml ? `<div class="filtros"><strong>Filtros aplicados:</strong> ${filtrosHtml}</div>` : ""}

        ${estadisticasHtml}

        <table>
          <thead>
            <tr>
              ${config.columnas.map((col) => `<th>${col.header}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${config.datos
              .map(
                (fila) => `
              <tr>
                ${config.columnas
                  .map((col) => {
                    let valor = fila[col.key];
                    switch (col.type) {
                      case "date":
                        valor = valor
                          ? new Date(valor).toLocaleDateString("es-CL")
                          : "";
                        break;
                      case "currency":
                        valor =
                          typeof valor === "number"
                            ? new Intl.NumberFormat("es-CL", {
                                style: "currency",
                                currency: "CLP",
                              }).format(valor)
                            : valor;
                        break;
                      case "number":
                        valor =
                          typeof valor === "number"
                            ? new Intl.NumberFormat("es-CL").format(valor)
                            : valor;
                        break;
                    }
                    return `<td>${valor || ""}</td>`;
                  })
                  .join("")}
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>Este reporte fue generado automáticamente por el sistema Electric Automatic Chile</p>
          <p>Total de registros: ${config.datos.length}</p>
        </div>
      </body>
      </html>
    `;
  }

  // Método utilitario para crear configuración estándar
  static crearConfiguracion(
    titulo: string,
    datos: any[],
    columnas: any[],
    opciones?: Partial<IReporteConfig>
  ): IReporteConfig {
    return {
      titulo,
      datos,
      columnas,
      empresa: {
        nombre: "Electric Automatic Chile",
        email: "contacto@electricautomaticchile.com",
        ...opciones?.empresa,
      },
      ...opciones,
    };
  }
}
