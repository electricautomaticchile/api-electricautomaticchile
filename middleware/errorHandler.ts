import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
  status?: string;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Error de desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  // Error de validación
  if (err.name === 'ValidationError') {
    const message = 'Datos de entrada inválidos';
    error = { ...error, statusCode: 400, message };
  }

  // Error de cast (MongoDB ObjectId)
  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado';
    error = { ...error, statusCode: 404, message };
  }

  // Error de duplicado (MongoDB)
  if ((err as any).code === 11000) {
    const message = 'Recurso duplicado';
    error = { ...error, statusCode: 400, message };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}; 