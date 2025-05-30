export interface IProducto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria: string;
  stock: number;
  stockMinimo: number;
  marca?: string;
  modelo?: string;
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
}

export interface ICrearProducto {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria: string;
  stock: number;
  stockMinimo: number;
  marca?: string;
  modelo?: string;
}

export interface IActualizarProducto {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  categoria?: string;
  stock?: number;
  stockMinimo?: number;
  marca?: string;
  modelo?: string;
  activo?: boolean;
} 