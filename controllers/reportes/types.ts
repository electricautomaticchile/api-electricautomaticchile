export interface IUsuarioContexto {
  id: string;
  tipo: "empresa" | "superusuario" | "cliente";
  empresaId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface IConfiguracionReporte {
  tipo:
    | "clientes"
    | "empresas"
    | "cotizaciones"
    | "dispositivos"
    | "estadisticas"
    | "consumo-sectorial";
  formato: "excel" | "csv" | "pdf";
  filtros: any;
  usuario: IUsuarioContexto;
}

export interface IEstadisticasReporte {
  totalRegistros: number;
  tamañoArchivo: number;
  tiempoGeneracion: number;
}

export interface IColumnaReporte {
  key: string;
  header: string;
  width?: number;
  type?: "date" | "currency" | "number";
}

export interface IDatosReporte {
  datos: any[];
  columnas: IColumnaReporte[];
}

export interface IResultadoReporte {
  buffer: Buffer;
  estadisticas: IEstadisticasReporte;
}

export interface IOpcionesPDF {
  titulo: string;
  subtitulo?: string;
  empresa?: string;
  logo?: string;
  orientacion?: "portrait" | "landscape";
  tamaño?: "A4" | "letter";
  margen?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}
