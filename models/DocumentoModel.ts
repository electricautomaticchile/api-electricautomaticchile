import mongoose, { Schema, Document } from "mongoose";

export interface IDocumentoDB extends Document {
  nombre: string;
  nombreOriginal: string;
  url: string;
  tipo: string;
  tamaño: number;
  extension: string;
  entidadTipo: string;
  entidadId: number;
  usuarioSubida: number;
  descripcion?: string;
  categoria?: string;
  esPublico: boolean;
  fechaSubida: Date;
}

const DocumentoSchema = new Schema<IDocumentoDB>({
  nombre: { type: String, required: true },
  nombreOriginal: { type: String, required: true },
  url: { type: String, required: true },
  tipo: { type: String, required: true },
  tamaño: { type: Number, required: true },
  extension: { type: String, required: true },
  entidadTipo: { type: String, required: true },
  entidadId: { type: Number, required: true },
  usuarioSubida: { type: Number, required: true },
  descripcion: String,
  categoria: { type: String, default: "documento" },
  esPublico: { type: Boolean, default: false },
  fechaSubida: { type: Date, default: Date.now },
});

export const DocumentoModel =
  mongoose.models.Documento ||
  mongoose.model<IDocumentoDB>("Documento", DocumentoSchema);
