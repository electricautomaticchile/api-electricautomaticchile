export interface IEmpresa {
  id: number;
  nombre: string;
  razonSocial: string;
  rut: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  region: string;
  pais: string;
  sitioWeb?: string;
  giro: string;
  tipoEmpresa: 'cliente' | 'proveedor' | 'socio';
  estado: 'activa' | 'inactiva' | 'suspendida';
  contactoPrincipal: {
    nombre: string;
    email: string;
    telefono: string;
    cargo: string;
  };
  configuraciones?: {
    limiteCotizaciones?: number;
    descuentoEspecial?: number;
    plazoCredito?: number;
    requiereAprobacion?: boolean;
  };
  notas?: string;
  fechaRegistro: Date;
  fechaUltimaActividad?: Date;
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
}

export interface ICrearEmpresa {
  nombre: string;
  razonSocial: string;
  rut: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  region: string;
  pais?: string;
  sitioWeb?: string;
  giro: string;
  tipoEmpresa?: 'cliente' | 'proveedor' | 'socio';
  contactoPrincipal: {
    nombre: string;
    email: string;
    telefono: string;
    cargo: string;
  };
  configuraciones?: {
    limiteCotizaciones?: number;
    descuentoEspecial?: number;
    plazoCredito?: number;
    requiereAprobacion?: boolean;
  };
  notas?: string;
}

export interface IActualizarEmpresa {
  nombre?: string;
  razonSocial?: string;
  rut?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  region?: string;
  pais?: string;
  sitioWeb?: string;
  giro?: string;
  tipoEmpresa?: 'cliente' | 'proveedor' | 'socio';
  estado?: 'activa' | 'inactiva' | 'suspendida';
  contactoPrincipal?: {
    nombre: string;
    email: string;
    telefono: string;
    cargo: string;
  };
  configuraciones?: {
    limiteCotizaciones?: number;
    descuentoEspecial?: number;
    plazoCredito?: number;
    requiereAprobacion?: boolean;
  };
  notas?: string;
  fechaUltimaActividad?: Date;
  activo?: boolean;
} 