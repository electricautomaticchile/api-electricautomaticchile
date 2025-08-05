// Tipos específicos para notificaciones
export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "cotizacion"
  | "venta"
  | "mensaje"
  | "sistema";

export type NotificationPriority = "baja" | "media" | "alta" | "urgente";

export type ActionType = "link" | "button";

export type EntityType =
  | "cotizacion"
  | "venta"
  | "cliente"
  | "producto"
  | "usuario";

export type UserType = "superadmin" | "empresa" | "cliente";

export interface NotificationAction {
  texto: string;
  url: string;
  tipo: ActionType;
}

export interface RelatedEntity {
  tipo: EntityType;
  id: number;
}

export interface NotificationMetadata {
  category: string;
  source: string;
  priority: number;
  actionUrl?: string;
  relatedData?: Record<string, unknown>;
  customFields?: Record<string, unknown>;
}

export interface INotificacion {
  id: number;
  usuarioId: number;
  titulo: string;
  mensaje: string;
  tipo: NotificationType;
  prioridad: NotificationPriority;
  leida: boolean;
  fechaLectura?: Date;
  accion?: NotificationAction;
  entidadRelacionada?: RelatedEntity;
  metadatos?: NotificationMetadata;
  fechaExpiracion?: Date;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
}

export interface ICrearNotificacion {
  usuarioId: number;
  titulo: string;
  mensaje: string;
  tipo?: NotificationType;
  prioridad?: NotificationPriority;
  accion?: NotificationAction;
  entidadRelacionada?: RelatedEntity;
  metadatos?: NotificationMetadata;
  fechaExpiracion?: Date;
}

export interface IActualizarNotificacion {
  leida?: boolean;
  fechaLectura?: Date;
}

export interface INotificacionMasiva {
  tiposUsuario: UserType[];
  empresaIds?: number[];
  titulo: string;
  mensaje: string;
  tipo?: NotificationType;
  prioridad?: NotificationPriority;
  accion?: NotificationAction;
  fechaExpiracion?: Date;
}
