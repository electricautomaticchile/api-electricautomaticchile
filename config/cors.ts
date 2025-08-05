import { CorsOptions } from "cors";

// Configuración centralizada de CORS
export class CorsConfig {
  private static readonly PRODUCTION_ORIGINS = [
    "https://electricautomaticchile.com",
    "https://www.electricautomaticchile.com",
  ];

  private static readonly DEVELOPMENT_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:4000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4000",
  ];

  private static readonly DOCKER_ORIGINS = [
    "http://frontend:3000",
    "http://api:4000",
  ];

  private static readonly AMPLIFY_ORIGINS = [
    "https://main.d1n9khg5twwh3d.amplifyapp.com",
    "https://main.d31trp39fgtk7e.amplifyapp.com",
    "https://d1n9khg5twwh3d.amplifyapp.com",
    "https://d31trp39fgtk7e.amplifyapp.com",
  ];

  static getAllowedOrigins(): string[] {
    const customOrigin = process.env.FRONTEND_URL;
    const isProduction = process.env.NODE_ENV === "production";

    const origins = [
      ...(isProduction ? this.PRODUCTION_ORIGINS : this.DEVELOPMENT_ORIGINS),
      ...this.DOCKER_ORIGINS,
      ...this.AMPLIFY_ORIGINS,
    ];

    if (customOrigin) {
      origins.push(customOrigin);
    }

    return origins.filter((origin): origin is string => Boolean(origin));
  }

  static getCorsOptions(): CorsOptions {
    const allowedOrigins = this.getAllowedOrigins();

    return {
      origin: (origin, callback) => {
        // Permitir requests sin origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`🚫 CORS: Origen no permitido: ${origin}`);
          callback(new Error("No permitido por CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
        "Cache-Control",
        "X-API-Key",
      ],
      exposedHeaders: [
        "X-Total-Count",
        "X-Page-Count",
        "X-Current-Page",
        "X-Rate-Limit-Remaining",
      ],
      maxAge: 86400, // 24 horas
    };
  }

  static logCorsConfiguration(): void {
    const allowedOrigins = this.getAllowedOrigins();
    const isProduction = process.env.NODE_ENV === "production";

    console.log("🌐 Configuración CORS:");
    console.log(`   Entorno: ${isProduction ? "PRODUCCIÓN" : "DESARROLLO"}`);
    console.log(`   Orígenes permitidos: ${allowedOrigins.length}`);

    if (!isProduction) {
      allowedOrigins.forEach((origin, index) => {
        console.log(`   ${index + 1}. ${origin}`);
      });
    }
  }
}
