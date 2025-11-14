import mongoose, { Schema, Document } from "mongoose";

export interface IRespuestaTicket {
  _id?: mongoose.Types.ObjectId;
  autorId: mongoose.Types.ObjectId;
  autorNombre: string;
  autorTipo: "cliente" | "soporte" | "empresa";
  mensaje: string;
  archivosAdjuntos?: string[];
  fecha: Date;
}

export interface INotificacionTicket {
  tipo: "email" | "sms";
  destinatario: string;
  fecha: Date;
  estado: "enviado" | "fallido";
  error?: string;
}

export interface ITicket extends Document {
  numeroTicket: string;

  // Información del cliente
  clienteId: mongoose.Types.ObjectId;
  numeroCliente: string;
  nombreCliente: string;
  emailCliente: string;
  telefonoCliente?: string;

  // Información del dispositivo (opcional)
  dispositivoId?: mongoose.Types.ObjectId;
  numeroDispositivo?: string;
  nombreDispositivo?: string;

  // Detalles del ticket
  asunto: string;
  descripcion: string;
  categoria: "tecnico" | "facturacion" | "consulta" | "reclamo";
  prioridad: "baja" | "media" | "alta" | "urgente";
  estado: "abierto" | "en-proceso" | "resuelto" | "cerrado";

  // Asignación
  asignadoA?: mongoose.Types.ObjectId;
  asignadoNombre?: string;
  empresaId?: mongoose.Types.ObjectId;

  // Respuestas/Conversación
  respuestas: IRespuestaTicket[];

  // Metadatos
  fechaCreacion: Date;
  fechaActualizacion: Date;
  fechaCierre?: Date;

  // Notificaciones
  notificacionesEnviadas: INotificacionTicket[];
}

const RespuestaTicketSchema = new Schema<IRespuestaTicket>({
  autorId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  autorNombre: {
    type: String,
    required: true,
  },
  autorTipo: {
    type: String,
    enum: ["cliente", "soporte", "empresa"],
    required: true,
  },
  mensaje: {
    type: String,
    required: true,
  },
  archivosAdjuntos: [String],
  fecha: {
    type: Date,
    default: Date.now,
  },
});

const NotificacionTicketSchema = new Schema<INotificacionTicket>({
  tipo: {
    type: String,
    enum: ["email", "sms"],
    required: true,
  },
  destinatario: {
    type: String,
    required: true,
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
  estado: {
    type: String,
    enum: ["enviado", "fallido"],
    required: true,
  },
  error: String,
});

const TicketSchema = new Schema<ITicket>(
  {
    numeroTicket: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Información del cliente
    clienteId: {
      type: Schema.Types.ObjectId,
      ref: "Cliente",
      required: true,
      index: true,
    },
    numeroCliente: {
      type: String,
      required: true,
      index: true,
    },
    nombreCliente: {
      type: String,
      required: true,
    },
    emailCliente: {
      type: String,
      required: true,
    },
    telefonoCliente: String,

    // Información del dispositivo
    dispositivoId: {
      type: Schema.Types.ObjectId,
      ref: "Dispositivo",
    },
    numeroDispositivo: String,
    nombreDispositivo: String,

    // Detalles del ticket
    asunto: {
      type: String,
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    categoria: {
      type: String,
      enum: ["tecnico", "facturacion", "consulta", "reclamo"],
      required: true,
      index: true,
    },
    prioridad: {
      type: String,
      enum: ["baja", "media", "alta", "urgente"],
      default: "media",
      index: true,
    },
    estado: {
      type: String,
      enum: ["abierto", "en-proceso", "resuelto", "cerrado"],
      default: "abierto",
      index: true,
    },

    // Asignación
    asignadoA: {
      type: Schema.Types.ObjectId,
      ref: "Empresa",
    },
    asignadoNombre: String,
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: "Empresa",
    },

    // Respuestas
    respuestas: [RespuestaTicketSchema],

    // Metadatos
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    fechaActualizacion: {
      type: Date,
      default: Date.now,
    },
    fechaCierre: Date,

    // Notificaciones
    notificacionesEnviadas: [NotificacionTicketSchema],
  },
  {
    timestamps: true,
  }
);

// Índices compuestos para búsquedas eficientes
TicketSchema.index({ clienteId: 1, estado: 1 });
TicketSchema.index({ empresaId: 1, estado: 1 });
TicketSchema.index({ fechaCreacion: -1 });

// Middleware para actualizar fechaActualizacion
TicketSchema.pre("save", function (next) {
  this.fechaActualizacion = new Date();
  next();
});

// Método estático para generar número de ticket
TicketSchema.statics.generarNumeroTicket = async function (): Promise<string> {
  const año = new Date().getFullYear();
  const ultimoTicket = await this.findOne({
    numeroTicket: new RegExp(`^TIC-${año}-`),
  })
    .sort({ numeroTicket: -1 })
    .limit(1);

  let numero = 1;
  if (ultimoTicket) {
    const match = ultimoTicket.numeroTicket.match(/TIC-\d{4}-(\d+)/);
    if (match) {
      numero = parseInt(match[1]) + 1;
    }
  }

  return `TIC-${año}-${numero.toString().padStart(3, "0")}`;
};

const Ticket = mongoose.model<ITicket>("Ticket", TicketSchema);

export default Ticket;
