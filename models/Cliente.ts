export interface ICliente {
  id: number;
  nombre: string;
  email?: string;
  telefono: string;
  direccion?: string;
  ciudad?: string;
  rut?: string;
  tipoCliente: 'particular' | 'empresa';
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
}

export interface ICrearCliente {
  nombre: string;
  email?: string;
  telefono: string;
  direccion?: string;
  ciudad?: string;
  rut?: string;
  tipoCliente: 'particular' | 'empresa';
}

export interface IActualizarCliente {
  nombre?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  rut?: string;
  tipoCliente?: 'particular' | 'empresa';
  activo?: boolean;
} 