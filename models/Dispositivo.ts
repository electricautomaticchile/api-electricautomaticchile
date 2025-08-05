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

// Interfaz principal del dispositivo (extendida con campos IoT)
export interface IDispositivo extends Document {
  idDispositivo: string;
  nombre: string;
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

  // === NUEVOS CAMPOS IOT ===
  // Estado de conexión en tiempo real
  connectionStatus: "connected" | "disconnected" | "reconnecting";
  lastSeen: Date;

  // Lecturas eléctricas en tiempo real
  voltage?: number;
  current?: number;
  power?: number;
  energy?: number;
  temperature?: number;

  // Campos de hardware específico
  hardwareType: "arduino" | "sensor" | "relay" | "controller";
  capabilities: string[];

  // Sensores y relés
  sensors?: { [key: string]: { value: number; unit: string; type: string } };
  relays?: { [key: string]: "active" | "inactive" };

  // Permisos y asignación
  assignedToEmpresa?: mongoose.Types.ObjectId;
  controlLevel: "full" | "limited" | "readonly";

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
    nombre: {
      type: String,
      required: [true, "El nombre del dispositivo es requerido"],
      trim: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
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

    // === NUEVOS CAMPOS IOT ===
    connectionStatus: {
      type: String,
      enum: ["connected", "disconnected", "reconnecting"],
      default: "disconnected",
      index: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Lecturas eléctricas en tiempo real
    voltage: {
      type: Number,
      min: 0,
      max: 1000,
    },
    current: {
      type: Number,
      min: 0,
      max: 1000,
    },
    power: {
      type: Number,
      min: 0,
      index: true, // Para consultas de consumo
    },
    energy: {
      type: Number,
      min: 0,
      index: true, // Para estadísticas de energía
    },
    temperature: {
      type: Number,
      min: -50,
      max: 150,
    },

    // Hardware específico
    hardwareType: {
      type: String,
      enum: ["arduino", "sensor", "relay", "controller"],
      default: "sensor",
      index: true,
    },
    capabilities: {
      type: [String],
      default: [],
    },

    // Sensores y relés (como Map para flexibilidad)
    sensors: {
      type: Map,
      of: {
        value: { type: Number, required: true },
        unit: { type: String, required: true },
        type: { type: String, required: true },
      },
      default: new Map(),
    },
    relays: {
      type: Map,
      of: {
        type: String,
        enum: ["active", "inactive"],
      },
      default: new Map(),
    },

    // Permisos y asignación
    assignedToEmpresa: {
      type: Schema.Types.ObjectId,
      ref: "Empresa",
      index: true,
    },
    controlLevel: {
      type: String,
      enum: ["full", "limited", "readonly"],
      default: "readonly",
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

// Índices para búsquedas más rápidas (incluyendo nuevos campos IoT)
DispositivoSchema.index({ cliente: 1 });
DispositivoSchema.index({ estado: 1 });
DispositivoSchema.index({ connectionStatus: 1 });
DispositivoSchema.index({ hardwareType: 1 });
DispositivoSchema.index({ assignedToEmpresa: 1 });
DispositivoSchema.index({ lastSeen: -1 });
DispositivoSchema.index({ power: -1 });
DispositivoSchema.index({ energy: -1 });
DispositivoSchema.index({ "lecturas.timestamp": -1 });
DispositivoSchema.index({ "alertas.timestamp": -1, "alertas.esResuelta": 1 });
DispositivoSchema.index({ fechaUltimaConexion: -1 });

// Índices compuestos para consultas complejas
DispositivoSchema.index({ cliente: 1, connectionStatus: 1 });
DispositivoSchema.index({ assignedToEmpresa: 1, estado: 1 });
DispositivoSchema.index({ hardwareType: 1, connectionStatus: 1 });

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
