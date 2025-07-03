export interface IAlerta {
  _id?: string;
  tipo: "error" | "advertencia" | "informacion" | "exito";
  titulo: string;
  mensaje: string;
  dispositivo?: string; // ID del dispositivo relacionado
  empresaId: string;
  ubicacion?: string;
  importante: boolean;
  leida: boolean;
  resuelta: boolean;
  asignadoA?: string; // ID del técnico asignado
  fechaCreacion: Date;
  fechaResolucion?: Date;
  accionesTomadas?: string;
  metadatos?: {
    temperatura?: number;
    bateria?: number;
    señal?: number;
    consumo?: number;
    [key: string]: any;
  };
}

export interface ICrearAlerta {
  tipo: "error" | "advertencia" | "informacion" | "exito";
  titulo: string;
  mensaje: string;
  dispositivo?: string;
  empresaId: string;
  ubicacion?: string;
  importante?: boolean;
  metadatos?: any;
}

export interface IResumenAlertas {
  total: number;
  errorCritico: number;
  advertencia: number;
  informacion: number;
  exito: number;
  noLeidas: number;
  importantes: number;
  resueltas: number;
}

export interface IFiltrosAlertas {
  tipo?: "error" | "advertencia" | "informacion" | "exito";
  estado?: "leidas" | "no_leidas" | "resueltas" | "activas";
  importante?: boolean;
  empresaId?: string;
  dispositivo?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
}
