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
    let yActual = 0; // Empezar desde arriba sin espacio

    // 1. Header integrado con logo y título (NEGRO)
    yActual = this.crearHeaderCompleto(doc, titulo, yActual);

    // 2. Información del reporte
    yActual = this.agregarInfo(doc, datos.length, yActual);

    // 3. Tabla o mensaje de sin datos
    this.crearTabla(doc, datos, columnas, yActual);

    // 4. Pie al final de la página (posición fija)
    this.agregarPieAlFinal(doc, 1);
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

  private static crearTabla(
    doc: PDFKit.PDFDocument,
    datos: any[],
    columnas: IColumnaReporte[],
    yInicial: number
  ): void {
    // Si no hay datos
    if (!datos || datos.length === 0) {
      doc
        .fillColor(TEMA_CORPORATIVO.texto)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("No hay datos para mostrar", 40, yInicial + 20);
      return; // Pie al final fijo
    }

    let y = yInicial;
    const margen = 40;
    const anchoTabla = doc.page.width - margen * 2;
    const anchoColumna = anchoTabla / columnas.length;
    const alturaFila = 20;
    let paginaActual = 1;

    // Header tabla (NARANJA ORIGINAL)
    y = this.headerTabla(doc, columnas, margen, y, anchoTabla, anchoColumna);

    doc.fillColor(TEMA_CORPORATIVO.texto).fontSize(8).font("Helvetica");

    for (let i = 0; i < datos.length; i++) {
      const fila = datos[i];

      // Si no hay espacio suficiente para la siguiente fila + pie (50px)
      if (y + alturaFila + 50 > doc.page.height) {
        // Pie en página actual
        this.agregarPieAlFinal(doc, paginaActual);
        // Solo agregar nueva página si aún quedan filas por imprimir
        if (i < datos.length) {
          doc.addPage();
          paginaActual++;
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
      }

      // Dibujar fila
      const colorFondo = i % 2 === 0 ? "#F9FAFB" : "#FFFFFF";
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
    }

    // Pie en la última página
    this.agregarPieAlFinal(doc, paginaActual);
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

  // Pie al final de la página (posición fija)
  private static agregarPieAlFinal(
    doc: PDFKit.PDFDocument,
    numeroPagina: number
  ): void {
    const yPie = doc.page.height - 40;

    // Línea separadora
    doc
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .moveTo(40, yPie)
      .lineTo(doc.page.width - 40, yPie)
      .stroke();

    // Pie en posición fija al final
    doc
      .fillColor("#6B7280")
      .fontSize(8)
      .text(
        "Electricautomaticchile | " +
          new Date().toLocaleDateString("es-CL") +
          " | Confidencial | Página " +
          numeroPagina,
        40,
        yPie + 10
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
