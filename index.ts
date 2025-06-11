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
const PORT = process.env.PORT || 4000;

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
app.use((req, res, next) => {
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
});

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
