export interface IMensaje {
  id: number;
  remitenteId: number;
  destinatarioId: number;
  asunto?: string;
  contenido: string;
  tipoMensaje: 'privado' | 'notificacion' | 'sistema' | 'cotizacion' | 'soporte';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  leido: boolean;
  fechaLectura?: Date;
  archivoAdjunto?: string;
  entidadRelacionada?: {
    tipo: 'cotizacion' | 'venta' | 'cliente' | 'producto';
    id: number;
  };
  fechaEnvio: Date;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
}

export interface ICrearMensaje {
  remitenteId: number;
  destinatarioId: number;
  asunto?: string;
  contenido: string;
  tipoMensaje?: 'privado' | 'notificacion' | 'sistema' | 'cotizacion' | 'soporte';
  prioridad?: 'baja' | 'media' | 'alta' | 'urgente';
  archivoAdjunto?: string;
  entidadRelacionada?: {
    tipo: 'cotizacion' | 'venta' | 'cliente' | 'producto';
    id: number;
  };
}

export interface IActualizarMensaje {
  leido?: boolean;
  fechaLectura?: Date;
}

export interface IMensajeConUsuarios extends IMensaje {
  remitente: {
    id: number;
    nombre: string;
    email: string;
    tipoUsuario: string;
  };
  destinatario: {
    id: number;
    nombre: string;
    email: string;
    tipoUsuario: string;
  };
} 