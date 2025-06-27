import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";

// Configuración de eventos WebSocket
export interface SocketEvents {
  // Eventos del cliente
  "join-client-room": (clienteId: string) => void;
  "leave-client-room": (clienteId: string) => void;
  "join-admin-room": () => void;
  "device-command": (data: { deviceId: string; command: string }) => void;

  // Eventos del servidor
  "device-data": (data: any) => void;
  "device-alert": (data: any) => void;
  "statistics-update": (data: any) => void;
  "system-notification": (data: any) => void;
  "connection-status": (data: { status: string; message: string }) => void;
}

class WebSocketManager {
  private static instance: WebSocketManager;
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, Set<string>> = new Map(); // clienteId -> socket IDs
  private adminSockets: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [
          "http://localhost:3000",
          "http://localhost:3001",
          "https://electricautomaticchile.com",
          "https://www.electricautomaticchile.com",
          process.env.FRONTEND_URL || "",
          /.*\.amplifyapp\.com$/,
        ],
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
    console.log("🔌 WebSocket Server inicializado");
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket) => {
      console.log(`🔗 Cliente conectado: ${socket.id}`);

      // Autenticación del socket
      socket.on("authenticate", async (token: string) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          socket.data.user = decoded;
          socket.data.authenticated = true;

          socket.emit("connection-status", {
            status: "authenticated",
            message: "Autenticación exitosa",
          });

          console.log(`✅ Socket autenticado para usuario: ${decoded.sub}`);
        } catch (error) {
          socket.emit("connection-status", {
            status: "auth-failed",
            message: "Token inválido",
          });
          socket.disconnect();
        }
      });

      // Unirse a sala de cliente específico
      socket.on("join-client-room", (clienteId: string) => {
        if (!socket.data.authenticated) {
          socket.emit("connection-status", {
            status: "error",
            message: "No autenticado",
          });
          return;
        }

        socket.join(`client-${clienteId}`);

        if (!this.connectedClients.has(clienteId)) {
          this.connectedClients.set(clienteId, new Set());
        }
        this.connectedClients.get(clienteId)!.add(socket.id);

        console.log(
          `📊 Cliente ${socket.id} se unió a sala: client-${clienteId}`
        );

        socket.emit("connection-status", {
          status: "joined-room",
          message: `Conectado a sala del cliente ${clienteId}`,
        });
      });

      // Salir de sala de cliente
      socket.on("leave-client-room", (clienteId: string) => {
        socket.leave(`client-${clienteId}`);

        const clientSockets = this.connectedClients.get(clienteId);
        if (clientSockets) {
          clientSockets.delete(socket.id);
          if (clientSockets.size === 0) {
            this.connectedClients.delete(clienteId);
          }
        }

        console.log(
          `📊 Cliente ${socket.id} salió de sala: client-${clienteId}`
        );
      });

      // Unirse a sala de administradores
      socket.on("join-admin-room", () => {
        if (
          !socket.data.authenticated ||
          (socket.data.user.role !== "admin" &&
            socket.data.user.tipoUsuario !== "superadmin")
        ) {
          socket.emit("connection-status", {
            status: "error",
            message: "Sin permisos de administrador",
          });
          return;
        }

        socket.join("admin-room");
        this.adminSockets.add(socket.id);

        console.log(`👨‍💼 Admin ${socket.id} se unió a sala de administradores`);

        socket.emit("connection-status", {
          status: "joined-admin",
          message: "Conectado a sala de administradores",
        });
      });

      // Comando a dispositivo
      socket.on(
        "device-command",
        (data: { deviceId: string; command: string }) => {
          if (!socket.data.authenticated) return;

          console.log(
            `🎮 Comando recibido para dispositivo ${data.deviceId}: ${data.command}`
          );

          // Aquí se implementaría la lógica para enviar comando al dispositivo
          // Por ejemplo, publicar en una cola de mensajes para el dispositivo IoT

          socket.emit("connection-status", {
            status: "command-sent",
            message: `Comando enviado a dispositivo ${data.deviceId}`,
          });
        }
      );

      // Manejo de desconexión
      socket.on("disconnect", (reason) => {
        console.log(`🔌 Cliente desconectado: ${socket.id}, razón: ${reason}`);

        // Limpiar referencias
        this.connectedClients.forEach((sockets, clienteId) => {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.connectedClients.delete(clienteId);
          }
        });

        this.adminSockets.delete(socket.id);
      });

      // Enviar estado inicial
      socket.emit("connection-status", {
        status: "connected",
        message: "Conectado al servidor WebSocket",
      });
    });
  }

  // Métodos públicos para enviar datos
  public emitToClient(clienteId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(`client-${clienteId}`).emit(event, data);
    console.log(`📤 Enviado a cliente ${clienteId}: ${event}`);
  }

  public emitToAllAdmins(event: string, data: any): void {
    if (!this.io) return;
    this.io.to("admin-room").emit(event, data);
    console.log(`📤 Enviado a admins: ${event}`);
  }

  public broadcastToAll(event: string, data: any): void {
    if (!this.io) return;
    this.io.emit(event, data);
    console.log(`📢 Broadcast: ${event}`);
  }

  // Métodos específicos para IoT
  public emitDeviceData(clienteId: string, deviceData: any): void {
    this.emitToClient(clienteId, "device-data", deviceData);

    // También enviar a admins si están conectados
    if (this.adminSockets.size > 0) {
      this.emitToAllAdmins("device-data", { clienteId, ...deviceData });
    }
  }

  public emitDeviceAlert(clienteId: string, alert: any): void {
    this.emitToClient(clienteId, "device-alert", alert);
    this.emitToAllAdmins("device-alert", { clienteId, ...alert });
  }

  public emitStatisticsUpdate(clienteId: string, statistics: any): void {
    this.emitToClient(clienteId, "statistics-update", statistics);
  }

  public emitSystemNotification(notification: any): void {
    this.broadcastToAll("system-notification", notification);
  }

  // Métodos de utilidad
  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  public getConnectedAdminsCount(): number {
    return this.adminSockets.size;
  }

  public isClientConnected(clienteId: string): boolean {
    return (
      this.connectedClients.has(clienteId) &&
      this.connectedClients.get(clienteId)!.size > 0
    );
  }

  public getConnectionStats() {
    return {
      totalConnections: this.io?.engine.clientsCount || 0,
      connectedClients: this.connectedClients.size,
      connectedAdmins: this.adminSockets.size,
      rooms: Array.from(this.connectedClients.keys()).map(
        (id) => `client-${id}`
      ),
    };
  }
}

export default WebSocketManager;
