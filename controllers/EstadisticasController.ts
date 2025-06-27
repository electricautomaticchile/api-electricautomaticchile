import { Request, Response } from "express";
import Dispositivo from "../models/Dispositivo";
import Cliente from "../models/Cliente";

export class EstadisticasController {
  // Obtener estadísticas de consumo eléctrico para dashboard cliente
  static async obtenerConsumoElectrico(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { clienteId } = req.params;
      const { periodo = "mensual", año, mes } = req.query;

      // Configurar fechas según el período solicitado
      let fechaInicio: Date;
      let fechaFin: Date = new Date();

      switch (periodo) {
        case "mensual":
          const añoNum = año ? parseInt(año as string) : fechaFin.getFullYear();
          fechaInicio = new Date(añoNum, 0, 1); // Enero 1
          fechaFin = new Date(añoNum, 11, 31, 23, 59, 59); // Diciembre 31
          break;

        case "diario":
          const mesNum = mes ? parseInt(mes as string) : fechaFin.getMonth();
          const añoDiario = año
            ? parseInt(año as string)
            : fechaFin.getFullYear();
          fechaInicio = new Date(añoDiario, mesNum, 1);
          fechaFin = new Date(añoDiario, mesNum + 1, 0, 23, 59, 59);
          break;

        case "horario":
        default:
          // Últimas 24 horas
          fechaInicio = new Date(fechaFin.getTime() - 24 * 60 * 60 * 1000);
          break;
      }

      // Obtener dispositivos del cliente
      const dispositivos = await Dispositivo.find({
        cliente: clienteId,
        estado: "activo",
      }).select("idDispositivo lecturas");

      if (!dispositivos.length) {
        res.status(404).json({
          success: false,
          message: "No se encontraron dispositivos para este cliente",
        });
        return;
      }

      // Procesar datos según el período
      let datosAgrupados: any[] = [];
      let consumoActual = 0;
      let consumoPromedio = 0;

      if (periodo === "mensual") {
        datosAgrupados = await EstadisticasController.procesarDatosMensuales(
          dispositivos,
          fechaInicio,
          fechaFin
        );
      } else if (periodo === "diario") {
        datosAgrupados = await EstadisticasController.procesarDatosDiarios(
          dispositivos,
          fechaInicio,
          fechaFin
        );
      } else if (periodo === "horario") {
        datosAgrupados = await EstadisticasController.procesarDatosHorarios(
          dispositivos,
          fechaInicio,
          fechaFin
        );
      }

      // Calcular consumo actual y promedio
      if (datosAgrupados.length > 0) {
        consumoActual = datosAgrupados[datosAgrupados.length - 1]?.consumo || 0;
        consumoPromedio =
          datosAgrupados.reduce((sum, item) => sum + item.consumo, 0) /
          datosAgrupados.length;
      }

      // Calcular costo estimado (tarifa promedio Chile: $148.3 CLP/kWh)
      const tarifaKwh = 148.3;
      const costoEstimado = Math.round(consumoActual * tarifaKwh);

      // Calcular estadísticas adicionales
      const consumoMaximo = Math.max(...datosAgrupados.map((d) => d.consumo));
      const consumoMinimo = Math.min(...datosAgrupados.map((d) => d.consumo));

      res.status(200).json({
        success: true,
        data: {
          periodo,
          fechaInicio,
          fechaFin,
          consumoActual,
          costoEstimado,
          consumoPromedio: Math.round(consumoPromedio * 10) / 10,
          consumoMaximo,
          consumoMinimo,
          tarifaKwh,
          datosGrafico: datosAgrupados,
          resumen: {
            dispositivosActivos: dispositivos.length,
            ultimaActualizacion: new Date(),
            tendencia: EstadisticasController.calcularTendencia(datosAgrupados),
          },
        },
      });
    } catch (error) {
      console.error("Error al obtener consumo eléctrico:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Procesar datos mensuales
  private static async procesarDatosMensuales(
    dispositivos: any[],
    fechaInicio: Date,
    fechaFin: Date
  ) {
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

    const datos = [];
    for (let i = 0; i < 12; i++) {
      const mesInicio = new Date(fechaInicio.getFullYear(), i, 1);
      const mesFin = new Date(fechaInicio.getFullYear(), i + 1, 0, 23, 59, 59);

      const consumoMes = await EstadisticasController.calcularConsumoEnPeriodo(
        dispositivos,
        mesInicio,
        mesFin
      );

      datos.push({
        mes: meses[i],
        consumo: consumoMes,
        costo: Math.round(consumoMes * 148.3),
      });
    }

    return datos;
  }

  // Procesar datos diarios (por día de la semana)
  private static async procesarDatosDiarios(
    dispositivos: any[],
    fechaInicio: Date,
    fechaFin: Date
  ) {
    const diasSemana = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const consumoPorDia = new Array(7).fill(0);
    const contadorDias = new Array(7).fill(0);

    // Iterar por cada día del mes
    for (
      let fecha = new Date(fechaInicio);
      fecha <= fechaFin;
      fecha.setDate(fecha.getDate() + 1)
    ) {
      const diaInicio = new Date(fecha);
      const diaFin = new Date(fecha.getTime() + 24 * 60 * 60 * 1000 - 1);

      const consumoDia = await EstadisticasController.calcularConsumoEnPeriodo(
        dispositivos,
        diaInicio,
        diaFin
      );

      const diaSemana = fecha.getDay();
      consumoPorDia[diaSemana] += consumoDia;
      contadorDias[diaSemana]++;
    }

    return diasSemana.map((dia, index) => ({
      dia,
      consumo:
        contadorDias[index] > 0
          ? Math.round((consumoPorDia[index] / contadorDias[index]) * 10) / 10
          : 0,
    }));
  }

  // Procesar datos horarios (últimas 24 horas)
  private static async procesarDatosHorarios(
    dispositivos: any[],
    fechaInicio: Date,
    fechaFin: Date
  ) {
    const datos = [];

    for (let hora = 0; hora < 24; hora++) {
      const horaInicio = new Date(fechaInicio);
      horaInicio.setHours(hora, 0, 0, 0);
      const horaFin = new Date(fechaInicio);
      horaFin.setHours(hora, 59, 59, 999);

      const consumoHora = await EstadisticasController.calcularConsumoEnPeriodo(
        dispositivos,
        horaInicio,
        horaFin
      );

      datos.push({
        hora: hora.toString().padStart(2, "0") + ":00",
        consumo: Math.round(consumoHora * 10) / 10,
      });
    }

    return datos;
  }

  // Calcular consumo en un período específico
  private static async calcularConsumoEnPeriodo(
    dispositivos: any[],
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<number> {
    let consumoTotal = 0;

    for (const dispositivo of dispositivos) {
      const lecturas = dispositivo.lecturas.filter(
        (lectura: any) =>
          lectura.esConsumo &&
          lectura.timestamp >= fechaInicio &&
          lectura.timestamp <= fechaFin
      );

      consumoTotal += lecturas.reduce(
        (sum: number, lectura: any) => sum + lectura.valor,
        0
      );
    }

    return Math.round(consumoTotal * 10) / 10; // Redondear a 1 decimal
  }

  // Calcular tendencia (crecimiento/decrecimiento)
  private static calcularTendencia(datos: any[]): string {
    if (datos.length < 2) return "Sin datos suficientes";

    const ultimos = datos.slice(-2);
    const diferencia = ultimos[1].consumo - ultimos[0].consumo;
    const porcentaje = Math.round((diferencia / ultimos[0].consumo) * 100);

    if (porcentaje > 5) return `↗️ Incremento del ${porcentaje}%`;
    if (porcentaje < -5) return `↘️ Reducción del ${Math.abs(porcentaje)}%`;
    return "➡️ Estable";
  }

  // Obtener estadísticas globales para dashboard admin
  static async obtenerEstadisticasGlobales(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const ahora = new Date();
      const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Contar dispositivos por estado
      const dispositivosActivos = await Dispositivo.countDocuments({
        estado: "activo",
      });
      const dispositivosInactivos = await Dispositivo.countDocuments({
        estado: "inactivo",
      });
      const dispositivosMantenimiento = await Dispositivo.countDocuments({
        estado: "mantenimiento",
      });

      // Contar clientes activos
      const clientesActivos = await Cliente.countDocuments({ activo: true });

      // Alertas pendientes
      const alertasPendientes = await Dispositivo.aggregate([
        { $unwind: "$alertas" },
        { $match: { "alertas.esResuelta": false } },
        { $count: "total" },
      ]);

      // Consumo total último mes
      const consumoUltimoMes = await Dispositivo.aggregate([
        { $unwind: "$lecturas" },
        {
          $match: {
            "lecturas.esConsumo": true,
            "lecturas.timestamp": { $gte: hace30Dias },
          },
        },
        {
          $group: {
            _id: null,
            consumoTotal: { $sum: "$lecturas.valor" },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: {
          dispositivos: {
            total:
              dispositivosActivos +
              dispositivosInactivos +
              dispositivosMantenimiento,
            activos: dispositivosActivos,
            inactivos: dispositivosInactivos,
            mantenimiento: dispositivosMantenimiento,
          },
          clientes: {
            activos: clientesActivos,
          },
          alertas: {
            pendientes: alertasPendientes[0]?.total || 0,
          },
          consumo: {
            ultimoMes: consumoUltimoMes[0]?.consumoTotal || 0,
            unidad: "kWh",
          },
          ultimaActualizacion: ahora,
        },
      });
    } catch (error) {
      console.error("Error al obtener estadísticas globales:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
