import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

export class WebSocketServer {
  private io: SocketIOServer;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [
          "http://localhost:3000",
          "https://electricautomaticchile.com",
          "https://www.electricautomaticchile.com",
          process.env.FRONTEND_URL,
        ].filter((url): url is string => Boolean(url)),
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`🔌 Cliente conectado: ${socket.id}`);

      // Unirse a sala por tipo de usuario
      socket.on("join-room", (room: string) => {
        socket.join(room);
        console.log(`👤 Cliente ${socket.id} se unió a sala: ${room}`);
      });

      // Manejar desconexión
      socket.on("disconnect", () => {
        console.log(`🔌 Cliente desconectado: ${socket.id}`);
      });
    });
  }

  // Emitir notificación a sala específica
  public emitToRoom(room: string, event: string, data: any) {
    this.io.to(room).emit(event, data);
  }

  // Emitir a todos los clientes
  public emitToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  // Obtener instancia de Socket.IO
  public getIO() {
    return this.io;
  }
}

export let socketServer: WebSocketServer;
