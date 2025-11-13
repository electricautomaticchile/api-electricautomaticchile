import mongoose, { Schema, Document } from "mongoose";

export interface ICotizacion extends Document {
  _id: mongoose.Types.ObjectId;

  // Datos del formulario de contacto inicial
  numero?: string; // Generado automáticamente
  nombre: string;
  email: string;
  empresa?: string;
  telefono?: string;
  mensaje: string;

  // Estados del flujo
  estado:
    | "pendiente"
    | "en_revision"
    | "cotizando"
    | "cotizada"
    | "aprobada"
    | "rechazada"
    | "convertida_cliente";
  prioridad: "baja" | "media" | "alta" | "critica";

  // Datos de la cotización (cuando se genera)
  titulo?: string;
  descripcion?: string;
  items?: [
    {
      descripcion: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
    },
  ];
  subtotal?: number;
  iva?: number;
  total?: number;
  validezDias?: number;
  condicionesPago?: string;

  // Datos del cliente (cuando se convierte)
  clienteId?: mongoose.Types.ObjectId;

  // Metadatos
  fechaCreacion: Date;
  fechaActualizacion?: Date;
  fechaCotizacion?: Date;
  fechaAprobacion?: Date;
  fechaConversion?: Date;

  // Asignación
  asignadoA?: mongoose.Types.ObjectId; // Usuario que maneja la cotización
  notas?: string; // Notas internas
}

export interface ICrearCotizacion {
  nombre: string;
  email: string;
  empresa?: string;
  telefono?: string;
  mensaje: string;
}

export interface IActualizarCotizacion {
  estado?:
    | "pendiente"
    | "en_revision"
    | "cotizando"
    | "cotizada"
    | "aprobada"
    | "rechazada"
    | "convertida_cliente";
  prioridad?: "baja" | "media" | "alta" | "critica";
  titulo?: string;
  descripcion?: string;
  items?: [
    {
      descripcion: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
    },
  ];
  subtotal?: number;
  iva?: number;
  total?: number;
  validezDias?: number;
  condicionesPago?: string;
  asignadoA?: string;
  notas?: string;
}

// Esquema de Mongoose - Compatible con ambos sistemas
const CotizacionSchema = new Schema<ICotizacion>(
  {
    numero: {
      type: String,
      unique: true,
      default: function () {
        // Generar número automático: COT-YYYY-NNNN
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 9999)
          .toString()
          .padStart(4, "0");
        return `COT-${year}-${random}`;
      },
    },

    // Datos del formulario inicial
    nombre: {
      type: String,
      required: [true, "El nombre es requerido"],
      trim: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
    },
    email: {
      type: String,
      required: [true, "El email es requerido"],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email inválido"],
    },
    empresa: {
      type: String,
      trim: true,
      maxlength: [100, "El nombre de empresa no puede exceder 100 caracteres"],
    },
    telefono: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, "Formato de teléfono inválido"],
    },
    mensaje: {
      type: String,
      required: [true, "El mensaje es requerido"],
      trim: true,
      maxlength: [1000, "El mensaje no puede exceder 1000 caracteres"],
    },

    // Estados del flujo
    estado: {
      type: String,
      enum: [
        "pendiente",
        "en_revision",
        "cotizando",
        "cotizada",
        "aprobada",
        "rechazada",
        "convertida_cliente",
      ],
      default: "pendiente",
    },
    prioridad: {
      type: String,
      enum: ["baja", "media", "alta", "critica"],
      default: "media", // Prioridad por defecto
    },

    // Datos de cotización
    titulo: {
      type: String,
      trim: true,
      maxlength: [200, "El título no puede exceder 200 caracteres"],
    },
    descripcion: {
      type: String,
      trim: true,
    },
    items: [
      {
        descripcion: {
          type: String,
          required: true,
          trim: true,
        },
        cantidad: {
          type: Number,
          required: true,
          min: [1, "La cantidad debe ser mayor a 0"],
        },
        precioUnitario: {
          type: Number,
          required: true,
          min: [0, "El precio unitario no puede ser negativo"],
        },
        subtotal: {
          type: Number,
          required: true,
          min: [0, "El subtotal no puede ser negativo"],
        },
      },
    ],
    subtotal: {
      type: Number,
      min: [0, "El subtotal no puede ser negativo"],
    },
    iva: {
      type: Number,
      min: [0, "El IVA no puede ser negativo"],
    },
    total: {
      type: Number,
      min: [0, "El total no puede ser negativo"],
    },
    validezDias: {
      type: Number,
      default: 30,
      min: [1, "La validez debe ser al menos 1 día"],
    },
    condicionesPago: {
      type: String,
      trim: true,
    },

    // Referencias
    clienteId: {
      type: Schema.Types.ObjectId,
      ref: "Cliente",
    },
    asignadoA: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
    },

    // Fechas
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    fechaActualizacion: {
      type: Date,
    },
    fechaCotizacion: {
      type: Date,
    },
    fechaAprobacion: {
      type: Date,
    },
    fechaConversion: {
      type: Date,
    },

    // Notas internas
    notas: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: "fechaCreacion", updatedAt: "fechaActualizacion" },
    versionKey: false,
    // Compatible con formularios existentes
    strict: false,
  }
);

// Índices para optimización
// Nota: 'numero' ya tiene índice único por la configuración 'unique: true'
CotizacionSchema.index({ email: 1 });
CotizacionSchema.index({ estado: 1 });
CotizacionSchema.index({ prioridad: 1 });
CotizacionSchema.index({ fechaCreacion: -1 });
CotizacionSchema.index({ asignadoA: 1 });
CotizacionSchema.index({ clienteId: 1 });

// Búsqueda de texto
CotizacionSchema.index({
  nombre: "text",
  email: "text",
  empresa: "text",
  titulo: "text",
  descripcion: "text",
});

// Métodos estáticos
CotizacionSchema.statics.findPendientes = function () {
  return this.find({ estado: { $in: ["pendiente", "en_revision"] } }).sort({
    prioridad: -1,
    fechaCreacion: -1,
  });
};

CotizacionSchema.statics.findPorEstado = function (estado: string) {
  return this.find({ estado }).sort({ fechaCreacion: -1 });
};

CotizacionSchema.statics.estadisticas = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$estado",
        count: { $sum: 1 },
        totalValue: { $sum: "$total" },
      },
    },
  ]);
};

// Middleware para actualizar fechas según estado
CotizacionSchema.pre("save", function (next) {
  if (this.isModified("estado")) {
    const now = new Date();

    switch (this.estado) {
      case "cotizada":
        if (!this.fechaCotizacion) this.fechaCotizacion = now;
        break;
      case "aprobada":
        if (!this.fechaAprobacion) this.fechaAprobacion = now;
        break;
      case "convertida_cliente":
        if (!this.fechaConversion) this.fechaConversion = now;
        break;
    }
  }
  next();
});

// Especificar explícitamente la colección
const Cotizacion = mongoose.model<ICotizacion>(
  "Cotizacion",
  CotizacionSchema,
  "contactoformularios"
);

export default Cotizacion;
