import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";

// Interfaces TypeScript
export interface ISuperusuario extends Document {
  _id: mongoose.Types.ObjectId;
  nombre: string;
  correo: string;
  password?: string; // Opcional para respuestas (no se devuelve)
  passwordVisible?: string; // Contraseña en texto plano para administración
  telefono?: string;
  numeroCliente: string; // Generado automáticamente
  imagenPerfil?: string; // URL de la imagen de perfil
  role: "admin" | "superadmin";
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
  ultimoAcceso?: Date;
  configuraciones?: {
    notificaciones: boolean;
    tema: "claro" | "oscuro";
  };
  // Métodos de instancia
  compararPassword(candidatePassword: string): Promise<boolean>;
}

// Interface para métodos estáticos
export interface ISuperusuarioModel extends Model<ISuperusuario> {
  findByCorreo(correo: string): any;
  findActivos(): any;
  generarNumeroCliente(): Promise<string>;
}

export interface ICrearSuperusuario {
  nombre: string;
  correo: string;
  password: string;
  telefono?: string;
  configuraciones?: {
    notificaciones?: boolean;
    tema?: "claro" | "oscuro";
  };
}

export interface IActualizarSuperusuario {
  nombre?: string;
  correo?: string;
  password?: string;
  telefono?: string;
  activo?: boolean;
  configuraciones?: {
    notificaciones?: boolean;
    tema?: "claro" | "oscuro";
  };
}

// Esquema de Mongoose
const SuperusuarioSchema = new Schema<ISuperusuario>(
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
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Correo inválido"],
    },
    password: {
      type: String,
      required: [true, "La contraseña es requerida"],
      minlength: [8, "La contraseña debe tener al menos 8 caracteres"],
      select: false, // No incluir en consultas por defecto
    },
    passwordVisible: {
      type: String,
      select: false, // No incluir en consultas por defecto por seguridad
    },
    telefono: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, "Formato de teléfono inválido"],
    },
    numeroCliente: {
      type: String,
      required: false, // Se genera automáticamente en pre-save
      unique: true,
      trim: true,
    },
    imagenPerfil: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "superadmin"],
      default: "admin",
      required: true,
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
    ultimoAcceso: {
      type: Date,
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
    },
  },
  {
    timestamps: { createdAt: "fechaCreacion", updatedAt: "fechaActualizacion" },
    versionKey: false,
  }
);

// Middleware para generar número de cliente antes de guardar
SuperusuarioSchema.pre("save", async function (next) {
  try {
    // Generar número de cliente si es un nuevo documento
    if (this.isNew && !this.numeroCliente) {
      this.numeroCliente = await (
        this.constructor as ISuperusuarioModel
      ).generarNumeroCliente();
    }

    // Solo hashear la contraseña si ha sido modificada (o es nueva)
    if (!this.isModified("password")) return next();

    // Guardar la contraseña original para administración
    if (this.password) {
      this.passwordVisible = this.password;
    }

    // Hash de la contraseña con salt rounds de 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Métodos de instancia
SuperusuarioSchema.methods.compararPassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

SuperusuarioSchema.methods.toJSON = function () {
  const superusuarioObject = this.toObject();
  delete superusuarioObject.password;
  return superusuarioObject;
};

// Métodos estáticos
SuperusuarioSchema.statics.findByCorreo = function (correo: string) {
  return this.findOne({ correo: correo.toLowerCase() });
};

SuperusuarioSchema.statics.findActivos = function () {
  return this.find({ activo: true });
};

SuperusuarioSchema.statics.generarNumeroCliente =
  async function (): Promise<string> {
    // Generar número de cliente único con formato compatible: 9XXXXX-X (iniciando con 9 para superadmins)
    let contador = 900000; // Empezar desde 900000 para superadmins
    let numeroCliente = "";
    let existeNumero = true;

    while (existeNumero) {
      // Generar número base
      const numeroBase = contador.toString();
      // Calcular dígito verificador simple (módulo 11)
      let suma = 0;
      for (let i = 0; i < numeroBase.length; i++) {
        suma += parseInt(numeroBase[i]) * (i + 2);
      }
      const digitoVerificador = (11 - (suma % 11)) % 11;
      const dv = digitoVerificador === 10 ? "K" : digitoVerificador.toString();

      numeroCliente = `${numeroBase}-${dv}`;

      // Verificar que no exista en superusuarios ni en clientes
      const existeEnSuperusuarios = await this.findOne({ numeroCliente });
      const ClienteModel = mongoose.model("Cliente");
      const existeEnClientes = await ClienteModel.findOne({ numeroCliente });

      if (!existeEnSuperusuarios && !existeEnClientes) {
        existeNumero = false;
      } else {
        contador++;
      }
    }

    return numeroCliente;
  };

// Índices
SuperusuarioSchema.index({ correo: 1 }, { unique: true });
SuperusuarioSchema.index({ numeroCliente: 1 }, { unique: true });
SuperusuarioSchema.index({ activo: 1 });
SuperusuarioSchema.index({ role: 1 });

// Crear y exportar el modelo
const Superusuario = mongoose.model<ISuperusuario, ISuperusuarioModel>(
  "Superusuario",
  SuperusuarioSchema,
  "superusuarios"
);

export default Superusuario;
