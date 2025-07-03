import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extender la interfaz Request de Express para incluir la propiedad 'user'
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message:
        "Acceso denegado. Token no proporcionado o con formato incorrecto.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret"
    );
    req.user = decoded; // Adjuntar el payload del token a la solicitud
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: "Token inválido o expirado.",
    });
    return;
  }
};
