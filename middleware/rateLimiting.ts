import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

// Rate limiter general para todas las rutas de API
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por IP por ventana de tiempo
  message: {
    success: false,
    message:
      "Demasiadas solicitudes desde esta IP, por favor intente más tarde.",
    retryAfter: "15 minutos",
  },
  standardHeaders: true, // Devolver info del rate limit en headers
  legacyHeaders: false,
});

// Rate limiter estricto para autenticación
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Solo 5 intentos de login por IP
  message: {
    success: false,
    message: "Demasiados intentos de autenticación. Intente en 15 minutos.",
    retryAfter: "15 minutos",
  },
  skipSuccessfulRequests: true, // No contar requests exitosos
});

// Rate limiter para formularios de contacto
export const contactFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 formularios por hora por IP
  message: {
    success: false,
    message: "Ha enviado demasiados formularios. Intente en 1 hora.",
    retryAfter: "1 hora",
  },
});

// Rate limiter para lead magnet
export const leadMagnetLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 5, // Máximo 5 descargas de PDF por día por IP
  message: {
    success: false,
    message: "Ha alcanzado el límite de descargas diarias.",
    retryAfter: "24 horas",
  },
});

// Rate limiter para dispositivos IoT
export const iotDataLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // 60 requests por minuto (1 por segundo)
  message: {
    success: false,
    message: "Demasiados datos IoT enviados, reduzca la frecuencia.",
    retryAfter: "1 minuto",
  },
  keyGenerator: (req: Request) => {
    // Usar el ID del dispositivo si está disponible
    return req.body?.idDispositivo || req.ip;
  },
});
