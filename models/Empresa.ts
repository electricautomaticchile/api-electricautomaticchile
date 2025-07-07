import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";

// Interfaces TypeScript
export interface IEmpresa extends Document {
  _id: mongoose.Types.ObjectId;
  nombreEmpresa: string;
  razonSocial: string;
  rut: string;
  correo: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  region: string;
  contactoPrincipal: {
    nombre: string;
    cargo: string;
    telefono: string;
    correo: string;
  };
  numeroCliente: string; // Cambiado de numeroEmpresa a numeroCliente para compatibilidad
  password?: string; // Hash de la contraseña
  passwordVisible?: string; // Contraseña en texto plano para administración
  passwordTemporal?: boolean; // Si necesita cambiar contraseña en próximo login
  imagenPerfil?: string; // URL de la imagen de perfil
  estado: "activo" | "suspendido" | "inactivo";
  fechaCreacion: Date;
  fechaActualizacion?: Date;
  ultimoAcceso?: Date;
  fechaActivacion?: Date;
  fechaSuspension?: Date;
  motivoSuspension?: string;
  configuraciones?: {
    notificaciones: boolean;
    tema: "claro" | "oscuro";
    maxUsuarios: number;
  };
  // Métodos de instancia
  compararPassword(candidatePassword: string): Promise<boolean>;
}

// Interface para métodos estáticos
export interface IEmpresaModel extends Model<IEmpresa> {
  findByCorreo(correo: string): any;
  findByRut(rut: string): any;
  findActivas(): any;
  generarNumeroEmpresa(): Promise<string>;
  generarPasswordTemporal(): string;
}

export interface ICrearEmpresa {
  nombreEmpresa: string;
  razonSocial: string;
  rut: string;
  correo: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  region: string;
  contactoPrincipal: {
    nombre: string;
    cargo: string;
    telefono: string;
    correo: string;
  };
  configuraciones?: {
    notificaciones?: boolean;
    tema?: "claro" | "oscuro";
    maxUsuarios?: number;
  };
}

export interface IActualizarEmpresa {
  nombreEmpresa?: string;
  razonSocial?: string;
  rut?: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  region?: string;
  contactoPrincipal?: {
    nombre?: string;
    cargo?: string;
    telefono?: string;
    correo?: string;
  };
  estado?: "activo" | "suspendido" | "inactivo";
  motivoSuspension?: string;
  passwordTemporal?: boolean;
  fechaSuspension?: Date;
  fechaActivacion?: Date;
  configuraciones?: {
    notificaciones?: boolean;
    tema?: "claro" | "oscuro";
    maxUsuarios?: number;
  };
}

// Esquema de Mongoose
const EmpresaSchema = new Schema<IEmpresa>(
  {
    nombreEmpresa: {
      type: String,
      required: [true, "El nombre de la empresa es requerido"],
      trim: true,
      maxlength: [150, "El nombre no puede exceder 150 caracteres"],
    },
    razonSocial: {
      type: String,
      required: [true, "La razón social es requerida"],
      trim: true,
      maxlength: [200, "La razón social no puede exceder 200 caracteres"],
    },
    rut: {
      type: String,
      required: [true, "El RUT es requerido"],
      // unique: true, // ❌ REMOVIDO: Permite RUT duplicados
      trim: true,
      uppercase: true,
      match: [
        /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/,
        "Formato de RUT inválido (ej: 76.123.456-7)",
      ],
    },
    correo: {
      type: String,
      required: [true, "El correo es requerido"],
      // unique: true, // ❌ REMOVIDO: Permite correo duplicados
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Correo inválido"],
    },
    telefono: {
      type: String,
      required: [true, "El teléfono es requerido"],
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, "Formato de teléfono inválido"],
    },
    direccion: {
      type: String,
      required: [true, "La dirección es requerida"],
      trim: true,
      maxlength: [300, "La dirección no puede exceder 300 caracteres"],
    },
    ciudad: {
      type: String,
      required: [true, "La ciudad es requerida"],
      trim: true,
      maxlength: [100, "La ciudad no puede exceder 100 caracteres"],
    },
    region: {
      type: String,
      required: [true, "La región es requerida"],
      trim: true,
      maxlength: [100, "La región no puede exceder 100 caracteres"],
    },
    contactoPrincipal: {
      nombre: {
        type: String,
        required: [true, "El nombre del contacto principal es requerido"],
        trim: true,
        maxlength: [100, "El nombre no puede exceder 100 caracteres"],
      },
      cargo: {
        type: String,
        required: [true, "El cargo del contacto es requerido"],
        trim: true,
        maxlength: [100, "El cargo no puede exceder 100 caracteres"],
      },
      telefono: {
        type: String,
        required: [true, "El teléfono del contacto es requerido"],
        trim: true,
        match: [/^\+?[\d\s\-\(\)]+$/, "Formato de teléfono inválido"],
      },
      correo: {
        type: String,
        required: [true, "El correo del contacto es requerido"],
        lowercase: true,
        trim: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Correo inválido",
        ],
      },
    },
    numeroCliente: {
      type: String,
      required: false, // Se genera automáticamente
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: false, // Se genera automáticamente
      minlength: [8, "La contraseña debe tener al menos 8 caracteres"],
      select: false, // No incluir en consultas por defecto
    },
    passwordVisible: {
      type: String,
      select: false, // No incluir en consultas por defecto por seguridad
    },
    passwordTemporal: {
      type: Boolean,
      default: true, // Por defecto necesita cambiar contraseña
    },
    imagenPerfil: {
      type: String,
      trim: true,
    },
    estado: {
      type: String,
      enum: ["activo", "suspendido", "inactivo"],
      default: "activo",
      required: true,
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
    fechaActivacion: {
      type: Date,
    },
    fechaSuspension: {
      type: Date,
    },
    motivoSuspension: {
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
      maxUsuarios: {
        type: Number,
        default: 10,
        min: [1, "Debe permitir al menos 1 usuario"],
        max: [100, "No puede exceder 100 usuarios"],
      },
    },
  },
  {
    timestamps: { createdAt: "fechaCreacion", updatedAt: "fechaActualizacion" },
    versionKey: false,
  }
);

