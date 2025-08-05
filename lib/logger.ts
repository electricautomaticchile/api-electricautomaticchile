import winston from "winston";

// Configuración del logger para el backend
const logLevel = process.env.LOG_LEVEL || "info";
const isProduction = process.env.NODE_ENV === "production";

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "api-electricautomaticchile" },
  transports: [
    // Escribir logs de error a error.log
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    // Escribir todos los logs a combined.log
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

// Si no estamos en producción, también loggear a la consola
if (!isProduction) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// En producción, agregar formato más limpio para consola
if (isProduction) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          return `${timestamp} [${level}]: ${stack || message}`;
        })
      ),
    })
  );
}

export default logger;
