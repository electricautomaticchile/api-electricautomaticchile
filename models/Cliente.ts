import mongoose, { Schema, Document } from "mongoose";

export interface ICliente extends Document {
  _id: mongoose.Types.ObjectId;
  nombre: string;
  correo: string;
  telefono: string;
  direccion?: string;
  ciudad?: string;
  rut?: string;
  tipoCliente?: "particular" | "empresa";
  activo?: boolean;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
  numeroCliente?: string;
  empresa?: string;
  password: string;
  passwordTemporal?: string;
  imagenPerfil?: string;
  role?: string;
  esActivo?: boolean;
  fechaRegistro?: Date;
  fechaActivacion?: Date;
  ultimoAcceso?: Date;
  planSeleccionado?: string;
  montoMensual?: number;
  notas?: string;
}

export interface ICrearCliente {
  nombre: string;
  correo: string;
  telefono: string;
  direccion?: string;
  ciudad?: string;
  rut?: string;
  tipoCliente?: "particular" | "empresa";
  empresa?: string;
  numeroCliente?: string;
  role?: string;
  planSeleccionado?: string;
  montoMensual?: number;
  notas?: string;
}

export interface IActualizarCliente {
  nombre?: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  rut?: string;
  tipoCliente?: "particular" | "empresa";
  activo?: boolean;
  esActivo?: boolean;
  empresa?: string;
  role?: string;
  planSeleccionado?: string;
  montoMensual?: number;
  notas?: string;
}

// Esquema de Mongoose - Flexible para ambos formatos
const ClienteSchema = new Schema<ICliente>(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es requerido"],
      trim: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
    },
    correo: {
      type: String,
      required: [true, "El correo es requerido"],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email inválido"],
    },
    telefono: {
      type: String,
      required: [true, "El teléfono es requerido"],
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, "Formato de teléfono inválido"],
    },
    direccion: {
      type: String,
      trim: true,
      maxlength: [200, "La dirección no puede exceder 200 caracteres"],
    },
    ciudad: {
      type: String,
      trim: true,
      maxlength: [50, "La ciudad no puede exceder 50 caracteres"],
    },
    rut: {
      type: String,
      trim: true,
      uppercase: true,
      match: [
        /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/,
        "Formato de RUT inválido (ej: 12.345.678-9)",
      ],
    },
    tipoCliente: {
      type: String,
      enum: ["particular", "empresa"],
      default: "particular",
    },
    activo: {
      type: Boolean,
      default: true,
    },
    esActivo: {
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
    fechaRegistro: {
      type: Date,
    },
    fechaActivacion: {
      type: Date,
    },
    ultimoAcceso: {
      type: Date,
    },
    numeroCliente: {
      type: String,
      trim: true,
    },
    empresa: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    passwordTemporal: {
      type: String,
      select: false,
    },
    imagenPerfil: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "usuario", "cliente"],
      default: "cliente",
    },
    planSeleccionado: {
      type: String,
      enum: ["basico", "premium", "enterprise"],
      default: "basico",
    },
    montoMensual: {
      type: Number,
      default: 0,
    },
    notas: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: "fechaCreacion", updatedAt: "fechaActualizacion" },
    versionKey: false,
    strict: false,
  }
);

ClienteSchema.index({ correo: 1 }, { unique: true });
ClienteSchema.index({ rut: 1 });
ClienteSchema.index({ numeroCliente: 1 });
ClienteSchema.index({ tipoCliente: 1 });
ClienteSchema.index({ activo: 1 });
ClienteSchema.index({ esActivo: 1 });
ClienteSchema.index({ role: 1 });
ClienteSchema.index({ nombre: "text", correo: "text" });

ClienteSchema.virtual("estadoActivo").get(function () {
  return this.activo !== undefined ? this.activo : this.esActivo;
});

ClienteSchema.statics.findActivos = function () {
  return this.find({
    $or: [{ activo: true }, { esActivo: true }],
  });
};

ClienteSchema.statics.buscarPorTexto = function (texto: string) {
  return this.find({
    $and: [
      {
        $or: [
          { nombre: { $regex: texto, $options: "i" } },
          { correo: { $regex: texto, $options: "i" } },
          { rut: { $regex: texto, $options: "i" } },
          { numeroCliente: { $regex: texto, $options: "i" } },
        ],
      },
      {
        $or: [{ activo: true }, { esActivo: true }],
      },
    ],
  });
};

// Crear y exportar el modelo - especificando explícitamente la colección
const Cliente = mongoose.model<ICliente>("Cliente", ClienteSchema, "clientes");

export default Cliente;
