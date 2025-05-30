import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { router } from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import Database from './config/database';

// Configurar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Configuración de CORS para producción y desarrollo
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://electricautomaticchile.com']
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://main.d1n9khg5twwh3d.amplifyapp.com'
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middlewares de seguridad
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));
app.use(cors(corsOptions));

// Middleware de logging
app.use(morgan('combined'));

// Middlewares para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas principales
app.use('/api', router);

// Ruta de health check
app.get('/health', (req, res) => {
  const database = Database.getInstance();
  res.status(200).json({
    status: 'OK',
    message: 'API Electricautomaticchile funcionando correctamente',
    timestamp: new Date().toISOString(),
    database: {
      connected: database.isDBConnected(),
      connection: database.isDBConnected() ? 'MongoDB Atlas' : 'Desconectado'
    }
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
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
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('💥 Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer(); 