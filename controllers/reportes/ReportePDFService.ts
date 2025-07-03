import PDFDocument from "pdfkit";
import { IColumnaReporte, IOpcionesPDF } from "./types";
import fs from "fs";
import path from "path";

const TEMA_CORPORATIVO = {
  primario: "#EA580C",
  texto: "#374151",
  headerNegro: "#000000",
};

export class ReportePDFService {
  static async generarPDFBuffer(
    titulo: string,
    datos: any[],
    columnas: IColumnaReporte[],
    opciones?: IOpcionesPDF
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        console.log("📄 [PDF] Generando reporte:", titulo);

        const validacion = this.validarDatosPDF(datos, columnas);
        if (!validacion.valido) {
          reject(new Error(validacion.mensaje));
          return;
        }

        const doc = new PDFDocument({
          size: "A4",
          layout: "portrait",
          margin: 40,
          info: {
            Title: titulo,
            Author: "Electricautomaticchile",
            Subject: "Reporte de datos",
          },
        });

        const buffers: Buffer[] = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          console.log("✅ [PDF] PDF generado");
          resolve(Buffer.concat(buffers));
        });
        doc.on("error", reject);

        // Crear TODO en una sola página
        this.crearPaginaCompleta(doc, titulo, datos, columnas);

        doc.end();
      } catch (error) {
        console.error("❌ [PDF] Error:", error);
        reject(error);
      }
    });
  }

  private static crearPaginaCompleta(
    doc: PDFKit.PDFDocument,
    titulo: string,
    datos: any[],
    columnas: IColumnaReporte[]
  ): void {
    let yActual = 0;

    yActual = this.crearHeaderCompleto(doc, titulo, yActual);
    yActual = this.agregarInfo(doc, datos.length, yActual);

    // Crear tabla Y pie en la misma página
    this.crearTablaConPie(doc, datos, columnas, yActual);
  }

  private static crearHeaderCompleto(
    doc: PDFKit.PDFDocument,
    titulo: string,
    y: number
  ): number {
    // Header con fondo negro desde el borde superior
    doc.rect(0, y, doc.page.width, 80).fill("#000000");

    // Logo integrado en el header
    this.agregarLogoEnHeader(doc, y);

    // Título junto al logo
    doc
      .fillColor("#FFFFFF")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text(titulo, 120, y + 25);

    // Info empresa
    doc
      .fontSize(10)
      .text("Electricautomaticchile", doc.page.width - 150, y + 25)
      .text(
        new Date().toLocaleDateString("es-CL"),
        doc.page.width - 150,
        y + 45
      );

    return y + 90;
  }

  private static agregarLogoEnHeader(doc: PDFKit.PDFDocument, y: number): void {
    try {
      const logoPath = path.join(
        __dirname,
        "../../assets/Logo-electricautomaticchile.png"
      );

      if (fs.existsSync(logoPath)) {
        console.log("✅ [PDF] Logo integrado en header");

        // Logo bien centrado en el header
        doc.image(logoPath, 20, y + 15, {
          width: 80,
          height: 50,
          fit: [80, 50],
        });
      } else {
        console.warn("⚠️ [PDF] Logo no encontrado, usando texto");
        this.logoTextoEnHeader(doc, y);
      }
    } catch (error) {
      console.error("❌ [PDF] Error con logo:", error);
      this.logoTextoEnHeader(doc, y);
    }
  }

  private static logoTextoEnHeader(doc: PDFKit.PDFDocument, y: number): void {
    // Círculo para logo de texto en el header
    doc.circle(60, y + 40, 25).fillAndStroke("#FFFFFF", "#FFFFFF");
    doc
      .fillColor(TEMA_CORPORATIVO.primario)
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("EAC", 52, y + 32);
  }

  private static agregarInfo(
    doc: PDFKit.PDFDocument,
    total: number,
    y: number
  ): number {
    // Línea separadora
    doc
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .moveTo(40, y)
      .lineTo(doc.page.width - 40, y)
      .stroke();

    // Info resumida
    doc
      .fillColor(TEMA_CORPORATIVO.texto)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Resumen del Reporte", 40, y + 10);

    doc
      .fontSize(9)
      .font("Helvetica")
      .text(
        "Total: " + total.toLocaleString("es-CL") + " registros",
        40,
        y + 30
      )
      .text("Fecha: " + new Date().toLocaleDateString("es-CL"), 200, y + 30)
      .text("Hora: " + new Date().toLocaleTimeString("es-CL"), 350, y + 30);

    return y + 55;
  }

  private static crearTablaConPie(
    doc: PDFKit.PDFDocument,
    datos: any[],
    columnas: IColumnaReporte[],
    yInicial: number
  ): void {
    if (!datos || datos.length === 0) {
      doc
        .fillColor(TEMA_CORPORATIVO.texto)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("No hay datos para mostrar", 40, yInicial + 20);

      // Pie después del mensaje, mismo página
      this.agregarPieDinamico(doc, yInicial + 60, 1);
      return;
    }

    let y = yInicial;
    const margen = 40;
    const anchoTabla = doc.page.width - margen * 2;
    const anchoColumna = anchoTabla / columnas.length;
    const alturaFila = 20;
    let numeroPagina = 1;

    y = this.headerTabla(doc, columnas, margen, y, anchoTabla, anchoColumna);
    doc.fillColor(TEMA_CORPORATIVO.texto).fontSize(8).font("Helvetica");

    datos.forEach((fila, index) => {
      if (y > doc.page.height - 100) {
        this.agregarPieDinamico(doc, doc.page.height - 40, numeroPagina);
        doc.addPage();
        numeroPagina++;
        y = 40;
        y = this.headerTabla(
          doc,
          columnas,
          margen,
          y,
          anchoTabla,
          anchoColumna
        );
      }

      const colorFondo = index % 2 === 0 ? "#F9FAFB" : "#FFFFFF";
      doc
        .rect(margen, y, anchoTabla, alturaFila)
        .fillAndStroke(colorFondo, "#E5E7EB");
      doc.fillColor(TEMA_CORPORATIVO.texto);

      columnas.forEach((columna, colIndex) => {
        const x = margen + colIndex * anchoColumna;
        let valor = fila[columna.key];

        if (columna.type === "date" && valor) {
          valor = new Date(valor).toLocaleDateString("es-CL");
        } else if (columna.type === "currency" && typeof valor === "number") {
          valor = "$" + valor.toLocaleString("es-CL");
        } else if (columna.type === "number" && typeof valor === "number") {
          valor = valor.toLocaleString("es-CL");
        }

        doc.text(valor?.toString() || "", x + 3, y + 4, {
          width: anchoColumna - 6,
          align: colIndex === 0 ? "left" : "center",
        });
      });

      y += alturaFila;
    });

    // Pie INMEDIATAMENTE después de los datos
    this.agregarPieDinamico(doc, y + 20, numeroPagina);
  }

  private static headerTabla(
    doc: PDFKit.PDFDocument,
    columnas: IColumnaReporte[],
    margen: number,
    y: number,
    anchoTabla: number,
    anchoColumna: number
  ): number {
    doc
      .rect(margen, y, anchoTabla, 25)
      .fillAndStroke(TEMA_CORPORATIVO.primario, TEMA_CORPORATIVO.primario);
    doc.fillColor("#FFFFFF").fontSize(9).font("Helvetica-Bold");

    columnas.forEach((columna, index) => {
      const x = margen + index * anchoColumna;
      doc.text(columna.header, x + 3, y + 6, {
        width: anchoColumna - 6,
        align: "center",
      });
    });

    return y + 30;
  }

  private static agregarPieDinamico(
    doc: PDFKit.PDFDocument,
    yPosition: number,
    numeroPagina: number
  ): void {
    doc
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .moveTo(40, yPosition)
      .lineTo(doc.page.width - 40, yPosition)
      .stroke();

    doc
      .fillColor("#6B7280")
      .fontSize(8)
      .text(
        "Electricautomaticchile | " +
          new Date().toLocaleDateString("es-CL") +
          " | Confidencial | Página " +
          numeroPagina,
        40,
        yPosition + 10
      );
  }

  static generarEstadisticasPDF(
    datos: any[],
    columnas: IColumnaReporte[]
  ): any {
    return { totalRegistros: datos.length };
  }

  static validarDatosPDF(
    datos: any[],
    columnas: IColumnaReporte[]
  ): { valido: boolean; mensaje?: string } {
    if (!datos?.length) return { valido: false, mensaje: "No hay datos" };
    if (!columnas?.length) return { valido: false, mensaje: "No hay columnas" };
    if (columnas.length > 8)
      return { valido: false, mensaje: "Máximo 8 columnas" };
    if (datos.length > 1000)
      return { valido: false, mensaje: "Máximo 1000 registros" };
    return { valido: true };
  }
}
