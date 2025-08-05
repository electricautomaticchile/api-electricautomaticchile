import mongoose, { Schema, Document } from "mongoose";

export interface ICommandHistory extends Document {
  id: string;
  deviceId: mongoose.Types.ObjectId;
  command: string;
  target?: string;
  parameters: Record<string, any>;

  // Información de ejecución
  status:
    | "queued"
    | "executing"
    | "completed"
    | "failed"
    | "timeout"
    | "cancelled";
  result?: any;
  error?: string;
  executionTime?: number; // en milisegundos

  // Información del usuario
  executedBy: mongoose.Types.ObjectId;
  userRole: string;
  userType: string;

  // Timestamps
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Metadatos del comando
  commandType: "hardware" | "configuration" | "diagnostic" | "maintenance";
  priority: "low" | "normal" | "high" | "critical";

  // Validación y autorización
  authorized: boolean;
  authorizationChecks: {
    deviceAccess: boolean;
    commandPermission: boolean;
    rateLimitPassed: boolean;
  };

  // Contexto adicional
  context?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    requestId?: string;
  };

  // Retry information
  retryCount: number;
  maxRetries: number;

  // Metadatos
  metadata?: Record<string, any>;
}

const CommandHistorySchema = new Schema<ICommandHistory>(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Dispositivo",
      required: true,
      index: true,
    },
    command: {
      type: String,
      required: true,
      maxlength: 100,
      index: true,
    },
    target: {
      type: String,
      maxlength: 50,
    },
    parameters: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map(),
    },

    // Estado de ejecución
    status: {
      type: String,
      enum: [
        "queued",
        "executing",
        "completed",
        "failed",
        "timeout",
        "cancelled",
      ],
      default: "queued",
      required: true,
      index: true,
    },
    result: {
      type: Schema.Types.Mixed,
    },
    error: {
      type: String,
      maxlength: 500,
    },
    executionTime: {
      type: Number,
      min: 0,
    },

    // Usuario que ejecutó el comando
    executedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      refPath: "userRole", // Referencia dinámica basada en el rol
    },
    userRole: {
      type: String,
      enum: ["superadmin", "empresa", "cliente"],
      required: true,
      index: true,
    },
    userType: {
      type: String,
      required: true,
    },

    // Timestamps
    queuedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    startedAt: Date,
    completedAt: Date,

    // Metadatos del comando
    commandType: {
      type: String,
      enum: ["hardware", "configuration", "diagnostic", "maintenance"],
      default: "hardware",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "critical"],
      default: "normal",
      index: true,
    },

    // Autorización
    authorized: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    authorizationChecks: {
      deviceAccess: { type: Boolean, default: false },
      commandPermission: { type: Boolean, default: false },
      rateLimitPassed: { type: Boolean, default: false },
    },

    // Contexto
    context: {
      ipAddress: String,
      userAgent: String,
      sessionId: String,
      requestId: String,
    },

    // Retry
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
      min: 0,
      max: 10,
    },

    // Metadatos adicionales
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices para consultas eficientes
CommandHistorySchema.index({ deviceId: 1, queuedAt: -1 });
CommandHistorySchema.index({ executedBy: 1, queuedAt: -1 });
CommandHistorySchema.index({ status: 1, priority: -1 });
CommandHistorySchema.index({ userRole: 1, commandType: 1 });
CommandHistorySchema.index({ authorized: 1, status: 1 });

// Índice TTL para auto-eliminar comandos antiguos
CommandHistorySchema.index(
  { queuedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 }
); // 30 días

// Métodos estáticos
CommandHistorySchema.statics.getCommandsByUser = async function (
  userId: string,
  userRole: string,
  filters: any = {}
) {
  const matchStage = {
    executedBy: userId,
    userRole,
    ...filters,
  };

  return this.find(matchStage)
    .populate("deviceId", "nombre idDispositivo cliente")
    .sort({ queuedAt: -1 });
};

CommandHistorySchema.statics.getCommandsByDevice = async function (
  deviceId: string,
  limit: number = 50
) {
  return this.find({ deviceId })
    .populate("executedBy", "nombre email")
    .sort({ queuedAt: -1 })
    .limit(limit);
};

CommandHistorySchema.statics.getCommandStatistics = async function (
  userId?: string,
  userRole?: string,
  deviceId?: string
) {
  const matchStage: any = {};

  if (userId && userRole) {
    matchStage.executedBy = userId;
    matchStage.userRole = userRole;
  }

  if (deviceId) {
    matchStage.deviceId = deviceId;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
        queued: { $sum: { $cond: [{ $eq: ["$status", "queued"] }, 1, 0] } },
        executing: {
          $sum: { $cond: [{ $eq: ["$status", "executing"] }, 1, 0] },
        },
        avgExecutionTime: { $avg: "$executionTime" },
        successRate: {
          $avg: {
            $cond: [{ $eq: ["$status", "completed"] }, 100, 0],
          },
        },
      },
    },
  ]);
};

CommandHistorySchema.statics.getPendingCommands = async function (
  deviceId?: string,
  priority?: string
) {
  const matchStage: any = {
    status: { $in: ["queued", "executing"] },
    authorized: true,
  };

  if (deviceId) {
    matchStage.deviceId = deviceId;
  }

  if (priority) {
    matchStage.priority = priority;
  }

  return this.find(matchStage)
    .populate("deviceId", "nombre connectionStatus")
    .sort({ priority: -1, queuedAt: 1 }); // Prioridad alta primero, luego FIFO
};

// Métodos de instancia
CommandHistorySchema.methods.markAsExecuting = async function () {
  this.status = "executing";
  this.startedAt = new Date();
  return this.save();
};

CommandHistorySchema.methods.markAsCompleted = async function (
  result?: any,
  executionTime?: number
) {
  this.status = "completed";
  this.completedAt = new Date();
  if (result !== undefined) {
    this.result = result;
  }
  if (executionTime !== undefined) {
    this.executionTime = executionTime;
  }
  return this.save();
};

CommandHistorySchema.methods.markAsFailed = async function (
  error: string,
  executionTime?: number
) {
  this.status = "failed";
  this.completedAt = new Date();
  this.error = error;
  if (executionTime !== undefined) {
    this.executionTime = executionTime;
  }
  return this.save();
};

CommandHistorySchema.methods.canRetry = function (): boolean {
  return (
    this.retryCount < this.maxRetries &&
    ["failed", "timeout"].includes(this.status)
  );
};

CommandHistorySchema.methods.retry = async function () {
  if (!this.canRetry()) {
    throw new Error("Command cannot be retried");
  }

  this.retryCount += 1;
  this.status = "queued";
  this.error = undefined;
  this.result = undefined;
  this.startedAt = undefined;
  this.completedAt = undefined;
  this.queuedAt = new Date();

  return this.save();
};

CommandHistorySchema.methods.cancel = async function (reason?: string) {
  if (["completed", "failed", "cancelled"].includes(this.status)) {
    throw new Error("Command cannot be cancelled");
  }

  this.status = "cancelled";
  this.completedAt = new Date();
  if (reason) {
    this.error = `Cancelled: ${reason}`;
  }

  return this.save();
};

const CommandHistory = mongoose.model<ICommandHistory>(
  "CommandHistory",
  CommandHistorySchema
);

export default CommandHistory;
