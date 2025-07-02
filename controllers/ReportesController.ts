import { Request, Response } from "express";
import ExcelJS from "exceljs";
import { createObjectCsvWriter } from "csv-writer";
import Cliente from "../models/Cliente";
import Empresa from "../models/Empresa";
import Cotizacion from "../models/Cotizacion";
import Dispositivo from "../models/Dispositivo";
import ReporteGenerado from "../models/ReporteGenerado";
import { ReportesService } from "../lib/reportesService";
import path from "path";
import fs from "fs";
import zlib from "zlib";
import rateLimit from "express-rate-limit";

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

// Interfaz para el contexto de usuario
interface IUsuarioContexto {
  id: string;
  tipo: "empresa" | "superusuario" | "cliente";
  empresaId?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Interfaz para configuración de reporte
interface IConfiguracionReporte {
  tipo:
    | "clientes"
    | "empresas"
    | "cotizaciones"
    | "dispositivos"
    | "estadisticas"
    | "consumo-sectorial";
  formato: "excel" | "csv";
  filtros: any;
  usuario: IUsuarioContexto;
}

export class ReportesController {
  // Método auxiliar para extraer contexto del usuario
  private static extraerContextoUsuario(req: Request): IUsuarioContexto {
    // Extraer información del token JWT o sesión
    const user = (req as any).user;
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
    const userAgent = req.get("User-Agent") || "unknown";

    return {
      id: user?.id || user?.userId || "anonymous",
      tipo: user?.tipo || user?.role || "cliente",
      empresaId: user?.empresaId,
      ipAddress,
      userAgent,
    };
  }

  // Método auxiliar para logging de auditoría
  private static logAuditoriaReporte(
    config: IConfiguracionReporte,
    resultado: "INICIADO" | "EXITOSO" | "ERROR",
    error?: string
  ) {
    const timestamp = new Date().toISOString();
    const logMessage = {
      timestamp,
      tipo: config.tipo,
      formato: config.formato,
      usuario: config.usuario.id,
      usuarioTipo: config.usuario.tipo,
      empresaId: config.usuario.empresaId,
      ipAddress: config.usuario.ipAddress,
      userAgent: config.usuario.userAgent,
      filtros: JSON.stringify(config.filtros),
      resultado,
      error,
    };

    console.log(`📊 [REPORTE_${resultado}]`, logMessage);
  }

