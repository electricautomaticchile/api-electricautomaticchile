import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

// Función helper para obtener IP real considerando proxies
const getClientIP = (req: Request): string => {
  return (
    req.ip || (req.ips && req.ips[0]) || req.socket.remoteAddress || "unknown"
  );
};

// Rate limiter general para todas las rutas de API
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === "development" ? 10000 : 100, // 10000 en dev, 100 en producción
  message: {
    success: false,
    message:
      "Demasiadas solicitudes desde esta IP, por favor intente más tarde.",
    retryAfter: "15 minutos",
  },
  standardHeaders: true, // Devolver info del rate limit en headers
  legacyHeaders: false,
  // Configuración robusta para obtener IP del cliente
  keyGenerator: (req: Request) => {
    const clientIP = getClientIP(req);
    if (process.env.NODE_ENV === "development") {
      console.log(`🔍 Rate Limit - IP detectada: ${clientIP}`);
    }
    return clientIP;
  },
  // Skip rate limiting para health checks y endpoints Arduino
  skip: (req: Request) => {
    // En desarrollo, skip rate limiting para localhost
    if (process.env.NODE_ENV === "development") {
      const clientIP = getClientIP(req);
      if (
        clientIP.includes("127.0.0.1") ||
        clientIP.includes("::1") ||
        clientIP.includes("::ffff:127.0.0.1")
      ) {
        return true;
      }
    }
    // Omitir health checks del frontend y API
    if (req.originalUrl === "/health" || req.originalUrl === "/api/health")
      return true;
    // Omitir los endpoints de actualización periódica del dashboard Arduino
    if (
      req.originalUrl.startsWith("/api/arduino/status") ||
      req.originalUrl.startsWith("/api/arduino/stats")
    ) {
      return true;
    }
    return false;
  },
});

// Rate limiter estricto para autenticación
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 1000 : 5, // 1000 en dev, 5 en producción
  message: {
    success: false,
    message: "Demasiados intentos de autenticación. Intente en 15 minutos.",
    retryAfter: "15 minutos",
  },
  skipSuccessfulRequests: true, // No contar requests exitosos
  keyGenerator: (req: Request) => {
    const clientIP = getClientIP(req);
    if (process.env.NODE_ENV === "development") {
      console.log(`🔒 Auth Rate Limit - IP detectada: ${clientIP}`);
    }
    return clientIP;
  },
  // Skip en desarrollo para localhost
  skip: (req: Request) => {
    if (process.env.NODE_ENV === "development") {
      const clientIP = getClientIP(req);
      if (
        clientIP.includes("127.0.0.1") ||
        clientIP.includes("::1") ||
        clientIP.includes("::ffff:127.0.0.1")
      ) {
        return true;
      }
    }
    return false;
  },
});

// Rate limiter para formularios de contacto
export const contactFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: process.env.NODE_ENV === "development" ? 1000 : 3, // 1000 en dev, 3 en producción
  message: {
    success: false,
    message: "Ha enviado demasiados formularios. Intente en 1 hora.",
    retryAfter: "1 hora",
  },
  keyGenerator: (req: Request) => getClientIP(req),
  skip: (req: Request) => {
    if (process.env.NODE_ENV === "development") {
      const clientIP = getClientIP(req);
      if (
        clientIP.includes("127.0.0.1") ||
        clientIP.includes("::1") ||
        clientIP.includes("::ffff:127.0.0.1")
      ) {
        return true;
      }
    }
    return false;
  },
});

// Rate limiter para lead magnet
export const leadMagnetLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: process.env.NODE_ENV === "development" ? 10000 : 5, // 10000 en dev, 5 en producción
  message: {
    success: false,
    message: "Ha alcanzado el límite de descargas diarias.",
    retryAfter: "24 horas",
  },
  keyGenerator: (req: Request) => getClientIP(req),
  skip: (req: Request) => {
    if (process.env.NODE_ENV === "development") {
      const clientIP = getClientIP(req);
      if (
        clientIP.includes("127.0.0.1") ||
        clientIP.includes("::1") ||
        clientIP.includes("::ffff:127.0.0.1")
      ) {
        return true;
      }
    }
    return false;
  },
});

// Rate limiter para dispositivos IoT
export const iotDataLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: process.env.NODE_ENV === "development" ? 10000 : 60, // 10000 en dev, 60 en producción
  message: {
    success: false,
    message: "Demasiados datos IoT enviados, reduzca la frecuencia.",
    retryAfter: "1 minuto",
  },
  keyGenerator: (req: Request) => {
    // Usar el ID del dispositivo si está disponible, sino la IP real
    return req.body?.idDispositivo || getClientIP(req);
  },
  skip: (req: Request) => {
    if (process.env.NODE_ENV === "development") {
      const clientIP = getClientIP(req);
      if (
        clientIP.includes("127.0.0.1") ||
        clientIP.includes("::1") ||
        clientIP.includes("::ffff:127.0.0.1")
      ) {
        return true;
      }
    }
    return false;
  },
});
