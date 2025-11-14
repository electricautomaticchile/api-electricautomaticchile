import mongoose, { Schema, Document } from "mongoose";

export interface IDispositivo extends Document {
  _id: mongoose.Types.ObjectId;
  numeroDispositivo: string; // Ej: "500001-5"
  nombre: string;
  tipo: "arduino_uno" | "arduino_mega" | "esp32" | "raspberry_pi" | "otro";
  estado: "activo" | "inactivo" | "mantenimiento";
  clienteAsignado?: mongoose.Types.ObjectId;
  empresaAsignada?: mongoose.Types.ObjectId;
  ubicacion?: string;
  configuracion?: {
    voltajeNominal?: number;
    corrienteMaxima?: number;
    potenciaMaxima?: number;
    tarifaKwh?: number;
  };
  ultimaConexion?: Date;
  ultimaLectura?: {
    voltaje?: number;
    corriente?: number;
    potencia?: number;
    energia?: number;
    timestamp?: Date;
  };
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  notas?: string;
}

const DispositivoSchema = new Schema<IDispositivo>(
  {
    numeroDispositivo: {
      type: String,
      required: [true, "El número de dispositivo es requerido"],
      unique: true,
      trim: true,
    },
    nombre: {
      type: String,
      required: [true, "El nombre del dispositivo es requerido"],
      trim: true,
    },
    tipo: {
      type: String,
      enum: ["arduino_uno", "arduino_mega", "esp32", "raspberry_pi", "otro"],
      default: "arduino_uno",
    },
    estado: {
      type: String,
      enum: ["activo", "inactivo", "mantenimiento"],
      default: "activo",
    },
    clienteAsignado: {
      type: Schema.Types.ObjectId,
      ref: "Cliente",
    },
    empresaAsignada: {
      type: Schema.Types.ObjectId,
      ref: "Empresa",
    },
    ubicacion: {
      type: String,
      trim: true,
    },
    configuracion: {
      voltajeNominal: {
        type: Number,
        default: 220,
      },
      corrienteMaxima: {
        type: Number,
        default: 50,
      },
      potenciaMaxima: {
        type: Number,
        default: 5000,
      },
      tarifaKwh: {
        type: Number,
        default: 150,
      },
    },
    ultimaConexion: {
      type: Date,
    },
    ultimaLectura: {
      voltaje: Number,
      corriente: Number,
      potencia: Number,
      energia: Number,
      timestamp: Date,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    fechaActualizacion: {
      type: Date,
    },
    notas: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: "fechaCreacion",
      updatedAt: "fechaActualizacion",
    },
    versionKey: false,
  }
);

// Índices
DispositivoSchema.index({ numeroDispositivo: 1 }, { unique: true });
DispositivoSchema.index({ clienteAsignado: 1 });
DispositivoSchema.index({ empresaAsignada: 1 });
DispositivoSchema.index({ estado: 1 });
DispositivoSchema.index({ activo: 1 });

const Dispositivo = mongoose.model<IDispositivo>(
  "Dispositivo",
  DispositivoSchema,
  "dispositivos"
);

export default Dispositivo;
