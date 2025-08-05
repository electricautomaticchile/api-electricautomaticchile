import mongoose, { Schema, Document, Model } from "mongoose";

// Tipos específicos para configuración
export type ConfigurationType = "general" | "empresa" | "sistema";

export type ConfigurationValue = string | number | boolean | object | null;

export interface ConfigurationOptions {
  empresaId?: string;
  tipo?: ConfigurationType;
  descripcion?: string;
  esPublica?: boolean;
  editablePorEmpresa?: boolean;
  usuarioId?: string;
}

export interface IConfiguracion extends Document {
  empresaId?: mongoose.Types.ObjectId;
  tipo: ConfigurationType;
  clave: string;
  valor: ConfigurationValue;
  categoria: string;
  descripcion?: string;
  esPublica: boolean;
  editablePorEmpresa: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  creadoPor?: mongoose.Types.ObjectId;
  actualizadoPor?: mongoose.Types.ObjectId;
}

// Interfaz para los métodos estáticos
export interface IConfiguracionModel extends Model<IConfiguracion> {
  obtenerConfiguracion(
    clave: string,
    empresaId?: string,
    valorPorDefecto?: ConfigurationValue
  ): Promise<ConfigurationValue>;

  establecerConfiguracion(
    clave: string,
    valor: ConfigurationValue,
    categoria: string,
    opciones?: ConfigurationOptions
  ): Promise<IConfiguracion>;

  obtenerConfiguracionesPorCategoria(
    categoria: string,
    empresaId?: string
  ): Promise<IConfiguracion[]>;
}

const ConfiguracionSchema = new Schema<IConfiguracion>(
  {
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: "Empresa",
      required: function () {
        return this.tipo === "empresa";
      },
    },
    tipo: {
      type: String,
      enum: ["general", "empresa", "sistema"],
      required: true,
      default: "general",
    },
    clave: {
      type: String,
      required: true,
      index: true,
    },
    valor: {
      type: Schema.Types.Mixed,
      required: true,
    },
    categoria: {
      type: String,
      required: true,
      index: true,
    },
    descripcion: {
      type: String,
    },
    esPublica: {
      type: Boolean,
      default: false,
    },
    editablePorEmpresa: {
      type: Boolean,
      default: true,
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    fechaActualizacion: {
      type: Date,
      default: Date.now,
    },
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
    },
    actualizadoPor: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
    },
  },
  {
    timestamps: {
      createdAt: "fechaCreacion",
      updatedAt: "fechaActualizacion",
    },
  }
);

// Índices compuestos
ConfiguracionSchema.index({ tipo: 1, categoria: 1 });
ConfiguracionSchema.index(
  { empresaId: 1, clave: 1 },
  { unique: true, sparse: true }
);
ConfiguracionSchema.index(
  { clave: 1, tipo: 1 },
  { unique: true, sparse: true }
);

// Middleware para actualizar fechaActualizacion
ConfiguracionSchema.pre("save", function (next) {
  this.fechaActualizacion = new Date();
  next();
});

// Métodos estáticos
ConfiguracionSchema.statics.obtenerConfiguracion = async function (
  clave: string,
  empresaId?: string,
  valorPorDefecto: ConfigurationValue = null
): Promise<ConfigurationValue> {
  try {
    let config;

    // Buscar configuración específica de empresa
    if (empresaId) {
      config = await this.findOne({
        clave,
        empresaId: new mongoose.Types.ObjectId(empresaId),
        tipo: "empresa",
      });
    }

    // Si no encuentra específica de empresa, buscar general
    if (!config) {
      config = await this.findOne({
        clave,
        tipo: { $in: ["general", "sistema"] },
        empresaId: { $exists: false },
      });
    }

    return config ? config.valor : valorPorDefecto;
  } catch (error) {
    console.error("Error obteniendo configuración:", error);
    return valorPorDefecto;
  }
};

ConfiguracionSchema.statics.establecerConfiguracion = async function (
  clave: string,
  valor: ConfigurationValue,
  categoria: string,
  opciones: ConfigurationOptions = {}
): Promise<IConfiguracion> {
  try {
    const filtro: Record<string, unknown> = { clave };

    if (opciones.empresaId) {
      filtro.empresaId = new mongoose.Types.ObjectId(opciones.empresaId);
      filtro.tipo = "empresa";
    } else {
      filtro.tipo = opciones.tipo || "general";
      filtro.empresaId = { $exists: false };
    }

    const actualizacion = {
      valor,
      categoria,
      descripcion: opciones.descripcion,
      esPublica: opciones.esPublica || false,
      editablePorEmpresa: opciones.editablePorEmpresa !== false,
      fechaActualizacion: new Date(),
      ...(opciones.usuarioId && {
        actualizadoPor: new mongoose.Types.ObjectId(opciones.usuarioId),
      }),
    };

    const config = await this.findOneAndUpdate(
      filtro,
      {
        ...actualizacion,
        ...(opciones.empresaId && {
          empresaId: new mongoose.Types.ObjectId(opciones.empresaId),
        }),
        tipo: filtro.tipo,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return config;
  } catch (error) {
    console.error("Error estableciendo configuración:", error);
    throw error;
  }
};

ConfiguracionSchema.statics.obtenerConfiguracionesPorCategoria =
  async function (
    categoria: string,
    empresaId?: string
  ): Promise<IConfiguracion[]> {
    try {
      const filtro: Record<string, unknown> = { categoria };

      if (empresaId) {
        // Obtener configuraciones específicas de empresa y generales
        const [configuracionesEmpresa, configuracionesGenerales] =
          await Promise.all([
            this.find({
              ...filtro,
              empresaId: new mongoose.Types.ObjectId(empresaId),
              tipo: "empresa",
            }),
            this.find({
              ...filtro,
              tipo: { $in: ["general", "sistema"] },
              empresaId: { $exists: false },
            }),
          ]);

        // Combinar configuraciones, dando prioridad a las específicas de empresa
        const configuracionesMap = new Map<string, IConfiguracion>();

        configuracionesGenerales.forEach((config: IConfiguracion) => {
          configuracionesMap.set(config.clave, config);
        });

        configuracionesEmpresa.forEach((config: IConfiguracion) => {
          configuracionesMap.set(config.clave, config);
        });

        return Array.from(configuracionesMap.values());
      } else {
        return await this.find({
          ...filtro,
          tipo: { $in: ["general", "sistema"] },
          empresaId: { $exists: false },
        });
      }
    } catch (error) {
      console.error("Error obteniendo configuraciones por categoría:", error);
      throw error;
    }
  };

const Configuracion = mongoose.model<IConfiguracion, IConfiguracionModel>(
  "Configuracion",
  ConfiguracionSchema
);

export default Configuracion;
