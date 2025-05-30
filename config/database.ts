import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/electricautomatic';

class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('📊 Ya está conectado a MongoDB');
      return;
    }

    try {
      const options = {
        maxPoolSize: 10, // Mantener hasta 10 conexiones de socket
        serverSelectionTimeoutMS: 5000, // Continuar tratando de enviar operaciones por 5 segundos
        socketTimeoutMS: 45000, // Cerrar sockets después de 45 segundos de inactividad
        maxIdleTimeMS: 30000, // Cerrar conexiones después de 30 segundos de inactividad
        retryWrites: true, // Reintentar writes automáticamente
        retryReads: true // Reintentar reads automáticamente
      };

      await mongoose.connect(MONGODB_URI, options);
      this.isConnected = true;
      
      console.log('🟢 MongoDB conectado exitosamente');
      console.log(`📊 Base de datos: ${mongoose.connection.name}`);
      console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
      
    } catch (error) {
      console.error('🔴 Error conectando a MongoDB:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('🔴 MongoDB desconectado');
    } catch (error) {
      console.error('🔴 Error desconectando MongoDB:', error);
      throw error;
    }
  }

  public getConnection() {
    return mongoose.connection;
  }

  public isDBConnected(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

// Configurar eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Error de conexión MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📡 Mongoose desconectado de MongoDB');
});

// Cerrar conexión si la aplicación se termina
process.on('SIGINT', async () => {
  await Database.getInstance().disconnect();
  process.exit(0);
});

export default Database; 