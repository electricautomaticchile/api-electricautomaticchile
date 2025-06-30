import { Request, Response } from "express";
import ExcelJS from "exceljs";
import { createObjectCsvWriter } from "csv-writer";
import Cliente from "../models/Cliente";
import Empresa from "../models/Empresa";
import Cotizacion from "../models/Cotizacion";
import Dispositivo from "../models/Dispositivo";
import path from "path";
import fs from "fs";

export class ReportesController {
  // Generar reporte de clientes en Excel
  static async reporteClientesExcel(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { empresaId, formato = "excel" } = req.query;
      const filtros =
        typeof req.query.filtros === "string"
          ? JSON.parse(req.query.filtros)
          : req.query.filtros || {};

      console.log("📊 Generando reporte de clientes:", {
        empresaId,
        formato,
        filtros,
      });

      // Construir query con filtros
      let query: any = {};
      if (empresaId) query.empresaId = empresaId;
      if (filtros.activo !== undefined)
        query.activo = filtros.activo === "true";
      if (filtros.tipoCliente) query.tipoCliente = filtros.tipoCliente;
      if (filtros.ciudad)
        query.ciudad = new RegExp(filtros.ciudad as string, "i");

      // Obtener datos
      const clientes = await Cliente.find(query)
        .select(
          "nombre correo telefono rut ciudad tipoCliente planSeleccionado montoMensual fechaCreacion activo numeroCliente"
        )
        .sort({ fechaCreacion: -1 })
        .lean();

      console.log(`📋 ${clientes.length} clientes encontrados para el reporte`);

      // Configurar columnas
      const columnas = [
        { key: "numeroCliente", header: "N° Cliente", width: 15 },
        { key: "nombre", header: "Nombre", width: 25 },
        { key: "correo", header: "Email", width: 30 },
        { key: "telefono", header: "Teléfono", width: 15 },
        { key: "rut", header: "RUT", width: 15 },
        { key: "ciudad", header: "Ciudad", width: 15 },
        { key: "tipoCliente", header: "Tipo", width: 12 },
        { key: "planSeleccionado", header: "Plan", width: 15 },
        {
          key: "montoMensual",
          header: "Monto Mensual",
          width: 15,
          type: "currency",
        },
        {
          key: "fechaCreacion",
          header: "Fecha Registro",
          width: 15,
          type: "date",
        },
        { key: "activo", header: "Estado", width: 10 },
      ];

      // Procesar datos para el reporte
      const datosReporte = clientes.map((cliente) => ({
        ...cliente,
        activo: cliente.activo ? "Activo" : "Inactivo",
        fechaCreacion: cliente.fechaCreacion,
        montoMensual: cliente.montoMensual || 0,
      }));

      if (formato === "excel") {
        const buffer = await ReportesController.generarExcelBuffer(
          "Reporte de Clientes",
          datosReporte,
          columnas
        );

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="reporte_clientes_${new Date().toISOString().split("T")[0]}.xlsx"`
        );
        res.send(buffer);
      } else {
        const csvBuffer = await ReportesController.generarCSVBuffer(
          datosReporte,
          columnas
        );

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="reporte_clientes_${new Date().toISOString().split("T")[0]}.csv"`
        );
        res.send(csvBuffer);
      }
    } catch (error) {
      console.error("❌ Error generando reporte de clientes:", error);
      res.status(500).json({
        success: false,
        message: "Error al generar reporte",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Generar reporte de empresas
  static async reporteEmpresasExcel(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { formato = "excel" } = req.query;
      const filtros =
        typeof req.query.filtros === "string"
          ? JSON.parse(req.query.filtros)
          : req.query.filtros || {};

      // Construir query con filtros
      let query: any = {};
      if (filtros.estado) query.estado = filtros.estado;
      if (filtros.region)
        query.region = new RegExp(filtros.region as string, "i");

      // Obtener datos
      const empresas = await Empresa.find(query)
        .select(
          "nombreEmpresa correo telefono rut region ciudad direccion estado fechaCreacion numeroCliente"
        )
        .sort({ fechaCreacion: -1 })
        .lean();

      // Configurar columnas
      const columnas = [
        { key: "numeroCliente", header: "N° Cliente", width: 15 },
        { key: "nombreEmpresa", header: "Empresa", width: 30 },
        { key: "correo", header: "Email", width: 30 },
        { key: "telefono", header: "Teléfono", width: 15 },
        { key: "rut", header: "RUT", width: 15 },
        { key: "region", header: "Región", width: 20 },
        { key: "ciudad", header: "Ciudad", width: 15 },
        { key: "estado", header: "Estado", width: 12 },
        {
          key: "fechaCreacion",
          header: "Fecha Registro",
          width: 15,
          type: "date",
        },
      ];

      if (formato === "excel") {
        const buffer = await ReportesController.generarExcelBuffer(
          "Reporte de Empresas",
          empresas,
          columnas
        );

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="reporte_empresas_${new Date().toISOString().split("T")[0]}.xlsx"`
        );
        res.send(buffer);
      } else {
        const csvBuffer = await ReportesController.generarCSVBuffer(
          empresas,
          columnas
        );

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="reporte_empresas_${new Date().toISOString().split("T")[0]}.csv"`
        );
        res.send(csvBuffer);
      }
    } catch (error) {
      console.error("❌ Error generando reporte de empresas:", error);
      res.status(500).json({
        success: false,
        message: "Error al generar reporte",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Generar reporte de cotizaciones
  static async reporteCotizacionesExcel(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { formato = "excel" } = req.query;
      const filtros =
        typeof req.query.filtros === "string"
          ? JSON.parse(req.query.filtros)
          : req.query.filtros || {};

      // Construir query con filtros
      let query: any = {};
      if (filtros.estado) query.estado = filtros.estado;
      if (filtros.servicio) query.servicio = filtros.servicio;
      if (filtros.fechaDesde || filtros.fechaHasta) {
        query.fechaCreacion = {};
        if (filtros.fechaDesde)
          query.fechaCreacion.$gte = new Date(filtros.fechaDesde as string);
        if (filtros.fechaHasta)
          query.fechaCreacion.$lte = new Date(filtros.fechaHasta as string);
      }

      // Obtener datos
      const cotizaciones = await Cotizacion.find(query)
        .select(
          "numero nombre email servicio plazo mensaje estado total fechaCreacion fechaActualizacion"
        )
        .sort({ fechaCreacion: -1 })
        .lean();

      // Configurar columnas
      const columnas = [
        { key: "numero", header: "N° Cotización", width: 15 },
        { key: "nombre", header: "Cliente", width: 25 },
        { key: "email", header: "Email", width: 30 },
        { key: "servicio", header: "Servicio", width: 20 },
        { key: "plazo", header: "Plazo", width: 12 },
        { key: "estado", header: "Estado", width: 15 },
        { key: "total", header: "Valor", width: 15, type: "currency" },
        {
          key: "fechaCreacion",
          header: "Fecha Solicitud",
          width: 15,
          type: "date",
        },
        {
          key: "fechaActualizacion",
          header: "Última Actualización",
          width: 15,
          type: "date",
        },
      ];

      if (formato === "excel") {
        const buffer = await ReportesController.generarExcelBuffer(
          "Reporte de Cotizaciones",
          cotizaciones,
          columnas
        );

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="reporte_cotizaciones_${new Date().toISOString().split("T")[0]}.xlsx"`
        );
        res.send(buffer);
      } else {
        const csvBuffer = await ReportesController.generarCSVBuffer(
          cotizaciones,
          columnas
        );

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="reporte_cotizaciones_${new Date().toISOString().split("T")[0]}.csv"`
        );
        res.send(csvBuffer);
      }
    } catch (error) {
      console.error("❌ Error generando reporte de cotizaciones:", error);
      res.status(500).json({
        success: false,
        message: "Error al generar reporte",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Método auxiliar para generar Excel
  private static async generarExcelBuffer(
    titulo: string,
    datos: any[],
    columnas: any[]
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

  // Método auxiliar para generar CSV
  private static async generarCSVBuffer(
    datos: any[],
    columnas: any[]
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
}
