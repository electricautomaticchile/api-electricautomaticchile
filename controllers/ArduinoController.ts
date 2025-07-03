import { Request, Response } from "express";

// Configuración del servidor Flask
const FLASK_CONFIG = {
  baseUrl: process.env.FLASK_URL || "http://localhost:5000",
  timeout: 5000,
  retryAttempts: 3,
};

// Interfaces para tipos Arduino
interface ArduinoStatus {
  connected: boolean;
  port: string;
  led_status: string;
  recent_messages: string[];
  last_update: Date;
}

interface ArduinoStats {
  total_commands: number;
  on_commands: number;
  total_duration: number;
  avg_duration: number;
  efficiency_percentage: number;
  uptime: number;
}

// Estado simulado para desarrollo
let arduinoState: {
  [empresaId: string]: ArduinoStatus;
} = {};

let arduinoStats: {
  [empresaId: string]: ArduinoStats;
} = {};

export class ArduinoController {
  // GET /api/arduino/status
  static obtenerEstado = async (req: Request, res: Response): Promise<void> => {
    try {
      const { empresaId = "1" } = req.query;
      const empresaKey = empresaId.toString();

      // Si no existe estado para esta empresa, inicializar
      if (!arduinoState[empresaKey]) {
        arduinoState[empresaKey] = {
          connected: false,
          port: "",
          led_status: "DESCONOCIDO",
          recent_messages: [],
          last_update: new Date(),
        };
      }

      // Intentar conectar con Flask real si está disponible
      try {
        const flaskResponse = await fetch(`${FLASK_CONFIG.baseUrl}/status`);

        if (flaskResponse.ok) {
          const flaskData = await flaskResponse.json();
          // Usar Object() para convertir de forma segura el resultado a un objeto
          // y evitar el error TS2698 si `flaskData` no es un objeto.
          arduinoState[empresaKey] = {
            ...Object(flaskData),
            last_update: new Date(),
          };
        }
      } catch (flaskError) {
        console.log("Flask no disponible, usando estado simulado");
        // Usar estado simulado si Flask no está disponible
        arduinoState[empresaKey].last_update = new Date();
      }

      res.status(200).json({
        success: true,
        data: arduinoState[empresaKey],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener estado de Arduino",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // POST /api/arduino/connect
  static conectar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { empresaId = "1", port } = req.body;
      const empresaKey = empresaId.toString();

      // Intentar conectar con Flask real
      try {
        const flaskResponse = await fetch(`${FLASK_CONFIG.baseUrl}/connect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ port }),
        });

        if (flaskResponse.ok) {
          const flaskData = await flaskResponse.json();

          arduinoState[empresaKey] = {
            connected: true,
            port: port || "COM3",
            led_status: "APAGADO",
            recent_messages: ["Arduino conectado exitosamente"],
            last_update: new Date(),
          };

          res.status(200).json({
            success: true,
            message: "Arduino conectado exitosamente",
            data: arduinoState[empresaKey],
          });
          return;
        }
      } catch (flaskError) {
        console.log("Flask no disponible, simulando conexión");
      }

      // Simular conexión si Flask no está disponible
      arduinoState[empresaKey] = {
        connected: true,
        port: port || "COM3",
        led_status: "APAGADO",
        recent_messages: ["Arduino conectado (simulado)"],
        last_update: new Date(),
      };

      res.status(200).json({
        success: true,
        message: "Arduino conectado exitosamente (simulado)",
        data: arduinoState[empresaKey],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al conectar Arduino",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // POST /api/arduino/disconnect
  static desconectar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { empresaId = "1" } = req.body;
      const empresaKey = empresaId.toString();

      // Intentar desconectar con Flask real
      try {
        await fetch(`${FLASK_CONFIG.baseUrl}/disconnect`);
      } catch (flaskError) {
        console.log("Flask no disponible, simulando desconexión");
      }

      // Actualizar estado local
      if (arduinoState[empresaKey]) {
        arduinoState[empresaKey] = {
          connected: false,
          port: "",
          led_status: "DESCONOCIDO",
          recent_messages: ["Arduino desconectado"],
          last_update: new Date(),
        };
      }

      res.status(200).json({
        success: true,
        message: "Arduino desconectado exitosamente",
        data: arduinoState[empresaKey],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al desconectar Arduino",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // POST /api/arduino/control/:action
  static enviarComando = async (req: Request, res: Response): Promise<void> => {
    try {
      const { action } = req.params;
      const { empresaId = "1" } = req.body;
      const empresaKey = empresaId.toString();

      if (!["on", "off", "toggle"].includes(action)) {
        res.status(400).json({
          success: false,
          message: "Comando inválido. Use: on, off, o toggle",
        });
        return;
      }

      // Verificar si Arduino está conectado
      if (!arduinoState[empresaKey]?.connected) {
        res.status(400).json({
          success: false,
          message: "Arduino no está conectado",
        });
        return;
      }

      // Intentar enviar comando a Flask real
      let commandResult = null;
      try {
        const flaskResponse = await fetch(
          `${FLASK_CONFIG.baseUrl}/control/${action}`
        );

        if (flaskResponse.ok) {
          commandResult = await flaskResponse.json();
        }
      } catch (flaskError) {
        console.log("Flask no disponible, simulando comando");
      }

      // Actualizar estado local basado en el comando
      let newLedStatus = arduinoState[empresaKey].led_status;
      switch (action) {
        case "on":
          newLedStatus = "ENCENDIDO";
          break;
        case "off":
          newLedStatus = "APAGADO";
          break;
        case "toggle":
          newLedStatus = newLedStatus === "ENCENDIDO" ? "APAGADO" : "ENCENDIDO";
          break;
      }

      arduinoState[empresaKey].led_status = newLedStatus;
      arduinoState[empresaKey].recent_messages.unshift(
        `Comando ${action} ejecutado - LED ${newLedStatus}`
      );

      // Mantener solo los últimos 5 mensajes
      if (arduinoState[empresaKey].recent_messages.length > 5) {
        arduinoState[empresaKey].recent_messages = arduinoState[
          empresaKey
        ].recent_messages.slice(0, 5);
      }

      arduinoState[empresaKey].last_update = new Date();

      // Actualizar estadísticas
      if (!arduinoStats[empresaKey]) {
        arduinoStats[empresaKey] = {
          total_commands: 0,
          on_commands: 0,
          total_duration: 0,
          avg_duration: 0,
          efficiency_percentage: 0,
          uptime: 0,
        };
      }

      arduinoStats[empresaKey].total_commands++;
      if (action === "on") {
        arduinoStats[empresaKey].on_commands++;
      }

      res.status(200).json({
        success: true,
        message: `Comando ${action} ejecutado exitosamente`,
        data: {
          status: arduinoState[empresaKey],
          command_result: commandResult,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al enviar comando",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // GET /api/arduino/stats/:empresaId
  static obtenerEstadisticas = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { empresaId } = req.params;

      // Inicializar estadísticas si no existen
      if (!arduinoStats[empresaId]) {
        arduinoStats[empresaId] = {
          total_commands: Math.floor(Math.random() * 100) + 50,
          on_commands: Math.floor(Math.random() * 50) + 25,
          total_duration: Math.floor(Math.random() * 10000) + 5000,
          avg_duration: Math.floor(Math.random() * 10) + 3,
          efficiency_percentage: Math.floor(Math.random() * 20) + 80,
          uptime: Math.floor(Math.random() * 86400) + 3600,
        };
      }

      // Intentar obtener estadísticas reales de Flask
      try {
        const flaskResponse = await fetch(`${FLASK_CONFIG.baseUrl}/stats`);

        if (flaskResponse.ok) {
          const flaskStats = await flaskResponse.json();
          // Corregir de la misma manera para las estadísticas
          arduinoStats[empresaId] = {
            ...Object(flaskStats),
            uptime: arduinoStats[empresaId].uptime || 0,
          };
        }
      } catch (flaskError) {
        console.log("Flask no disponible, usando estadísticas simuladas");
      }

      res.status(200).json({
        success: true,
        data: arduinoStats[empresaId],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // GET /api/arduino/export/:empresaId
  static exportarDatos = async (req: Request, res: Response): Promise<void> => {
    try {
      const { empresaId } = req.params;
      const { format = "json", days = 7 } = req.query;

      // Generar datos de ejemplo para exportación
      const datosExportacion = {
        empresa_id: empresaId,
        fecha_generacion: new Date().toISOString(),
        periodo_dias: Number(days),
        estadisticas: arduinoStats[empresaId] || {},
        comandos_recientes: arduinoState[empresaId]?.recent_messages || [],
        estado_actual: arduinoState[empresaId] || {},
        resumen: {
          total_actividades: arduinoStats[empresaId]?.total_commands || 0,
          tiempo_actividad_promedio: `${arduinoStats[empresaId]?.avg_duration || 0}s`,
          eficiencia: `${arduinoStats[empresaId]?.efficiency_percentage || 0}%`,
        },
      };

      if (format === "csv") {
        // Convertir a CSV simple
        const csvHeaders = "Fecha,Comando,Estado,Duracion\n";
        const csvData =
          arduinoState[empresaId]?.recent_messages
            .map(
              (msg, index) =>
                `${new Date().toISOString()},${msg},success,${index + 1}s`
            )
            .join("\n") || "";

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="arduino_data_${empresaId}_${days}d.csv"`
        );
        res.send(csvHeaders + csvData);
      } else {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="arduino_data_${empresaId}_${days}d.json"`
        );
        res.json(datosExportacion);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al exportar datos",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // GET /api/arduino/devices/:empresaId
  static obtenerDispositivosEmpresa = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { empresaId } = req.params;

      // Simular dispositivos Arduino de la empresa
      const dispositivos = [
        {
          id: `ARD-${empresaId}-001`,
          nombre: "Arduino Control Central",
          tipo: "arduino_uno",
          estado: "conectado",
          puerto: "COM3",
          ultima_actividad: new Date(),
          configuracion: {
            baudRate: 9600,
            pins: {
              led: 13,
              sensor: 2,
            },
          },
        },
        {
          id: `ARD-${empresaId}-002`,
          nombre: "Arduino Sensor Temperatura",
          tipo: "arduino_nano",
          estado: "desconectado",
          puerto: "COM4",
          ultima_actividad: new Date(Date.now() - 3600000),
          configuracion: {
            baudRate: 9600,
            pins: {
              temp_sensor: 8,
              relay: 7,
            },
          },
        },
      ];

      res.status(200).json({
        success: true,
        data: dispositivos,
        total: dispositivos.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener dispositivos",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // POST /api/arduino/devices/:empresaId/register
  static registrarDispositivo = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { empresaId } = req.params;
      const { nombre, tipo, puerto, configuracion } = req.body;

      const nuevoDispositivo = {
        id: `ARD-${empresaId}-${Date.now()}`,
        nombre,
        tipo,
        estado: "registrado",
        puerto,
        fecha_registro: new Date(),
        configuracion,
      };

      res.status(201).json({
        success: true,
        message: "Dispositivo Arduino registrado exitosamente",
        data: nuevoDispositivo,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al registrar dispositivo",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // PUT /api/arduino/devices/:deviceId/configure
  static configurarDispositivo = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { deviceId } = req.params;
      const configuracion = req.body;

      res.status(200).json({
        success: true,
        message: "Dispositivo configurado exitosamente",
        data: {
          device_id: deviceId,
          configuracion,
          fecha_configuracion: new Date(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al configurar dispositivo",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };
}
