export interface IUsuario {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  rol: 'admin' | 'empleado' | 'vendedor';
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
}

export interface ICrearUsuario {
  nombre: string;
  email: string;
  telefono?: string;
  rol: 'admin' | 'empleado' | 'vendedor';
}

export interface IActualizarUsuario {
  nombre?: string;
  email?: string;
  telefono?: string;
  rol?: 'admin' | 'empleado' | 'vendedor';
  activo?: boolean;
} 