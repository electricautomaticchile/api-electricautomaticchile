import mongoose, { Schema, Document } from "mongoose";

interface IReporteGenerado extends Document {
  tipo:
    | "clientes"
    | "empresas"
    | "cotizaciones"
    | "dispositivos"
    | "estadisticas"
    | "consumo-sectorial";
  formato: "excel" | "csv" | "pdf";
  fechaGeneracion: Date;
  usuarioId: string;
  usuarioTipo: "empresa" | "superusuario" | "cliente";
  empresaId?: string;
  filtros: {
    [key: string]: any;
  };
  estadisticas: {
    totalRegistros: number;
    tamañoArchivo: number; // en bytes
    tiempoGeneracion: number; // en milisegundos
    filtrosAplicados: number;
  };
  estado: "generando" | "completado" | "error" | "expirado";
  metadatos: {
    ipAddress?: string;
    userAgent?: string;
    nombreArchivo: string;
    tipoMime: string;
    subtipo?: string; // Para diferenciar: "mensual", "diario", "equipamiento", "area", etc.
  };
  error?: {
    mensaje: string;
    codigo: string;
    timestamp: Date;
  };
  expiresAt: Date; // TTL para limpieza automática (7 días)
  fechaCreacion: Date;
  fechaActualizacion: Date;

  // Métodos de instancia
  marcarCompletado(
    estadisticas: Partial<IReporteGenerado["estadisticas"]>
  ): Promise<IReporteGenerado>;
  marcarError(mensaje: string, codigo?: string): Promise<IReporteGenerado>;
}

const ReporteGeneradoSchema = new Schema<IReporteGenerado>(
  {
    tipo: {
      type: String,
      enum: [
        "clientes",
        "empresas",
        "cotizaciones",
        "dispositivos",
        "estadisticas",
        "consumo-sectorial",
      ],
      required: true,
      index: true,
    },
    formato: {
      type: String,
      enum: ["excel", "csv", "pdf"],
      required: true,
    },
    fechaGeneracion: {
      type: Date,
      default: Date.now,
      index: true,
    },
    usuarioId: {
      type: String,
      required: true,
      index: true,
    },
    usuarioTipo: {
      type: String,
      enum: ["empresa", "superusuario", "cliente"],
      required: true,
    },
    empresaId: {
      type: String,
      index: true,
    },
    filtros: {
      type: Schema.Types.Mixed,
      default: {},
    },
    estadisticas: {
      totalRegistros: { type: Number, required: true, min: 0 },
      tamañoArchivo: { type: Number, required: true, min: 0 },
      tiempoGeneracion: { type: Number, required: true, min: 0 },
      filtrosAplicados: { type: Number, default: 0, min: 0 },
    },
    estado: {
      type: String,
      enum: ["generando", "completado", "error", "expirado"],
      default: "generando",
      index: true,
    },
    metadatos: {
      ipAddress: String,
      userAgent: String,
      nombreArchivo: { type: String, required: true },
      tipoMime: { type: String, required: true },
      subtipo: String,
    },
    error: {
      mensaje: String,
      codigo: String,
      timestamp: Date,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      index: { expireAfterSeconds: 0 }, // TTL index
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    fechaActualizacion: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "fechaCreacion", updatedAt: "fechaActualizacion" },
  }
);

// Índices compuestos para consultas optimizadas
ReporteGeneradoSchema.index({ usuarioId: 1, fechaGeneracion: -1 });
ReporteGeneradoSchema.index({ empresaId: 1, tipo: 1, fechaGeneracion: -1 });
ReporteGeneradoSchema.index({ estado: 1, fechaGeneracion: -1 });
ReporteGeneradoSchema.index({ tipo: 1, formato: 1, fechaGeneracion: -1 });

// Métodos estáticos para estadísticas
ReporteGeneradoSchema.statics.obtenerEstadisticasUso = async function (
  usuarioId?: string,
  empresaId?: string
) {
  const filtro: any = {};
  if (usuarioId) filtro.usuarioId = usuarioId;
  if (empresaId) filtro.empresaId = empresaId;

  const estadisticas = await this.aggregate([
    { $match: filtro },
    {
      $group: {
        _id: null,
        totalReportes: { $sum: 1 },
        reportesExitosos: {
          $sum: { $cond: [{ $eq: ["$estado", "completado"] }, 1, 0] },
        },
        reportesError: {
          $sum: { $cond: [{ $eq: ["$estado", "error"] }, 1, 0] },
        },
        tamañoTotalMB: {
          $sum: { $divide: ["$estadisticas.tamañoArchivo", 1048576] },
        },
        tiempoPromedioMs: { $avg: "$estadisticas.tiempoGeneracion" },
        registrosTotales: { $sum: "$estadisticas.totalRegistros" },
      },
    },
  ]);

  return (
    estadisticas[0] || {
      totalReportes: 0,
      reportesExitosos: 0,
      reportesError: 0,
      tamañoTotalMB: 0,
      tiempoPromedioMs: 0,
      registrosTotales: 0,
    }
  );
};

ReporteGeneradoSchema.statics.obtenerTendenciasUso = async function (
  diasAtras: number = 30
) {
  const fechaInicio = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000);

  return await this.aggregate([
    { $match: { fechaGeneracion: { $gte: fechaInicio } } },
    {
      $group: {
        _id: {
          fecha: {
            $dateToString: { format: "%Y-%m-%d", date: "$fechaGeneracion" },
          },
          tipo: "$tipo",
          formato: "$formato",
        },
        cantidad: { $sum: 1 },
        tamañoPromedio: { $avg: "$estadisticas.tamañoArchivo" },
      },
    },
    { $sort: { "_id.fecha": 1 } },
  ]);
};

// Middleware para validaciones
ReporteGeneradoSchema.pre("save", function (next) {
  // Actualizar fechaActualizacion
  this.fechaActualizacion = new Date();

  // Validar que si hay error, el estado sea 'error'
  if (this.error && this.estado !== "error") {
    this.estado = "error";
  }

  next();
});

// Método para marcar como completado
ReporteGeneradoSchema.methods.marcarCompletado = function (
  estadisticas: Partial<IReporteGenerado["estadisticas"]>
) {
  this.estado = "completado";
  this.estadisticas = { ...this.estadisticas, ...estadisticas };
  this.fechaActualizacion = new Date();
  return this.save();
};

// Método para marcar como error
ReporteGeneradoSchema.methods.marcarError = function (
  mensaje: string,
  codigo: string = "UNKNOWN_ERROR"
) {
  this.estado = "error";
  this.error = {
    mensaje,
    codigo,
    timestamp: new Date(),
  };
  this.fechaActualizacion = new Date();
  return this.save();
};

export default mongoose.model<IReporteGenerado>(
  "ReporteGenerado",
  ReporteGeneradoSchema
);
