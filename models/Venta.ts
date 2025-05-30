export interface IDetalleVenta {
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface IVenta {
  id: number;
  clienteId: number;
  usuarioId: number;
  fecha: Date;
  total: number;
  estado: 'pendiente' | 'completada' | 'cancelada';
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  detalles: IDetalleVenta[];
  observaciones?: string;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
}

export interface ICrearVenta {
  clienteId: number;
  usuarioId: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  detalles: Omit<IDetalleVenta, 'nombreProducto' | 'subtotal'>[];
  observaciones?: string;
}

export interface IActualizarVenta {
  estado?: 'pendiente' | 'completada' | 'cancelada';
  metodoPago?: 'efectivo' | 'tarjeta' | 'transferencia';
  observaciones?: string;
} 