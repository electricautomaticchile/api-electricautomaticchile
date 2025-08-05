import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { router } from "./routes/index";
import { errorHandler } from "./middleware/errorHandler";
import { generalLimiter, authLimiter } from "./middleware/rateLimiting";
import Database from "./config/database";

// Configurar variables de entorno
dotenv.config({ path: ".env.local" });

const app = express();
const PORT = process.env.PORT || 4000;

// 🔧 CONFIGURACIÓN CRÍTICA: Trust Proxy DEBE ir ANTES de rate limiting
// Necesario para obtener IPs reales detrás de proxies (AWS ALB, App Runner, CloudFlare, etc.)
if (process.env.NODE_ENV === "production") {
  // En producción, confiar en proxies múltiples (AWS ALB + App Runner)
  app.set("trust proxy", true);
  console.log("✅ Trust Proxy habilitado para producción (múltiples proxies)");
} else {
  // En desarrollo, confiar en localhost y algunos proxies locales
  app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);
  console.log("🔧 Trust Proxy configurado para desarrollo");
}

import { CorsConfig } from "./config/cors";

// Middlewares de seguridad
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);
// Configurar CORS
app.use(cors(CorsConfig.getCorsOptions()));
CorsConfig.logCorsConfiguration();

// Rate limiting - aplicar antes del logging para mejor rendimiento
app.use("/api/auth", authLimiter); // Rate limiting de autenticación
app.use("/api", generalLimiter); // Rate limiting general

// Middleware de logging
app.use(morgan("combined"));

// Middlewares para parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rutas principales
app.use("/api", router);

// Ruta de health check mejorada
app.get("/health", async (req, res) => {
  const database = Database.getInstance();

  // Verificar configuración de email
  let emailStatus = "❌ No configurado";
  let emailMessage = "";
  try {
    const { verifyEmailConfiguration } = await import(
      "./lib/email/emailService"
    );
    const emailCheck = verifyEmailConfiguration();
    emailStatus = emailCheck.isConfigured
      ? "✅ Configurado"
      : "⚠️ No configurado";
    emailMessage = emailCheck.message;
  } catch (error) {
    emailStatus = "❌ Error";
    emailMessage = error instanceof Error ? error.message : "Error desconocido";
  }

  const healthStatus = {
    status: "OK",
    message: "API Electricautomaticchile funcionando correctamente",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development",
    database: {
      connected: database.isDBConnected(),
      connection: database.isDBConnected() ? "MongoDB Atlas" : "Desconectado",
    },
    email: {
      status: emailStatus,
      message: emailMessage,
    },
    features: {
      rateLimiting: "✅ Activo",
      validation: "✅ Activo",
      cors: "✅ Activo",
      iotDevices: "✅ Activo",
      leadMagnet: "✅ Activo",
      statistics: "✅ Activo",
      email: emailStatus,
    },
  };

  // Determinar código de respuesta basado en estado de BD
  const statusCode = database.isDBConnected() ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

// Middleware de manejo de errores
app.use(errorHandler);

// Manejar rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
    availableEndpoints: {
      health: "/health",
      api: "/api",
      documentation: "/api", // Aquí se agregará Swagger en el futuro
    },
  });
});

// Función para iniciar el servidor con conexión a base de datos
async function startServer() {
  try {
    // Conectar a la base de datos
    const database = Database.getInstance();
    await database.connect();

    // Iniciar servidor después de conectar a la BD
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📊 API Version: 2.0.0`);
      console.log(`🛡️ Nuevas características activadas:`);
      console.log(`   ✅ Rate Limiting activo`);
      console.log(`   ✅ Validaciones Centralizadas`);
      console.log(`   ✅ Gestión IoT`);
      console.log(`   ✅ Lead Magnet`);
      console.log(`   ✅ Estadísticas en Tiempo Real`);
    });
  } catch (error) {
    console.error("💥 Error al iniciar el servidor:", error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();
