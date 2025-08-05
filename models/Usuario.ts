import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";

// Interfaces TypeScript (mantienen la compatibilidad)
export interface IUsuario extends Document {
  _id: mongoose.Types.ObjectId;
  nombre: string;
  email: string;
  correo?: string; // Campo alternativo para compatibilidad
  numeroCliente?: string; // Campo para login con número de cliente
  password?: string; // Opcional para respuestas (no se devuelve)
  telefono?: string;
  rol: "admin" | "vendedor" | "cliente";
  tipoUsuario: "superadmin" | "empresa" | "cliente";
  empresaId?: mongoose.Types.ObjectId;
  imagenPerfil?: string; // URL de la imagen de perfil
  configuraciones?: {
    notificaciones: boolean;
    tema: "claro" | "oscuro";
    idioma: string;
  };
  ultimoAcceso?: Date;
  activo2FA?: boolean;
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
  // Métodos de instancia
  compararPassword(candidatePassword: string): Promise<boolean>;
}

// Interface para métodos estáticos
export interface IUsuarioModel extends Model<IUsuario> {
  findByEmail(email: string): any;
  findActivos(): any;
}

export interface ICrearUsuario {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  rol?: "admin" | "vendedor" | "cliente";
  tipoUsuario: "superadmin" | "empresa" | "cliente";
  empresaId?: string;
  configuraciones?: {
    notificaciones?: boolean;
    tema?: "claro" | "oscuro";
    idioma?: string;
  };
}

export interface IActualizarUsuario {
  nombre?: string;
  email?: string;
  password?: string;
  telefono?: string;
  rol?: "admin" | "vendedor" | "cliente";
  tipoUsuario?: "superadmin" | "empresa" | "cliente";
  empresaId?: string;
  configuraciones?: {
    notificaciones?: boolean;
    tema?: "claro" | "oscuro";
    idioma?: string;
  };
  activo2FA?: boolean;
  activo?: boolean;
}

export interface ILoginUsuario {
  email: string;
  password: string;
}

export interface IRegistroUsuario {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  tipoUsuario: "empresa" | "cliente";
  empresaId?: number;
}

// Esquema de Mongoose
const UsuarioSchema = new Schema<IUsuario>(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es requerido"],
      trim: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
    },
    email: {
      type: String,
      required: [true, "El email es requerido"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email inválido"],
    },
    correo: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email inválido"],
    },
    numeroCliente: {
      type: String,
      unique: true,
      sparse: true, // Permite valores null/undefined sin conflicto de unique
      trim: true,
    },
    password: {
      type: String,
      required: [true, "La contraseña es requerida"],
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
      select: false, // No incluir en consultas por defecto
    },
    telefono: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, "Formato de teléfono inválido"],
    },
    rol: {
      type: String,
      enum: ["admin", "vendedor", "cliente"],
      default: "cliente",
    },
    tipoUsuario: {
      type: String,
      enum: ["superadmin", "empresa", "cliente"],
      required: [true, "El tipo de usuario es requerido"],
    },
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: "Empresa",
    },
    imagenPerfil: {
      type: String,
      trim: true,
    },
    configuraciones: {
      notificaciones: {
        type: Boolean,
        default: true,
      },
      tema: {
        type: String,
        enum: ["claro", "oscuro"],
        default: "claro",
      },
      idioma: {
        type: String,
        default: "es",
      },
    },
    ultimoAcceso: {
      type: Date,
    },
    activo2FA: {
      type: Boolean,
      default: false,
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
  },
  {
    timestamps: { createdAt: "fechaCreacion", updatedAt: "fechaActualizacion" },
    versionKey: false,
  }
);

// Middlewares de Mongoose
UsuarioSchema.pre("save", async function (next) {
  // Solo hashear la contraseña si ha sido modificada (o es nueva)
  if (!this.isModified("password")) return next();

  try {
    // Hash de la contraseña con salt rounds de 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Métodos de instancia
UsuarioSchema.methods.compararPassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

UsuarioSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Métodos estáticos
UsuarioSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UsuarioSchema.statics.findActivos = function () {
  return this.find({ activo: true });
};

// Índices
UsuarioSchema.index({ tipoUsuario: 1 });
UsuarioSchema.index({ empresaId: 1 });
UsuarioSchema.index({ activo: 1 });
UsuarioSchema.index({ numeroCliente: 1 });

// Crear y exportar el modelo
const Usuario = mongoose.model<IUsuario, IUsuarioModel>(
  "Usuario",
  UsuarioSchema
);

export default Usuario;