  // Método auxiliar para crear registro de reporte
  private static async crearRegistroReporte(
    config: IConfiguracionReporte
  ): Promise<any> {
    try {
      const nombreArchivo = `reporte_${config.tipo}_${new Date().toISOString().split("T")[0]}.${config.formato === "excel" ? "xlsx" : "csv"}`;
      const tipoMime =
        config.formato === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "text/csv";

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

  // Método auxiliar para finalizar registro de reporte
  private static async finalizarRegistroReporte(
    registroId: string,
    estadisticas: {
      totalRegistros: number;
      tamañoArchivo: number;
      tiempoGeneracion: number;
    },
    error?: string
  ) {
    try {
      const registro = await ReporteGenerado.findById(registroId);
      if (registro) {
        if (error) {
          await registro.marcarError(error);
        } else {
          await registro.marcarCompletado(estadisticas);
        }
      }
    } catch (err) {
      console.error("❌ Error finalizando registro de reporte:", err);
    }
  }

  // Método auxiliar para generar reporte optimizado
  private static async generarReporteOptimizado(
    config: IConfiguracionReporte
  ): Promise<{ buffer: Buffer; estadisticas: any }> {
    const tiempoInicio = Date.now();
    let datos: any[] = [];
    let columnas: any[] = [];

    // Obtener datos según el tipo
    switch (config.tipo) {
      case "clientes":
        ({ datos, columnas } = await this.obtenerDatosClientes(config.filtros));
        break;
      case "empresas":
        ({ datos, columnas } = await this.obtenerDatosEmpresas(config.filtros));
        break;
      case "cotizaciones":
        ({ datos, columnas } = await this.obtenerDatosCotizaciones(
          config.filtros
        ));
        break;
      case "estadisticas":
        ({ datos, columnas } = await this.obtenerDatosEstadisticas(
          config.filtros
        ));
        break;
      case "consumo-sectorial":
        ({ datos, columnas } = await this.obtenerDatosConsumoSectorial(
          config.filtros
        ));
        break;
      default:
        throw new Error(`Tipo de reporte no soportado: ${config.tipo}`);
    }

    // Generar buffer según formato
    let buffer: Buffer;
    if (config.formato === "excel") {
      buffer = await this.generarExcelBuffer(
        `Reporte de ${config.tipo}`,
        datos,
        columnas
      );
    } else {
      buffer = await this.generarCSVBuffer(datos, columnas);
    }

    // Comprimir si el archivo es grande (> 1MB)
    if (buffer.length > 1024 * 1024) {
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

  // Obtener datos de clientes con filtros
  private static async obtenerDatosClientes(filtros: any) {
    let query: any = {};
    if (filtros.empresaId) query.empresaId = filtros.empresaId;
    if (filtros.activo !== undefined) query.activo = filtros.activo === "true";
    if (filtros.tipoCliente) query.tipoCliente = filtros.tipoCliente;
    if (filtros.ciudad)
      query.ciudad = new RegExp(filtros.ciudad as string, "i");

    const clientes = await Cliente.find(query)
      .select(
        "nombre correo telefono rut ciudad tipoCliente planSeleccionado montoMensual fechaCreacion activo numeroCliente"
      )
      .sort({ fechaCreacion: -1 })
      .lean();

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

    const datos = clientes.map((cliente) => ({
      ...cliente,
      activo: cliente.activo ? "Activo" : "Inactivo",
      fechaCreacion: cliente.fechaCreacion,
      montoMensual: cliente.montoMensual || 0,
    }));

    return { datos, columnas };
  }

  // Obtener datos de empresas con filtros
  private static async obtenerDatosEmpresas(filtros: any) {
    let query: any = {};
    if (filtros.estado) query.estado = filtros.estado;
    if (filtros.region)
      query.region = new RegExp(filtros.region as string, "i");

    const empresas = await Empresa.find(query)
      .select(
        "nombreEmpresa correo telefono rut region ciudad direccion estado fechaCreacion numeroCliente"
      )
      .sort({ fechaCreacion: -1 })
      .lean();

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

    return { datos: empresas, columnas };
  }

  // Obtener datos de cotizaciones con filtros
  private static async obtenerDatosCotizaciones(filtros: any) {
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

    const cotizaciones = await Cotizacion.find(query)
      .select(
        "numero nombre email servicio plazo mensaje estado total fechaCreacion fechaActualizacion"
      )
      .sort({ fechaCreacion: -1 })
      .lean();

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

    return { datos: cotizaciones, columnas };
  }

  // Obtener datos de estadísticas de consumo
  private static async obtenerDatosEstadisticas(filtros: any) {
    const { subtipo = "mensual", periodo = "nov-2023", empresaId } = filtros;

    // Simulación de datos de estadísticas (en producción vendría de la DB)
    let datos: any[] = [];
    let columnas: any[] = [];

    switch (subtipo) {
      case "mensual":
        datos = this.generarDatosConsumoMensual(periodo);
        columnas = [
          { key: "mes", header: "Mes", width: 15 },
          {
            key: "consumo",
            header: "Consumo (kWh)",
            width: 20,
            type: "number",
          },
          { key: "costo", header: "Costo ($)", width: 20, type: "currency" },
          {
            key: "eficiencia",
            header: "Eficiencia (%)",
            width: 15,
            type: "number",
          },
          {
            key: "variacion",
            header: "Variación (%)",
            width: 15,
            type: "number",
          },
          { key: "pico", header: "Pico (kWh)", width: 15, type: "number" },
          { key: "valle", header: "Valle (kWh)", width: 15, type: "number" },
        ];
        break;

      case "diario":
        datos = this.generarDatosConsumoDiario(periodo);
        columnas = [
          { key: "dia", header: "Día", width: 15 },
          { key: "fecha", header: "Fecha", width: 15, type: "date" },
          {
            key: "consumo",
            header: "Consumo (kWh)",
            width: 20,
            type: "number",
          },
          { key: "costo", header: "Costo ($)", width: 20, type: "currency" },
          {
            key: "eficiencia",
            header: "Eficiencia (%)",
            width: 15,
            type: "number",
          },
          {
            key: "temperatura",
            header: "Temp. Promedio (°C)",
            width: 20,
            type: "number",
          },
          { key: "tipoJornada", header: "Tipo Jornada", width: 15 },
        ];
        break;

      case "horario":
        datos = this.generarDatosConsumoHorario(periodo);
        columnas = [
          { key: "hora", header: "Hora", width: 15 },
          {
            key: "consumo",
            header: "Consumo (kWh)",
            width: 20,
            type: "number",
          },
          { key: "costo", header: "Costo ($)", width: 20, type: "currency" },
          {
            key: "eficiencia",
            header: "Eficiencia (%)",
            width: 15,
            type: "number",
          },
          { key: "demanda", header: "Demanda (%)", width: 15, type: "number" },
          {
            key: "factorCarga",
            header: "Factor Carga",
            width: 15,
            type: "number",
          },
        ];
        break;
    }

    return { datos, columnas };
  }

  // Obtener datos de consumo sectorial
  private static async obtenerDatosConsumoSectorial(filtros: any) {
    const {
      subtipo = "equipamiento",
      periodo = "nov-2023",
      empresaId,
    } = filtros;

    let datos: any[] = [];
    let columnas: any[] = [];

    switch (subtipo) {
      case "equipamiento":
        datos = this.generarDatosConsumoEquipamiento(periodo);
        columnas = [
          { key: "equipamiento", header: "Tipo de Equipamiento", width: 25 },
          {
            key: "consumo",
            header: "Consumo (kWh)",
            width: 20,
            type: "number",
          },
          {
            key: "porcentaje",
            header: "Porcentaje (%)",
            width: 15,
            type: "number",
          },
          { key: "costo", header: "Costo ($)", width: 20, type: "currency" },
          {
            key: "eficiencia",
            header: "Eficiencia (%)",
            width: 15,
            type: "number",
          },
          {
            key: "tendencia",
            header: "Tendencia (%)",
            width: 15,
            type: "number",
          },
          { key: "recomendacion", header: "Recomendación", width: 40 },
        ];
        break;

      case "area":
        datos = this.generarDatosConsumoArea(periodo);
        columnas = [
          { key: "area", header: "Área/Piso", width: 25 },
          {
            key: "consumo",
            header: "Consumo (kWh)",
            width: 20,
            type: "number",
          },
          {
            key: "porcentaje",
            header: "Porcentaje (%)",
            width: 15,
            type: "number",
          },
          { key: "costo", header: "Costo ($)", width: 20, type: "currency" },
          {
            key: "metrosCuadrados",
            header: "Área (m²)",
            width: 15,
            type: "number",
          },
          { key: "consumoPorM2", header: "kWh/m²", width: 15, type: "number" },
          {
            key: "ocupacion",
            header: "Ocupación (%)",
            width: 15,
            type: "number",
          },
        ];
        break;

      case "horario":
        datos = this.generarDatosConsumoFranjaHoraria(periodo);
        columnas = [
          { key: "franjaHoraria", header: "Franja Horaria", width: 20 },
          {
            key: "consumo",
            header: "Consumo (kWh)",
            width: 20,
            type: "number",
          },
          {
            key: "porcentaje",
            header: "Porcentaje (%)",
            width: 15,
            type: "number",
          },
          { key: "costo", header: "Costo ($)", width: 20, type: "currency" },
          {
            key: "tarifaAplicada",
            header: "Tarifa ($/kWh)",
            width: 15,
            type: "number",
          },
          {
            key: "factorDemanda",
            header: "Factor Demanda",
            width: 15,
            type: "number",
          },
          { key: "clasificacion", header: "Clasificación", width: 15 },
        ];
        break;
    }

    return { datos, columnas };
  }

  // Generadores de datos simulados para estadísticas
  private static generarDatosConsumoMensual(periodo: string) {
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    return meses.map((mes, index) => ({
      mes,
      consumo:
        Math.floor(Math.random() * 800) +
        3800 +
        (index > 5 && index < 9 ? 400 : 0),
      costo: Math.floor(Math.random() * 30000) + 120000,
      eficiencia: Math.floor(Math.random() * 15) + 82,
      variacion: (Math.random() - 0.5) * 20,
      pico: Math.floor(Math.random() * 100) + 200,
      valle: Math.floor(Math.random() * 50) + 80,
    }));
  }

  private static generarDatosConsumoDiario(periodo: string) {
    return Array.from({ length: 30 }, (_, i) => ({
      dia: i + 1,
      fecha: new Date(2023, 10, i + 1), // Noviembre 2023
      consumo: Math.floor(Math.random() * 100) + 120 + (i % 7 === 0 ? -20 : 0),
      costo: Math.floor(Math.random() * 3000) + 4000,
      eficiencia: Math.floor(Math.random() * 20) + 80,
      temperatura: Math.floor(Math.random() * 15) + 18,
      tipoJornada: i % 7 === 0 ? "Domingo" : i % 6 === 0 ? "Sábado" : "Laboral",
    }));
  }

  private static generarDatosConsumoHorario(periodo: string) {
    return Array.from({ length: 24 }, (_, i) => ({
      hora: `${i.toString().padStart(2, "0")}:00`,
      consumo:
        Math.floor(Math.random() * 50) +
        (i >= 8 && i <= 18 ? 80 : 30) +
        (i >= 18 && i <= 21 ? 40 : 0),
      costo: Math.floor(Math.random() * 2000) + 1500,
      eficiencia: Math.floor(Math.random() * 25) + 70,
      demanda: Math.floor(Math.random() * 30) + (i >= 8 && i <= 18 ? 60 : 20),
      factorCarga: Math.random() * 0.3 + 0.7,
    }));
  }

  // Generadores de datos simulados para consumo sectorial
  private static generarDatosConsumoEquipamiento(periodo: string) {
    const equipamientos = [
      {
        nombre: "Iluminación",
        base: 2450,
        recomendacion: "Migrar a LED inteligente con sensores",
      },
      {
        nombre: "Climatización",
        base: 2100,
        recomendacion: "Programar temperaturas por zonas",
      },
      {
        nombre: "Equipos de oficina",
        base: 1750,
        recomendacion: "Activar modo ahorro fuera de horario",
      },
      {
        nombre: "Servidores",
        base: 1400,
        recomendacion: "Considerar virtualización",
      },
      {
        nombre: "Cocina/Comedor",
        base: 700,
        recomendacion: "Optimizar horarios de uso",
      },
      {
        nombre: "Otros",
        base: 350,
        recomendacion: "Revisar equipos obsoletos",
      },
    ];

    const total = equipamientos.reduce((sum, eq) => sum + eq.base, 0);

    return equipamientos.map((eq) => {
      const variacion = (Math.random() - 0.5) * 0.2;
      const consumo = Math.floor(eq.base * (1 + variacion));
      return {
        equipamiento: eq.nombre,
        consumo,
        porcentaje: Math.round((consumo / total) * 100),
        costo: Math.floor(consumo * (30 + Math.random() * 10)),
        eficiencia: Math.floor(Math.random() * 20) + 75,
        tendencia: (Math.random() - 0.5) * 20,
        recomendacion: eq.recomendacion,
      };
    });
  }

  private static generarDatosConsumoArea(periodo: string) {
    const areas = [
      { nombre: "Piso 1 - Recepción", base: 1050, m2: 120 },
      { nombre: "Piso 2 - Oficinas", base: 2450, m2: 280 },
      { nombre: "Piso 3 - Administración", base: 1750, m2: 200 },
      { nombre: "Piso 4 - Desarrollo", base: 1925, m2: 220 },
      { nombre: "Piso 5 - Gerencia", base: 1575, m2: 180 },
    ];

    const total = areas.reduce((sum, area) => sum + area.base, 0);

    return areas.map((area) => {
      const variacion = (Math.random() - 0.5) * 0.15;
      const consumo = Math.floor(area.base * (1 + variacion));
      return {
        area: area.nombre,
        consumo,
        porcentaje: Math.round((consumo / total) * 100),
        costo: Math.floor(consumo * (25 + Math.random() * 15)),
        metrosCuadrados: area.m2,
        consumoPorM2: (consumo / area.m2).toFixed(2),
        ocupacion: Math.floor(Math.random() * 30) + 70,
      };
    });
  }

  private static generarDatosConsumoFranjaHoraria(periodo: string) {
    const franjas = [
      {
        franja: "00:00 - 06:00",
        base: 875,
        tarifa: 45,
        clasificacion: "Valle",
      },
      {
        franja: "06:00 - 09:00",
        base: 1225,
        tarifa: 65,
        clasificacion: "Intermedio",
      },
      {
        franja: "09:00 - 12:00",
        base: 2100,
        tarifa: 85,
        clasificacion: "Pico",
      },
      {
        franja: "12:00 - 14:00",
        base: 1400,
        tarifa: 75,
        clasificacion: "Intermedio",
      },
      {
        franja: "14:00 - 18:00",
        base: 2275,
        tarifa: 90,
        clasificacion: "Pico",
      },
      {
        franja: "18:00 - 00:00",
        base: 875,
        tarifa: 55,
        clasificacion: "Valle",
      },
    ];

    const total = franjas.reduce((sum, franja) => sum + franja.base, 0);

    return franjas.map((franja) => {
      const variacion = (Math.random() - 0.5) * 0.2;
      const consumo = Math.floor(franja.base * (1 + variacion));
      return {
        franjaHoraria: franja.franja,
        consumo,
        porcentaje: Math.round((consumo / total) * 100),
        costo: Math.floor(consumo * franja.tarifa),
        tarifaAplicada: franja.tarifa,
        factorDemanda: Math.random() * 0.4 + 0.6,
        clasificacion: franja.clasificacion,
      };
    });
  }

  // Generar reporte de clientes optimizado
  static async reporteClientesExcel(
    req: Request,
    res: Response
  ): Promise<void> {
    let registro: any = null;

    try {
      const { empresaId, formato = "excel" } = req.query;
      const filtros =
        typeof req.query.filtros === "string"
          ? JSON.parse(req.query.filtros)
          : req.query.filtros || {};

      // Agregar empresaId a filtros si está presente
      if (empresaId) filtros.empresaId = empresaId;

      // Extraer contexto del usuario
      const usuario = this.extraerContextoUsuario(req);

      // Configuración del reporte
      const config: IConfiguracionReporte = {
        tipo: "clientes",
        formato: formato as "excel" | "csv",
        filtros,
        usuario,
      };

      // Log de auditoría - INICIADO
      this.logAuditoriaReporte(config, "INICIADO");

      // Crear registro de seguimiento
      registro = await this.crearRegistroReporte(config);

      console.log("📊 [HÍBRIDO] Generando reporte de clientes:", {
        registroId: registro._id,
        empresaId,
        formato,
        filtros,
        usuario: usuario.id,
      });

      // Generar reporte optimizado
      const { buffer, estadisticas } =
        await this.generarReporteOptimizado(config);

      console.log(
        `📋 [HÍBRIDO] ${estadisticas.totalRegistros} clientes encontrados para el reporte`
      );
      console.log(
        `📊 [HÍBRIDO] Reporte generado en ${estadisticas.tiempoGeneracion}ms, tamaño: ${(estadisticas.tamañoArchivo / 1024).toFixed(2)}KB`
      );

      // Finalizar registro exitoso
      await this.finalizarRegistroReporte(registro._id, estadisticas);

      // Log de auditoría - EXITOSO
      this.logAuditoriaReporte(config, "EXITOSO");

      // Configurar headers de respuesta
      const esComprimido = buffer.length !== estadisticas.tamañoArchivo;
      const nombreArchivo = `reporte_clientes_${new Date().toISOString().split("T")[0]}.${formato === "excel" ? "xlsx" : "csv"}`;

      if (formato === "excel") {
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
      } else {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
      }

      if (esComprimido) {
        res.setHeader("Content-Encoding", "gzip");
      }

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${nombreArchivo}"`
      );
      res.setHeader(
        "X-Reporte-Registros",
        estadisticas.totalRegistros.toString()
      );
      res.setHeader(
        "X-Reporte-Tiempo",
        estadisticas.tiempoGeneracion.toString()
      );
      res.setHeader("X-Reporte-ID", registro._id.toString());

      res.send(buffer);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";

      console.error("❌ [HÍBRIDO] Error generando reporte de clientes:", error);

      // Finalizar registro con error
      if (registro) {
        await this.finalizarRegistroReporte(
          registro._id,
          { totalRegistros: 0, tamañoArchivo: 0, tiempoGeneracion: 0 },
          errorMessage
        );
      }

      // Log de auditoría - ERROR
      if (registro) {
        const config: IConfiguracionReporte = {
          tipo: "clientes",
          formato: (req.query.formato as "excel" | "csv") || "excel",
          filtros: {},
          usuario: this.extraerContextoUsuario(req),
        };
        this.logAuditoriaReporte(config, "ERROR", errorMessage);
      }

      res.status(500).json({
        success: false,
        message: "Error al generar reporte",
        error: errorMessage,
        reporteId: registro?._id,
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

  // Reporte de cotizaciones en Excel
  static async reporteCotizacionesExcel(req: Request, res: Response) {
    let registro: any = null;

    try {
      const { formato = "excel" } = req.query;
      const filtros =
        typeof req.query.filtros === "string"
          ? JSON.parse(req.query.filtros)
          : req.query.filtros || {};
      const usuario = this.extraerContextoUsuario(req);

      const config: IConfiguracionReporte = {
        tipo: "cotizaciones",
        formato: formato as "excel" | "csv",
        filtros,
        usuario,
      };

      this.logAuditoriaReporte(config, "INICIADO");
      registro = await this.crearRegistroReporte(config);

      console.log("📊 [HÍBRIDO] Generando reporte de cotizaciones:", {
        registroId: registro._id,
        formato,
        filtros,
        usuario: usuario.id,
      });

      const { buffer, estadisticas } =
        await this.generarReporteOptimizado(config);

      console.log(
        `📋 [HÍBRIDO] ${estadisticas.totalRegistros} cotizaciones encontradas para el reporte`
      );
      console.log(
        `📊 [HÍBRIDO] Reporte generado en ${estadisticas.tiempoGeneracion}ms, tamaño: ${(estadisticas.tamañoArchivo / 1024).toFixed(2)}KB`
      );

      await this.finalizarRegistroReporte(registro._id, estadisticas);
      this.logAuditoriaReporte(config, "EXITOSO");

      const esComprimido = buffer.length !== estadisticas.tamañoArchivo;
      const nombreArchivo = `reporte_cotizaciones_${new Date().toISOString().split("T")[0]}.${formato === "excel" ? "xlsx" : "csv"}`;

      if (formato === "excel") {
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
      } else {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
      }

      if (esComprimido) {
        res.setHeader("Content-Encoding", "gzip");
      }

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${nombreArchivo}"`
      );
      res.setHeader(
        "X-Reporte-Registros",
        estadisticas.totalRegistros.toString()
      );
      res.setHeader(
        "X-Reporte-Tiempo",
        estadisticas.tiempoGeneracion.toString()
      );
      res.setHeader("X-Reporte-ID", registro._id.toString());

      res.send(buffer);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.error(
        "❌ [HÍBRIDO] Error generando reporte de cotizaciones:",
        error
      );

      if (registro) {
        await this.finalizarRegistroReporte(
          registro._id,
          { totalRegistros: 0, tamañoArchivo: 0, tiempoGeneracion: 0 },
          errorMessage
        );
      }

      res.status(500).json({
        success: false,
        message: "Error al generar reporte",
        error: errorMessage,
        reporteId: registro?._id,
      });
    }
  }

  // Reporte de cotizaciones en CSV
  static async reporteCotizacionesCSV(req: Request, res: Response) {
    req.query.formato = "csv";
    return this.reporteCotizacionesExcel(req, res);
  }

  // Reporte de estadísticas de consumo en Excel
  static async reporteEstadisticasExcel(req: Request, res: Response) {
    let registro: any = null;

    try {
      const { subtipo } = req.params;
      const { formato = "excel" } = req.query;
      const filtros = { ...req.query, subtipo };
      const usuario = this.extraerContextoUsuario(req);

      const config: IConfiguracionReporte = {
        tipo: "estadisticas",
        formato: formato as "excel" | "csv",
        filtros,
        usuario,
      };

      this.logAuditoriaReporte(config, "INICIADO");
      registro = await this.crearRegistroReporte(config);

      console.log("📊 [HÍBRIDO] Generando reporte de estadísticas:", {
        registroId: registro._id,
        subtipo,
        formato,
        filtros,
        usuario: usuario.id,
      });

      const { buffer, estadisticas } =
        await this.generarReporteOptimizado(config);

      console.log(
        `📋 [HÍBRIDO] ${estadisticas.totalRegistros} registros de estadísticas para el reporte`
      );
      console.log(
        `📊 [HÍBRIDO] Reporte generado en ${estadisticas.tiempoGeneracion}ms, tamaño: ${(estadisticas.tamañoArchivo / 1024).toFixed(2)}KB`
      );

      await this.finalizarRegistroReporte(registro._id, estadisticas);
      this.logAuditoriaReporte(config, "EXITOSO");

      const esComprimido = buffer.length !== estadisticas.tamañoArchivo;
      const nombreArchivo = `reporte_estadisticas_${subtipo}_${new Date().toISOString().split("T")[0]}.${formato === "excel" ? "xlsx" : "csv"}`;

      if (formato === "excel") {
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
      } else {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
      }

      if (esComprimido) {
        res.setHeader("Content-Encoding", "gzip");
      }

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${nombreArchivo}"`
      );
      res.setHeader(
        "X-Reporte-Registros",
        estadisticas.totalRegistros.toString()
      );
      res.setHeader(
        "X-Reporte-Tiempo",
        estadisticas.tiempoGeneracion.toString()
      );
      res.setHeader("X-Reporte-ID", registro._id.toString());
      res.setHeader("X-Reporte-Subtipo", subtipo);

      res.send(buffer);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.error(
        "❌ [HÍBRIDO] Error generando reporte de estadísticas:",
        error
      );

      if (registro) {
        await this.finalizarRegistroReporte(
          registro._id,
          { totalRegistros: 0, tamañoArchivo: 0, tiempoGeneracion: 0 },
          errorMessage
        );
      }

      res.status(500).json({
        success: false,
        message: "Error al generar reporte de estadísticas",
        error: errorMessage,
        reporteId: registro?._id,
      });
    }
  }

  // Reporte de estadísticas de consumo en CSV
  static async reporteEstadisticasCSV(req: Request, res: Response) {
    req.query.formato = "csv";
    return this.reporteEstadisticasExcel(req, res);
  }

  // Reporte de consumo sectorial en Excel
  static async reporteConsumoSectorialExcel(req: Request, res: Response) {
    let registro: any = null;

    try {
      const { subtipo } = req.params;
      const { formato = "excel" } = req.query;
      const filtros = { ...req.query, subtipo };
      const usuario = this.extraerContextoUsuario(req);

      const config: IConfiguracionReporte = {
        tipo: "consumo-sectorial",
        formato: formato as "excel" | "csv",
        filtros,
        usuario,
      };

      this.logAuditoriaReporte(config, "INICIADO");
      registro = await this.crearRegistroReporte(config);

      console.log("📊 [HÍBRIDO] Generando reporte de consumo sectorial:", {
        registroId: registro._id,
        subtipo,
        formato,
        filtros,
        usuario: usuario.id,
      });

      const { buffer, estadisticas } =
        await this.generarReporteOptimizado(config);

      console.log(
        `📋 [HÍBRIDO] ${estadisticas.totalRegistros} registros de consumo sectorial para el reporte`
      );
      console.log(
        `📊 [HÍBRIDO] Reporte generado en ${estadisticas.tiempoGeneracion}ms, tamaño: ${(estadisticas.tamañoArchivo / 1024).toFixed(2)}KB`
      );

      await this.finalizarRegistroReporte(registro._id, estadisticas);
      this.logAuditoriaReporte(config, "EXITOSO");

      const esComprimido = buffer.length !== estadisticas.tamañoArchivo;
      const nombreArchivo = `reporte_consumo_${subtipo}_${new Date().toISOString().split("T")[0]}.${formato === "excel" ? "xlsx" : "csv"}`;

      if (formato === "excel") {
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
      } else {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
      }

      if (esComprimido) {
        res.setHeader("Content-Encoding", "gzip");
      }

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${nombreArchivo}"`
      );
      res.setHeader(
        "X-Reporte-Registros",
        estadisticas.totalRegistros.toString()
      );
      res.setHeader(
        "X-Reporte-Tiempo",
        estadisticas.tiempoGeneracion.toString()
      );
      res.setHeader("X-Reporte-ID", registro._id.toString());
      res.setHeader("X-Reporte-Subtipo", subtipo);

      res.send(buffer);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.error(
        "❌ [HÍBRIDO] Error generando reporte de consumo sectorial:",
        error
      );

      if (registro) {
        await this.finalizarRegistroReporte(
          registro._id,
          { totalRegistros: 0, tamañoArchivo: 0, tiempoGeneracion: 0 },
          errorMessage
        );
      }

      res.status(500).json({
        success: false,
        message: "Error al generar reporte de consumo sectorial",
        error: errorMessage,
        reporteId: registro?._id,
      });
    }
  }

  // Reporte de consumo sectorial en CSV
  static async reporteConsumoSectorialCSV(req: Request, res: Response) {
    req.query.formato = "csv";
    return this.reporteConsumoSectorialExcel(req, res);
  }

  // Obtener historial de reportes del usuario
  static async obtenerHistorialReportes(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const usuario = this.extraerContextoUsuario(req);
      const { page = 1, limit = 10, tipo, formato, estado } = req.query;

      // Construir filtros
      const filtros: any = { usuarioId: usuario.id };
      if (usuario.empresaId) filtros.empresaId = usuario.empresaId;
      if (tipo) filtros.tipo = tipo;
      if (formato) filtros.formato = formato;
      if (estado) filtros.estado = estado;

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);

      // Consulta con paginación
      const [reportes, total] = await Promise.all([
        ReporteGenerado.find(filtros)
          .sort({ fechaGeneracion: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        ReporteGenerado.countDocuments(filtros),
      ]);

      res.json({
        success: true,
        data: {
          reportes,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
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
      const usuario = this.extraerContextoUsuario(req);
      const { diasAtras = 30 } = req.query;

      // Obtener estadísticas generales
      const estadisticasGenerales = await (
        ReporteGenerado as any
      ).obtenerEstadisticasUso(usuario.id, usuario.empresaId);

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
            usuarioId: usuario.id,
            fechaGeneracion: { $gte: fechaInicio },
            ...(usuario.empresaId && { empresaId: usuario.empresaId }),
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

      res.json({
        success: true,
        data: {
          general: estadisticasGenerales,
          tendencias,
          porTipo: estadisticasPorTipo,
          periodo: {
            desde: fechaInicio,
            hasta: new Date(),
            dias: Number(diasAtras),
          },
        },
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

      res.json({
        success: true,
        message: `Limpieza completada: ${resultado.deletedCount} reportes eliminados`,
        data: {
          eliminados: resultado.deletedCount,
          fechaLimite,
          diasAntiguedad: Number(diasAntiguedad),
        },
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
