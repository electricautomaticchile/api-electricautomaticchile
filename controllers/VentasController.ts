import { Request, Response } from 'express';
import { IVenta, ICrearVenta, IActualizarVenta } from '../models/Venta';

let ventas: IVenta[] = [
  {
    id: 1,
    clienteId: 1,
    usuarioId: 1,
    fecha: new Date(),
    total: 150000,
    estado: 'completada',
    metodoPago: 'tarjeta',
    detalles: [
      {
        productoId: 1,
        nombreProducto: 'Motor Eléctrico 12V',
        cantidad: 1,
        precioUnitario: 150000,
        subtotal: 150000
      }
    ],
    observaciones: 'Venta de motor para puerta automática',
    fechaCreacion: new Date(),
  }
];

let nextId = 2;

export class VentasController {
  obtenerTodos = (req: Request, res: Response): void => {
    try {
      res.status(200).json({
        success: true,
        data: ventas,
        total: ventas.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener ventas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  obtenerPorId = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const venta = ventas.find(v => v.id === id);
      
      if (!venta) {
        res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: venta
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener venta',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  crear = (req: Request, res: Response): void => {
    try {
      const datosVenta: ICrearVenta = req.body;
      
      // Calcular el total de la venta
      const total = datosVenta.detalles.reduce((acc, detalle) => {
        return acc + (detalle.cantidad * detalle.precioUnitario);
      }, 0);

      const nuevaVenta: IVenta = {
        id: nextId++,
        ...datosVenta,
        fecha: new Date(),
        total,
        estado: 'pendiente',
        detalles: datosVenta.detalles.map(detalle => ({
          ...detalle,
          nombreProducto: `Producto ${detalle.productoId}`, // En una implementación real buscarías el nombre
          subtotal: detalle.cantidad * detalle.precioUnitario
        })),
        fechaCreacion: new Date()
      };

      ventas.push(nuevaVenta);

      res.status(201).json({
        success: true,
        message: 'Venta creada exitosamente',
        data: nuevaVenta
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear venta',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  actualizar = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const datosActualizacion: IActualizarVenta = req.body;
      
      const ventaIndex = ventas.findIndex(v => v.id === id);
      if (ventaIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
        return;
      }

      ventas[ventaIndex] = {
        ...ventas[ventaIndex],
        ...datosActualizacion,
        fechaActualizacion: new Date()
      };

      res.status(200).json({
        success: true,
        message: 'Venta actualizada exitosamente',
        data: ventas[ventaIndex]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar venta',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  eliminar = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const ventaIndex = ventas.findIndex(v => v.id === id);
      
      if (ventaIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
        return;
      }

      // En lugar de eliminar, marcar como cancelada
      ventas[ventaIndex].estado = 'cancelada';
      ventas[ventaIndex].fechaActualizacion = new Date();

      res.status(200).json({
        success: true,
        message: 'Venta cancelada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al cancelar venta',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
} 