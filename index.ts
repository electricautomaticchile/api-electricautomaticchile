import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { router } from "./routes/index";
import { errorHandler } from "./middleware/errorHandler";
// import { generalLimiter } from "./middleware/rateLimiting"; // authLimiter y generalLimiter desactivados
import Database from "./config/database";

// Configurar variables de entorno
dotenv.config();

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

// Configuración de CORS para producción y desarrollo
const allowedOrigins = [
  // Dominios de producción
  "https://electricautomaticchile.com",
  "https://www.electricautomaticchile.com",
  // Desarrollo local
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:4000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4000",
  // URLs de Amplify (todas las variantes conocidas)
  "https://main.d1n9khg5twwh3d.amplifyapp.com",
  "https://main.d31trp39fgtk7e.amplifyapp.com",
  "https://d1n9khg5twwh3d.amplifyapp.com",
  "https://d31trp39fgtk7e.amplifyapp.com",
  // Variable de entorno personalizable
  process.env.FRONTEND_URL,
  // TEMPORAL: Permitir cualquier dominio de amplifyapp.com para debugging
  /.*\.amplifyapp\.com$/,
].filter((origin): origin is string | RegExp => Boolean(origin));

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Permitir solicitudes sin origen (como Postman, apps móviles, etc.)
    if (!origin) {
      console.log("🌐 CORS: Permitiendo solicitud sin origen");
      return callback(null, true);
    }

    // Verificar si el origen está en la lista de permitidos
    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      if (typeof allowedOrigin === "string") {
        return allowedOrigin === origin;
      } else {
        // Es una RegExp
        return allowedOrigin.test(origin);
      }
    });

    if (isAllowed) {
      console.log(`✅ CORS: Origen permitido - ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS: Origen rechazado - ${origin}`);
      console.log(`❌ CORS: Orígenes permitidos:`, allowedOrigins);
      callback(new Error(`No permitido por CORS: ${origin}`), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
    "X-File-Name",
  ],
  // Permitir preflight para todas las rutas
  preflightContinue: false,
  optionsSuccessStatus: 200,
};
// Middleware de debugging CORS mejorado
/* app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`🌐 CORS Debug - Timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 CORS Debug - Origin: ${origin || "No Origin"}`);
  console.log(`🌐 CORS Debug - Method: ${req.method}`);
  console.log(`🌐 CORS Debug - Path: ${req.path}`);
  console.log(`🌐 CORS Debug - User-Agent: ${req.headers["user-agent"]}`);

  // Agregar headers CORS manualmente como fallback
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,OPTIONS,PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-Requested-With,Accept,Origin,Cache-Control,X-File-Name"
  );

  if (req.method === "OPTIONS") {
    console.log(`🌐 CORS Debug - Handling OPTIONS preflight`);
    res.status(200).end();
    return;
  }

  next();
}); */

// Middlewares de seguridad
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors(corsOptions));

// Rate limiting - aplicar antes del logging para mejor rendimiento
// app.use("/api/auth", authLimiter); // DESACTIVADO: Rate limiting de autenticación
// app.use("/api", generalLimiter); // DESACTIVADO: Rate limiting general

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
      rateLimiting: "⚠️ Desactivado (Desarrollo)",
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
      console.log(`   ⚠️ Rate Limiting (DESACTIVADO para desarrollo)`);
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
