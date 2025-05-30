export interface INotificacion {
  id: number;
  usuarioId: number;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'success' | 'warning' | 'error' | 'cotizacion' | 'venta' | 'mensaje' | 'sistema';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  leida: boolean;
  fechaLectura?: Date;
  accion?: {
    texto: string;
    url: string;
    tipo: 'link' | 'button';
  };
  entidadRelacionada?: {
    tipo: 'cotizacion' | 'venta' | 'cliente' | 'producto' | 'usuario';
    id: number;
  };
  metadatos?: any;
  fechaExpiracion?: Date;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
}

export interface ICrearNotificacion {
  usuarioId: number;
  titulo: string;
  mensaje: string;
  tipo?: 'info' | 'success' | 'warning' | 'error' | 'cotizacion' | 'venta' | 'mensaje' | 'sistema';
  prioridad?: 'baja' | 'media' | 'alta' | 'urgente';
  accion?: {
    texto: string;
    url: string;
    tipo: 'link' | 'button';
  };
  entidadRelacionada?: {
    tipo: 'cotizacion' | 'venta' | 'cliente' | 'producto' | 'usuario';
    id: number;
  };
  metadatos?: any;
  fechaExpiracion?: Date;
}

export interface IActualizarNotificacion {
  leida?: boolean;
  fechaLectura?: Date;
}

export interface INotificacionMasiva {
  tiposUsuario: ('superadmin' | 'empresa' | 'cliente')[];
  empresaIds?: number[];
  titulo: string;
  mensaje: string;
  tipo?: 'info' | 'success' | 'warning' | 'error' | 'sistema';
  prioridad?: 'baja' | 'media' | 'alta' | 'urgente';
  accion?: {
    texto: string;
    url: string;
    tipo: 'link' | 'button';
  };
  fechaExpiracion?: Date;
} 