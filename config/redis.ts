import { createClient } from "redis";

// Configuración del cliente Redis
const redisConfig = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  password: process.env.REDIS_PASSWORD,
  socket: {
    connectTimeout: 50000,
    lazyConnect: true,
  },
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
};

class RedisManager {
  private static instance: RedisManager;
  private client: any;
  private isConnected: boolean = false;

  private constructor() {
    this.client = createClient(redisConfig);
    this.setupEventHandlers();
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  private setupEventHandlers() {
    this.client.on("connect", () => {
      console.log("🔗 Redis: Conectando...");
    });

    this.client.on("ready", () => {
      console.log("✅ Redis: Conectado y listo");
      this.isConnected = true;
    });

    this.client.on("error", (err: Error) => {
      console.error("❌ Redis Error:", err);
      this.isConnected = false;
    });

    this.client.on("end", () => {
      console.log("🔌 Redis: Conexión cerrada");
      this.isConnected = false;
    });

    this.client.on("reconnecting", () => {
      console.log("🔄 Redis: Reconectando...");
    });
  }

  public async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
      }
    } catch (error) {
      console.error("💥 Error conectando a Redis:", error);
      // No lanzar error para que la aplicación pueda funcionar sin Redis
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
        this.isConnected = false;
      }
    } catch (error) {
      console.error("💥 Error desconectando Redis:", error);
    }
  }

  public isRedisConnected(): boolean {
    return this.isConnected;
  }

  // Métodos de cache
  public async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) return null;
      return await this.client.get(key);
    } catch (error) {
      console.error(`Error obteniendo cache para ${key}:`, error);
      return null;
    }
  }

  public async set(
    key: string,
    value: string,
    ttlSeconds?: number
  ): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`Error guardando cache para ${key}:`, error);
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Error eliminando cache para ${key}:`, error);
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(
        `Error verificando existencia de cache para ${key}:`,
        error
      );
      return false;
    }
  }

  // Métodos específicos para la aplicación
  public async cacheEstadisticas(
    clienteId: string,
    data: any,
    ttlMinutes: number = 5
  ): Promise<void> {
    const key = `estadisticas:${clienteId}`;
    await this.set(key, JSON.stringify(data), ttlMinutes * 60);
  }

  public async getCachedEstadisticas(clienteId: string): Promise<any | null> {
    const key = `estadisticas:${clienteId}`;
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  public async cacheDispositivos(
    clienteId: string,
    data: any,
    ttlMinutes: number = 10
  ): Promise<void> {
    const key = `dispositivos:${clienteId}`;
    await this.set(key, JSON.stringify(data), ttlMinutes * 60);
  }

  public async getCachedDispositivos(clienteId: string): Promise<any | null> {
    const key = `dispositivos:${clienteId}`;
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  public async invalidateClientCache(clienteId: string): Promise<void> {
    const patterns = [
      `estadisticas:${clienteId}`,
      `dispositivos:${clienteId}`,
      `alertas:${clienteId}`,
    ];

    for (const pattern of patterns) {
      await this.del(pattern);
    }
  }

  // Método para obtener métricas de Redis
  public async getRedisInfo(): Promise<any> {
    try {
      if (!this.isConnected) return null;

      const info = await this.client.info();
      return {
        connected: this.isConnected,
        info: info,
        memoryUsage: await this.client.memory("usage"),
      };
    } catch (error) {
      console.error("Error obteniendo info de Redis:", error);
      return null;
    }
  }
}

export default RedisManager;
