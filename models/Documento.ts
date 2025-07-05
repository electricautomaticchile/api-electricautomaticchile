export interface IDocumento {
  id: number;
  nombre: string;
  nombreOriginal: string;
  url: string;
  tipo: string;
  tamaño: number;
  extension: string;
  entidadTipo: "cliente" | "cotizacion" | "venta" | "usuario" | "producto";
  entidadId: number;
  usuarioSubida: number;
  fechaSubida: Date;
  esPublico: boolean;
  descripcion?: string;
  categoria?:
    | "reporte_tecnico"
    | "imagen"
    | "documento"
    | "manual"
    | "factura"
    | "otro";
  metadatos?: any;
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
  entidadTipo: "cliente" | "cotizacion" | "venta" | "usuario" | "producto";
  entidadId: number;
  usuarioSubida: number;
  esPublico?: boolean;
  descripcion?: string;
  categoria?:
    | "reporte_tecnico"
    | "imagen"
    | "documento"
    | "manual"
    | "factura"
    | "otro";
  metadatos?: any;
}

export interface IActualizarDocumento {
  nombre?: string;
  descripcion?: string;
  categoria?:
    | "reporte_tecnico"
    | "imagen"
    | "documento"
    | "manual"
    | "factura"
    | "otro";
  esPublico?: boolean;
  metadatos?: any;
  activo?: boolean;
}

export interface IDocumentoUpload {
  archivo: Buffer | string;
  nombreOriginal: string;
  tipo: string;
  tamaño: number;
  entidadTipo: "cliente" | "cotizacion" | "venta" | "usuario" | "producto";
  entidadId: number;
  usuarioSubida: number;
  descripcion?: string;
  categoria?:
    | "reporte_tecnico"
    | "imagen"
    | "documento"
    | "manual"
    | "factura"
    | "otro";
  esPublico?: boolean;
}
