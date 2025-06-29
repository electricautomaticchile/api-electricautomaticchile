import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRecoveryToken extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  numeroCliente: string;
  token: string;
  tipoUsuario: "cliente" | "empresa" | "superadmin";
  usuarioId: mongoose.Types.ObjectId;
  usado: boolean;
  fechaCreacion: Date;
  fechaExpiracion: Date;
}

export interface IRecoveryTokenModel extends Model<IRecoveryToken> {
  generarToken(): string;
  crearToken(
    email: string,
    numeroCliente: string,
    tipoUsuario: "cliente" | "empresa" | "superadmin",
    usuarioId: mongoose.Types.ObjectId
  ): Promise<string>;
  validarToken(token: string): Promise<IRecoveryToken | null>;
}

const RecoveryTokenSchema = new Schema<IRecoveryToken>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    numeroCliente: {
      type: String,
      required: true,
      trim: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tipoUsuario: {
      type: String,
      enum: ["cliente", "empresa", "superadmin"],
      required: true,
    },
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    usado: {
      type: Boolean,
      default: false,
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    fechaExpiracion: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB eliminará automáticamente documentos expirados
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Índices para optimizar consultas
RecoveryTokenSchema.index({ token: 1, usado: 1 });
RecoveryTokenSchema.index({ email: 1, fechaCreacion: -1 });
RecoveryTokenSchema.index({ usuarioId: 1, fechaCreacion: -1 });

// Método estático para generar token único
RecoveryTokenSchema.statics.generarToken = function (): string {
  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return token;
};

// Método estático para crear token de recuperación
RecoveryTokenSchema.statics.crearToken = async function (
  email: string,
  numeroCliente: string,
  tipoUsuario: "cliente" | "empresa" | "superadmin",
  usuarioId: mongoose.Types.ObjectId
) {
  // Invalidar tokens anteriores del mismo usuario
  await this.updateMany({ usuarioId, usado: false }, { usado: true });

  // Crear nuevo token
  const token = (this as any).generarToken();
  const fechaExpiracion = new Date();
  fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 10); // 10 minutos

  const recoveryToken = new this({
    email,
    numeroCliente,
    token,
    tipoUsuario,
    usuarioId,
    fechaExpiracion,
  });

  await recoveryToken.save();
  return token;
};

// Método estático para validar token
RecoveryTokenSchema.statics.validarToken = async function (token: string) {
  const recoveryToken = await this.findOne({
    token,
    usado: false,
    fechaExpiracion: { $gt: new Date() },
  });

  return recoveryToken;
};

const RecoveryToken = mongoose.model<IRecoveryToken, IRecoveryTokenModel>(
  "RecoveryToken",
  RecoveryTokenSchema
);

export default RecoveryToken;
