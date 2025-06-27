import mongoose, { Schema, Document } from "mongoose";

// Tipos para lecturas y estados
export type LecturaDispositivo = {
  timestamp: Date;
  valor: number;
  unidad: string;
  esVoltaje?: boolean;
  esAmperaje?: boolean;
  esPotencia?: boolean;
  esConsumo?: boolean;
};

export type AlertaDispositivo = {
  timestamp: Date;
  tipoAlerta:
    | "consumoExcesivo"
    | "bajaTension"
    | "sobrecargaCircuito"
    | "fallaConexion"
    | "otro";
  mensaje: string;
  esResuelta: boolean;
  fechaResolucion?: Date;
  accionesTomadas?: string;
};

export type ComandosDispositivo = {
  timestamp: Date;
  tipoComando:
    | "reinicio"
    | "calibracion"
    | "actualizacion"
    | "cambioModo"
    | "otro";
  comando: string;
  resultado: "exito" | "fallido" | "pendiente";
  mensajeResultado?: string;
};

// Interfaz principal del dispositivo
export interface IDispositivo extends Document {
  idDispositivo: string;
  modelo: string;
  fabricante: string;
  tipoDispositivo:
    | "medidorInteligente"
    | "reguladorVoltaje"
    | "monitorizador"
    | "otro";
  numeroSerie: string;
  version: {
    hardware: string;
    firmware: string;
    ultimaActualizacion?: Date;
  };
  cliente: mongoose.Types.ObjectId;
  ubicacion: {
    direccion?: string;
    coordenadas?: {
      latitud: number;
      longitud: number;
    };
    descripcion?: string;
  };
  estado: "activo" | "inactivo" | "mantenimiento" | "fallo";
  configuracion: {
    modoOperacion:
      | "normal"
      | "ahorro"
      | "supervisionIntensiva"
      | "balanceCarga";
    frecuenciaLectura: number; // en segundos
    umbralAlertaConsumo?: number;
    umbralAlertaVoltaje?: {
      min: number;
      max: number;
    };
    conectadoNube: boolean;
    parametrosAdicionales?: Record<string, any>;
  };
  fechaInstalacion: Date;
  fechaUltimaConexion?: Date;
  lecturas: LecturaDispositivo[];
  alertas: AlertaDispositivo[];
  comandos: ComandosDispositivo[];
  metadatos?: Record<string, any>;
  permisos?: {
    usuariosAutorizados: string[];
    nivelAcceso: "lectura" | "escritura" | "administrador";
  };
}

