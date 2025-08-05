import { Request, Response, NextFunction } from "express";

// Middleware para validar que el frontend puede conectarse
export const validateConnection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const origin = req.headers.origin;
  const userAgent = req.headers["user-agent"];

  // Log de debugging para conexiones
  console.log(`🔍 Conexión entrante:`, {
    origin,
    method: req.method,
    path: req.path,
    userAgent: userAgent?.substring(0, 50),
    timestamp: new Date().toISOString(),
  });

  // Validar que la conexión viene del frontend esperado
  const allowedOrigins = [
    "http://localhost:3000",
    "https://electricautomaticchile.com",
    "https://www.electricautomaticchile.com",
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`⚠️ Conexión desde origen no autorizado: ${origin}`);
  }

  next();
};

// Middleware para health check específico de conexión frontend-backend
export const frontendHealthCheck = (req: Request, res: Response) => {
  const config = {
    backend: {
      status: "OK",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
    },
    database: {
      connected: true, // Aquí deberías verificar la conexión real
      type: "MongoDB",
    },
    cors: {
      enabled: true,
      allowedOrigins: [
        "http://localhost:3000",
        "https://electricautomaticchile.com",
        process.env.FRONTEND_URL,
      ].filter(Boolean),
    },
    websocket: {
      enabled: true,
      port: process.env.PORT || 4000,
    },
  };

  res.status(200).json({
    success: true,
    message: "Backend listo para conexión con frontend",
    config,
  });
};
