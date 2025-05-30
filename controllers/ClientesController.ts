import { Request, Response } from 'express';
import { ICliente, ICrearCliente, IActualizarCliente } from '../models/Cliente';

let clientes: ICliente[] = [
  {
    id: 1,
    nombre: 'Juan Pérez',
    email: 'juan.perez@email.com',
    telefono: '+56987654321',
    direccion: 'Av. Providencia 123',
    ciudad: 'Santiago',
    rut: '12.345.678-9',
    tipoCliente: 'particular',
    activo: true,
    fechaCreacion: new Date(),
  }
];

let nextId = 2;

export class ClientesController {
  obtenerTodos = (req: Request, res: Response): void => {
    try {
      const clientesActivos = clientes.filter(c => c.activo);
      res.status(200).json({
        success: true,
        data: clientesActivos,
        total: clientesActivos.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener clientes',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  obtenerPorId = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const cliente = clientes.find(c => c.id === id && c.activo);
      
      if (!cliente) {
        res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: cliente
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener cliente',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  crear = (req: Request, res: Response): void => {
    try {
      const datosCliente: ICrearCliente = req.body;
      
      const nuevoCliente: ICliente = {
        id: nextId++,
        ...datosCliente,
        activo: true,
        fechaCreacion: new Date()
      };

      clientes.push(nuevoCliente);

      res.status(201).json({
        success: true,
        message: 'Cliente creado exitosamente',
        data: nuevoCliente
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear cliente',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  actualizar = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const datosActualizacion: IActualizarCliente = req.body;
      
      const clienteIndex = clientes.findIndex(c => c.id === id);
      if (clienteIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
        return;
      }

      clientes[clienteIndex] = {
        ...clientes[clienteIndex],
        ...datosActualizacion,
        fechaActualizacion: new Date()
      };

      res.status(200).json({
        success: true,
        message: 'Cliente actualizado exitosamente',
        data: clientes[clienteIndex]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar cliente',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  eliminar = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const clienteIndex = clientes.findIndex(c => c.id === id);
      
      if (clienteIndex === -1) {
        res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
        return;
      }

      clientes[clienteIndex].activo = false;
      clientes[clienteIndex].fechaActualizacion = new Date();

      res.status(200).json({
        success: true,
        message: 'Cliente eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar cliente',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
} 