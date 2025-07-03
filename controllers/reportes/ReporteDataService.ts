import Cliente from "../../models/Cliente";
import Empresa from "../../models/Empresa";
import Cotizacion from "../../models/Cotizacion";
import { IDatosReporte } from "./types";

export class ReporteDataService {
  // Obtener datos de clientes con filtros
  static async obtenerDatosClientes(filtros: any): Promise<IDatosReporte> {
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
        type: "currency" as const,
      },
      {
        key: "fechaCreacion",
        header: "Fecha Registro",
        width: 15,
        type: "date" as const,
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
  static async obtenerDatosEmpresas(filtros: any): Promise<IDatosReporte> {
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
        type: "date" as const,
      },
    ];

    return { datos: empresas, columnas };
  }

  // Obtener datos de cotizaciones con filtros
  static async obtenerDatosCotizaciones(filtros: any): Promise<IDatosReporte> {
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
      { key: "total", header: "Valor", width: 15, type: "currency" as const },
      {
        key: "fechaCreacion",
        header: "Fecha Solicitud",
        width: 15,
        type: "date" as const,
      },
      {
        key: "fechaActualizacion",
        header: "Última Actualización",
        width: 15,
        type: "date" as const,
      },
    ];

    return { datos: cotizaciones, columnas };
  }

  // Obtener datos simulados de estadísticas
  static async obtenerDatosEstadisticas(filtros: any): Promise<IDatosReporte> {
    const { subtipo = "mensual", periodo = "nov-2023" } = filtros;

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

  // Obtener datos simulados de consumo sectorial
  static async obtenerDatosConsumoSectorial(
    filtros: any
  ): Promise<IDatosReporte> {
    const { subtipo = "equipamiento", periodo = "nov-2023" } = filtros;

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
    }

    return { datos, columnas };
  }

  // ===== MÉTODOS PRIVADOS PARA GENERAR DATOS SIMULADOS =====

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
}