// Esquema para los dispositivos
const DispositivoSchema = new Schema<IDispositivo>(
  {
    idDispositivo: {
      type: String,
      required: [true, "El ID del dispositivo es requerido"],
      unique: true,
      index: true,
    },
    modelo: {
      type: String,
      required: [true, "El modelo del dispositivo es requerido"],
    },
    fabricante: {
      type: String,
      required: [true, "El fabricante es requerido"],
    },
    tipoDispositivo: {
      type: String,
      required: [true, "El tipo de dispositivo es requerido"],
      enum: ["medidorInteligente", "reguladorVoltaje", "monitorizador", "otro"],
    },
    numeroSerie: {
      type: String,
      required: [true, "El número de serie es requerido"],
      unique: true,
    },
    version: {
      hardware: {
        type: String,
        required: [true, "La versión de hardware es requerida"],
      },
      firmware: {
        type: String,
        required: [true, "La versión de firmware es requerida"],
      },
      ultimaActualizacion: Date,
    },
    cliente: {
      type: Schema.Types.ObjectId,
      ref: "Cliente",
      required: [true, "Debe estar asociado a un cliente"],
    },
    ubicacion: {
      direccion: String,
      coordenadas: {
        latitud: Number,
        longitud: Number,
      },
      descripcion: String,
    },
    estado: {
      type: String,
      enum: ["activo", "inactivo", "mantenimiento", "fallo"],
      default: "inactivo",
    },
    configuracion: {
      modoOperacion: {
        type: String,
        enum: ["normal", "ahorro", "supervisionIntensiva", "balanceCarga"],
        default: "normal",
      },
      frecuenciaLectura: {
        type: Number,
        default: 300, // 5 minutos en segundos
      },
      umbralAlertaConsumo: Number,
      umbralAlertaVoltaje: {
        min: Number,
        max: Number,
      },
      conectadoNube: {
        type: Boolean,
        default: true,
      },
      parametrosAdicionales: {
        type: Map,
        of: Schema.Types.Mixed,
      },
    },
    fechaInstalacion: {
      type: Date,
      required: [true, "La fecha de instalación es requerida"],
    },
    fechaUltimaConexion: Date,
    lecturas: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        valor: {
          type: Number,
          required: true,
        },
        unidad: {
          type: String,
          required: true,
        },
        esVoltaje: Boolean,
        esAmperaje: Boolean,
        esPotencia: Boolean,
        esConsumo: Boolean,
      },
    ],
    alertas: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        tipoAlerta: {
          type: String,
          enum: [
            "consumoExcesivo",
            "bajaTension",
            "sobrecargaCircuito",
            "fallaConexion",
            "otro",
          ],
          required: true,
        },
        mensaje: {
          type: String,
          required: true,
        },
        esResuelta: {
          type: Boolean,
          default: false,
        },
        fechaResolucion: Date,
        accionesTomadas: String,
      },
    ],
    comandos: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        tipoComando: {
          type: String,
          enum: [
            "reinicio",
            "calibracion",
            "actualizacion",
            "cambioModo",
            "otro",
          ],
          required: true,
        },
        comando: {
          type: String,
          required: true,
        },
        resultado: {
          type: String,
          enum: ["exito", "fallido", "pendiente"],
          default: "pendiente",
        },
        mensajeResultado: String,
      },
    ],
    metadatos: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    permisos: {
      usuariosAutorizados: [String],
      nivelAcceso: {
        type: String,
        enum: ["lectura", "escritura", "administrador"],
        default: "lectura",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices para búsquedas más rápidas
DispositivoSchema.index({ cliente: 1 });
DispositivoSchema.index({ estado: 1 });
DispositivoSchema.index({ "lecturas.timestamp": -1 });
DispositivoSchema.index({ "alertas.timestamp": -1, "alertas.esResuelta": 1 });
DispositivoSchema.index({ fechaUltimaConexion: -1 });

// Métodos estáticos
DispositivoSchema.statics.obtenerDispositivosInactivos = async function (
  diasInactivo: number = 2
) {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - diasInactivo);

  return this.find({
    fechaUltimaConexion: { $lt: fechaLimite },
    estado: { $ne: "mantenimiento" },
  }).populate("cliente", "numeroCliente nombre email telefono");
};

// Método para obtener estadísticas de consumo
DispositivoSchema.statics.obtenerEstadisticasConsumo = async function (
  clienteId: string,
  fechaInicio?: Date,
  fechaFin?: Date
) {
  const matchStage: any = { cliente: clienteId };

  if (fechaInicio || fechaFin) {
    matchStage["lecturas.timestamp"] = {};
    if (fechaInicio) matchStage["lecturas.timestamp"].$gte = fechaInicio;
    if (fechaFin) matchStage["lecturas.timestamp"].$lte = fechaFin;
  }

  return this.aggregate([
    { $match: matchStage },
    { $unwind: "$lecturas" },
    {
      $match: {
        "lecturas.esConsumo": true,
        ...(fechaInicio || fechaFin
          ? {
              "lecturas.timestamp": {
                ...(fechaInicio && { $gte: fechaInicio }),
                ...(fechaFin && { $lte: fechaFin }),
              },
            }
          : {}),
      },
    },
    {
      $group: {
        _id: null,
        consumoTotal: { $sum: "$lecturas.valor" },
        consumoPromedio: { $avg: "$lecturas.valor" },
        consumoMaximo: { $max: "$lecturas.valor" },
        consumoMinimo: { $min: "$lecturas.valor" },
        cantidadLecturas: { $sum: 1 },
      },
    },
  ]);
};

// Exportar el modelo
const Dispositivo = mongoose.model<IDispositivo>(
  "Dispositivo",
  DispositivoSchema
);

export default Dispositivo;