// Middleware para generar número de empresa y contraseña antes de guardar
EmpresaSchema.pre("save", async function (next) {
  try {
    // Generar número de empresa si es un nuevo documento
    if (this.isNew && !this.numeroCliente) {
      this.numeroCliente = await (
        this.constructor as IEmpresaModel
      ).generarNumeroEmpresa();
    }

    // Para nuevos documentos, generar contraseña solo si no existe
    // Para documentos existentes, solo si la contraseña ha sido modificada
    if (this.isNew || this.isModified("password")) {
      // Si no tiene contraseña, generar una temporal
      if (!this.password) {
        this.password = (
          this.constructor as IEmpresaModel
        ).generarPasswordTemporal();
        this.passwordTemporal = true;
      }

      // Guardar la contraseña original para administración ANTES de hashear
      if (this.password && !this.passwordVisible) {
        this.passwordVisible = this.password;
      }

      // Hash de la contraseña con salt rounds de 12
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password!, salt);
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Métodos de instancia
EmpresaSchema.methods.compararPassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

EmpresaSchema.methods.toJSON = function () {
  const empresaObject = this.toObject();
  delete empresaObject.password;
  return empresaObject;
};

// Métodos estáticos
EmpresaSchema.statics.findByCorreo = function (correo: string) {
  return this.findOne({ correo: correo.toLowerCase() });
};

EmpresaSchema.statics.findByRut = function (rut: string) {
  return this.findOne({ rut: rut.toUpperCase() });
};

EmpresaSchema.statics.findActivas = function () {
  return this.find({ estado: "activo" });
};

EmpresaSchema.statics.generarNumeroEmpresa =
  async function (): Promise<string> {
    // Generar número de cliente único con formato: XXXXXX-X (empezando desde 500000 para empresas)
    let contador = 500000; // Usar 500000 para empresas para diferenciar de clientes normales
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

      // Verificar que no exista
      const existe = await this.findOne({ numeroCliente });

      if (!existe) {
        existeNumero = false;
      } else {
        contador++;
      }
    }

    return numeroCliente;
  };

EmpresaSchema.statics.generarPasswordTemporal = function (): string {
  // Generar contraseña temporal segura de 12 caracteres
  const caracteres = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += caracteres.charAt(
      Math.floor(Math.random() * caracteres.length)
    );
  }
  return password;
};

// Índices
// EmpresaSchema.index({ correo: 1 }, { unique: true }); // ❌ REMOVIDO: Permite correo duplicados
// EmpresaSchema.index({ rut: 1 }, { unique: true });    // ❌ REMOVIDO: Permite RUT duplicados
EmpresaSchema.index({ numeroCliente: 1 }, { unique: true }); // ✅ MANTENER: numeroCliente debe ser único
EmpresaSchema.index({ estado: 1 });
EmpresaSchema.index({ nombreEmpresa: "text", razonSocial: "text" });

// ✅ NUEVO: Índice compuesto para optimizar búsquedas de verificación
EmpresaSchema.index({ rut: 1, correo: 1 });

// Crear y exportar el modelo
const Empresa = mongoose.model<IEmpresa, IEmpresaModel>(
  "Empresa",
  EmpresaSchema,
  "empresas"
);

export default Empresa;
