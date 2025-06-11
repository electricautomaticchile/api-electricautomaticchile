import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { router } from "./routes/index";
import { errorHandler } from "./middleware/errorHandler";
import Database from "./config/database";

// Configurar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Configuración de CORS para producción y desarrollo
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [
        // Dominios de producción
        "https://electricautomaticchile.com",
        "https://www.electricautomaticchile.com",
        // URLs de Amplify (agregar todas las versiones)
        "https://main.d1n9khg5twwh3d.amplifyapp.com",
        "https://main.d31trp39fgtk7e.amplifyapp.com",
        // Variable de entorno personalizable
        process.env.FRONTEND_URL,
      ].filter((origin): origin is string => Boolean(origin)) // Filtrar valores nulos/undefined
    : [
        // Desarrollo local
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        // URLs de Amplify para testing
        "https://main.d1n9khg5twwh3d.amplifyapp.com",
        "https://main.d31trp39fgtk7e.amplifyapp.com",
      ];

const corsOptions = {
  origin: allowedOrigins,
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

// Middleware de debugging CORS (solo en desarrollo)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`🌐 CORS Debug - Origin: ${req.headers.origin}`);
    console.log(`🌐 CORS Debug - Method: ${req.method}`);
    console.log(`🌐 CORS Debug - Allowed Origins:`, allowedOrigins);
    next();
  });
}

// Middlewares de seguridad
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors(corsOptions));

// Middleware de logging
app.use(morgan("combined"));

// Middlewares para parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rutas principales
app.use("/api", router);

// Ruta de health check
app.get("/health", (req, res) => {
  const database = Database.getInstance();
  res.status(200).json({
    status: "OK",
    message: "API Electricautomaticchile funcionando correctamente",
    timestamp: new Date().toISOString(),
    database: {
      connected: database.isDBConnected(),
      connection: database.isDBConnected() ? "MongoDB Atlas" : "Desconectado",
    },
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Manejar rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
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
    });
  } catch (error) {
    console.error("💥 Error al iniciar el servidor:", error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();
