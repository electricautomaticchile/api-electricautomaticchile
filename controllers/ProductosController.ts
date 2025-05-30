import { Request, Response } from 'express';
import { IProducto, ICrearProducto, IActualizarProducto } from '../models/Producto';

// Simulamos una base de datos en memoria para el ejemplo
let productos: IProducto[] = [
  {
    id: 1,
    nombre: 'Motor Eléctrico 12V',
    descripcion: 'Motor eléctrico de 12V para puertas automáticas',
    precio: 150000,
    categoria: 'Motores',
    stock: 10,
    stockMinimo: 2,
    marca: 'ElectricPro',
    modelo: 'EP-12V-100',
    activo: true,
    fechaCreacion: new Date(),
  }
];

let nextId = 2;

export class ProductosController {
  obtenerTodos = (req: Request, res: Response): void => {
    try {
      const productosActivos = productos.filter(p => p.activo);
      res.status(200).json({
        success: true,
        data: productosActivos,
        total: productosActivos.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener productos',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  obtenerPorId = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const producto = productos.find(p => p.id === id && p.activo);
      
      if (!producto) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: producto
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener producto',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  crear = (req: Request, res: Response): void => {
    try {
      const datosProducto: ICrearProducto = req.body;
      
      const nuevoProducto: IProducto = {
        id: nextId++,
        ...datosProducto,
        activo: true,
        fechaCreacion: new Date()
      };

      productos.push(nuevoProducto);

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: nuevoProducto
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear producto',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  actualizar = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const datosActualizacion: IActualizarProducto = req.body;
      
      const productoIndex = productos.findIndex(p => p.id === id);
      if (productoIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      productos[productoIndex] = {
        ...productos[productoIndex],
        ...datosActualizacion,
        fechaActualizacion: new Date()
      };

      res.status(200).json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: productos[productoIndex]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar producto',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  eliminar = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const productoIndex = productos.findIndex(p => p.id === id);
      
      if (productoIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      productos[productoIndex].activo = false;
      productos[productoIndex].fechaActualizacion = new Date();

      res.status(200).json({
        success: true,
        message: 'Producto eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar producto',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
} 