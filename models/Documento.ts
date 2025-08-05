// Tipos específicos para documentos
export type DocumentCategory =
  | "reporte_tecnico"
  | "imagen"
  | "documento"
  | "manual"
  | "factura"
  | "otro";

export type EntityType =
  | "cliente"
  | "cotizacion"
  | "venta"
  | "usuario"
  | "producto";

export interface DocumentMetadata {
  size: number;
  mimeType: string;
  checksum?: string;
  version?: string;
  tags?: string[];
  uploadedBy?: string;
  processedAt?: Date;
  customFields?: Record<string, unknown>;
}

export interface IDocumento {
  id: number;
  nombre: string;
  nombreOriginal: string;
  url: string;
  tipo: string;
  tamaño: number;
  extension: string;
  entidadTipo: EntityType;
  entidadId: number;
  usuarioSubida: number;
  fechaSubida: Date;
  esPublico: boolean;
  descripcion?: string;
  categoria?: DocumentCategory;
  metadatos?: DocumentMetadata;
  activo: boolean;
  fechaActualizacion?: Date;
}

export interface ICrearDocumento {
  nombre: string;
  nombreOriginal: string;
  url: string;
  tipo: string;
  tamaño: number;
  extension: string;
  entidadTipo: EntityType;
  entidadId: number;
  usuarioSubida: number;
  esPublico?: boolean;
  descripcion?: string;
  categoria?: DocumentCategory;
  metadatos?: DocumentMetadata;
}

export interface IActualizarDocumento {
  nombre?: string;
  descripcion?: string;
  categoria?: DocumentCategory;
  esPublico?: boolean;
  metadatos?: DocumentMetadata;
  activo?: boolean;
}

export interface IDocumentoUpload {
  archivo: Buffer | string;
  nombreOriginal: string;
  tipo: string;
  tamaño: number;
  entidadTipo: EntityType;
  entidadId: number;
  usuarioSubida: number;
  descripcion?: string;
  categoria?: DocumentCategory;
  esPublico?: boolean;
}
