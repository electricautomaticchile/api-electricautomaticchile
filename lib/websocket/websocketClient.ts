import axios from "axios";

export class WebSocketClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.WEBSOCKET_API_URL || "http://localhost:5000";
  }

  // Enviar notificación a usuario específico
  async notifyUser(userId: string, event: string, data: any) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/notify`, {
        targetUserId: userId,
        event,
        data,
      });

      console.log(`📤 Notificación enviada a usuario ${userId}:`, event);
      return response.data;
    } catch (error) {
      console.error("Error enviando notificación a usuario:", error);
      throw error;
    }
  }

  // Enviar notificación a rol específico
  async notifyRole(role: string, event: string, data: any) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/notify`, {
        targetRole: role,
        event,
        data,
      });

      console.log(`📤 Notificación enviada a rol ${role}:`, event);
      return response.data;
    } catch (error) {
      console.error("Error enviando notificación a rol:", error);
      throw error;
    }
  }

  // Broadcast a todos los usuarios conectados
  async broadcast(event: string, data: any) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/notify`, {
        event,
        data,
      });

      console.log(`📤 Broadcast enviado:`, event);
      return response.data;
    } catch (error) {
      console.error("Error enviando broadcast:", error);
      throw error;
    }
  }

  // Enviar datos IoT
  async sendIoTData(deviceId: string, data: any) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/iot/data`, {
        deviceId,
        ...data,
      });

      console.log(`📊 Datos IoT enviados del dispositivo ${deviceId}`);
      return response.data;
    } catch (error) {
      console.error("Error enviando datos IoT:", error);
      throw error;
    }
  }

  // Enviar alerta IoT
  async sendIoTAlert(
    deviceId: string,
    message: string,
    severity: "low" | "medium" | "high" = "medium",
    additionalData?: any
  ) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/iot/alert`, {
        deviceId,
        message,
        severity,
        ...additionalData,
      });

      console.log(
        `🚨 Alerta IoT enviada del dispositivo ${deviceId}: ${message}`
      );
      return response.data;
    } catch (error) {
      console.error("Error enviando alerta IoT:", error);
      throw error;
    }
  }

  // Obtener estadísticas de conexiones
  async getStats() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/stats`);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo estadísticas WebSocket:", error);
      throw error;
    }
  }

  // Verificar si un usuario está conectado
  async isUserConnected(userId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/user/${userId}/status`
      );
      return response.data.data.isConnected;
    } catch (error) {
      console.error("Error verificando conexión de usuario:", error);
      return false;
    }
  }

  // Métodos específicos para eventos de la aplicación
  async notifyNewCotizacion(cotizacionId: string, clienteId: string) {
    return this.notifyRole("admin", "cotizacion:nueva", {
      cotizacionId,
      clienteId,
      timestamp: new Date().toISOString(),
    });
  }

  async notifyStatusChange(
    cotizacionId: string,
    newStatus: string,
    userId: string
  ) {
    return this.notifyUser(userId, "cotizacion:status_changed", {
      cotizacionId,
      newStatus,
      timestamp: new Date().toISOString(),
    });
  }

  async notifyNewMessage(
    messageId: string,
    fromUserId: string,
    toUserId: string
  ) {
    return this.notifyUser(toUserId, "message:new", {
      messageId,
      fromUserId,
      timestamp: new Date().toISOString(),
    });
  }

  async notifyDeviceAlert(
    deviceId: string,
    alertType: string,
    message: string
  ) {
    return this.sendIoTAlert(deviceId, message, "high", {
      alertType,
      timestamp: new Date().toISOString(),
    });
  }

  // === MÉTODOS ESPECÍFICOS PARA IoT ELÉCTRICO ===

  // Enviar lectura de voltaje
  async sendVoltageReading(
    deviceId: string,
    voltage: number,
    options?: {
      phase?: "L1" | "L2" | "L3";
      quality?: "good" | "warning" | "critical";
      location?: string;
    }
  ) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/iot/voltage`, {
        deviceId,
        voltage,
        ...options,
      });

      console.log(`⚡ Lectura de voltaje enviada - ${deviceId}: ${voltage}V`);
      return response.data;
    } catch (error) {
      console.error("Error enviando lectura de voltaje:", error);
      throw error;
    }
  }

  // Enviar lectura de corriente
  async sendCurrentReading(
    deviceId: string,
    current: number,
    options?: {
      phase?: "L1" | "L2" | "L3";
      powerFactor?: number;
      location?: string;
    }
  ) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/iot/current`, {
        deviceId,
        current,
        ...options,
      });

      console.log(`🔋 Lectura de corriente enviada - ${deviceId}: ${current}A`);
      return response.data;
    } catch (error) {
      console.error("Error enviando lectura de corriente:", error);
      throw error;
    }
  }

  // Enviar datos de consumo de energía
  async sendPowerConsumption(
    deviceId: string,
    data: {
      activePower: number;
      energy: number;
      reactivePower?: number;
      apparentPower?: number;
      cost?: number;
      location?: string;
    }
  ) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/iot/power`, {
        deviceId,
        ...data,
      });

      console.log(
        `📊 Consumo de energía enviado - ${deviceId}: ${data.activePower}W`
      );
      return response.data;
    } catch (error) {
      console.error("Error enviando datos de consumo:", error);
      throw error;
    }
  }

  // Reportar estado de conexión de dispositivo
  async reportDeviceConnection(
    deviceId: string,
    status: "connected" | "disconnected" | "reconnecting",
    options?: {
      lastSeen?: Date;
      metadata?: any;
    }
  ) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/iot/connection`, {
        deviceId,
        status,
        lastSeen: options?.lastSeen?.toISOString(),
        metadata: options?.metadata,
      });

      console.log(`🔌 Estado de conexión reportado - ${deviceId}: ${status}`);
      return response.data;
    } catch (error) {
      console.error("Error reportando estado de conexión:", error);
      throw error;
    }
  }

  // Enviar comando de control remoto
  async sendControlCommand(
    deviceId: string,
    action: "on" | "off" | "toggle" | "auto" | "reset",
    options?: {
      switchId?: string;
      reason?: string;
    }
  ) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/iot/control`, {
        deviceId,
        action,
        switchId: options?.switchId,
        reason: options?.reason,
      });

      console.log(`🎛️ Comando de control enviado - ${deviceId}: ${action}`);
      return response.data;
    } catch (error) {
      console.error("Error enviando comando de control:", error);
      throw error;
    }
  }

  // Métodos de conveniencia para alertas específicas
  async notifyPowerOutage(
    deviceId: string,
    location: string,
    options?: {
      affectedDevices?: string[];
      estimatedDuration?: number;
    }
  ) {
    return this.notifyRole("admin", "alert:power_outage", {
      deviceId,
      location,
      affectedDevices: options?.affectedDevices || [],
      estimatedDuration: options?.estimatedDuration,
      timestamp: new Date().toISOString(),
      severity: "critical",
    });
  }

  async notifyVoltageAnomaly(
    deviceId: string,
    currentVoltage: number,
    expectedVoltage: number,
    options?: {
      phase?: string;
      deviation?: number;
    }
  ) {
    const deviation =
      options?.deviation || Math.abs(currentVoltage - expectedVoltage);

    return this.notifyRole("admin", "alert:voltage_anomaly", {
      deviceId,
      currentVoltage,
      expectedVoltage,
      deviation,
      phase: options?.phase,
      timestamp: new Date().toISOString(),
      severity:
        deviation > 30 ? "critical" : deviation > 15 ? "high" : "medium",
    });
  }

  async notifyDeviceReconnection(
    deviceId: string,
    success: boolean,
    options?: {
      attempts?: number;
      reconnectionTime?: number;
      previousStatus?: string;
    }
  ) {
    return this.notifyRole("admin", "device:reconnection_update", {
      deviceId,
      success,
      attempts: options?.attempts || 1,
      reconnectionTime: options?.reconnectionTime || 0,
      previousStatus: options?.previousStatus || "disconnected",
      timestamp: new Date().toISOString(),
    });
  }

  // === MÉTODOS ESPECÍFICOS PARA CONTROL HARDWARE ===

  // Enviar comando Arduino
  async sendArduinoCommand(
    deviceId: string,
    command: "on" | "off" | "toggle" | "status" | "reset",
    options?: {
      target?: "led" | "relay" | "sensor" | "system";
      parameters?: any;
    }
  ) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/hardware/arduino`,
        {
          deviceId,
          command,
          target: options?.target,
          parameters: options?.parameters,
        }
      );

      console.log(`🎛️ Comando Arduino enviado - ${deviceId}: ${command}`);
      return response.data;
    } catch (error) {
      console.error("Error enviando comando Arduino:", error);
      throw error;
    }
  }

  // Control de relés
  async controlRelay(
    deviceId: string,
    relayId: string,
    action: "activate" | "deactivate" | "pulse" | "schedule",
    options?: {
      duration?: number;
      priority?: "low" | "normal" | "high" | "emergency";
    }
  ) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/hardware/relay`, {
        deviceId,
        relayId,
        action,
        duration: options?.duration,
        priority: options?.priority || "normal",
      });

      console.log(
        `🔌 Control relé enviado - ${deviceId}/${relayId}: ${action}`
      );
      return response.data;
    } catch (error) {
      console.error("Error controlando relé:", error);
      throw error;
    }
  }

  // Enviar lectura de sensor
  async sendSensorReading(
    deviceId: string,
    sensorType: string,
    value: number,
    unit: string,
    options?: {
      location?: string;
      calibrated?: boolean;
    }
  ) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/hardware/sensor`, {
        deviceId,
        sensorType,
        value,
        unit,
        location: options?.location,
        calibrated: options?.calibrated !== false,
      });

      console.log(
        `🌡️ Lectura sensor enviada - ${deviceId}/${sensorType}: ${value}${unit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error enviando lectura de sensor:", error);
      throw error;
    }
  }

  // Enviar métricas de performance
  async sendPerformanceMetrics(
    deviceId: string,
    metrics: {
      cpuUsage?: number;
      memoryUsage?: number;
      temperature?: number;
      uptime: number;
      networkLatency?: number;
      errorCount?: number;
    }
  ) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/hardware/metrics`,
        {
          deviceId,
          ...metrics,
        }
      );

      console.log(`📊 Métricas performance enviadas - ${deviceId}`);
      return response.data;
    } catch (error) {
      console.error("Error enviando métricas de performance:", error);
      throw error;
    }
  }

  // Configurar dispositivo
  async configureDevice(
    deviceId: string,
    configType: string,
    configuration: any,
    options?: {
      applyImmediately?: boolean;
    }
  ) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/hardware/config`, {
        deviceId,
        configType,
        configuration,
        applyImmediately: options?.applyImmediately !== false,
      });

      console.log(
        `⚙️ Configuración dispositivo enviada - ${deviceId}: ${configType}`
      );
      return response.data;
    } catch (error) {
      console.error("Error configurando dispositivo:", error);
      throw error;
    }
  }

  // Métodos de conveniencia para control Arduino específico
  async turnOnArduinoLED(deviceId: string) {
    return this.sendArduinoCommand(deviceId, "on", { target: "led" });
  }

  async turnOffArduinoLED(deviceId: string) {
    return this.sendArduinoCommand(deviceId, "off", { target: "led" });
  }

  async resetArduino(deviceId: string) {
    return this.sendArduinoCommand(deviceId, "reset", { target: "system" });
  }

  async activateEmergencyRelay(deviceId: string, relayId: string) {
    return this.controlRelay(deviceId, relayId, "activate", {
      priority: "emergency",
    });
  }

  async sendTemperatureReading(
    deviceId: string,
    temperature: number,
    location?: string
  ) {
    return this.sendSensorReading(deviceId, "temperature", temperature, "°C", {
      location,
    });
  }

  async sendHumidityReading(
    deviceId: string,
    humidity: number,
    location?: string
  ) {
    return this.sendSensorReading(deviceId, "humidity", humidity, "%", {
      location,
    });
  }

  // === MÉTODOS PARA ANÁLISIS PREDICTIVO ===

  // Obtener predicción para un dispositivo
  async getPrediction(deviceId: string, type: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/analytics/prediction/${deviceId}/${type}`
      );

      console.log(`🔮 Predicción obtenida - ${deviceId}/${type}`);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo predicción:", error);
      throw error;
    }
  }

  // Obtener métricas de eficiencia
  async getEfficiencyMetrics(deviceId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/analytics/efficiency/${deviceId}`
      );

      console.log(`⚡ Métricas de eficiencia obtenidas - ${deviceId}`);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo métricas de eficiencia:", error);
      throw error;
    }
  }

  // Detectar anomalías
  async detectAnomalies(deviceId: string, type: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/analytics/anomalies/${deviceId}/${type}`
      );

      console.log(`🚨 Anomalías verificadas - ${deviceId}/${type}`);
      return response.data;
    } catch (error) {
      console.error("Error detectando anomalías:", error);
      throw error;
    }
  }

  // Obtener reporte de eficiencia completo
  async getEfficiencyReport() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/analytics/efficiency-report`
      );

      console.log("📊 Reporte de eficiencia obtenido");
      return response.data;
    } catch (error) {
      console.error("Error obteniendo reporte de eficiencia:", error);
      throw error;
    }
  }

  // Ejecutar análisis predictivo manual
  async triggerPredictiveAnalysis() {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/analytics/trigger`
      );

      console.log("🔮 Análisis predictivo ejecutado manualmente");
      return response.data;
    } catch (error) {
      console.error("Error ejecutando análisis predictivo:", error);
      throw error;
    }
  }

  // Obtener estadísticas del análisis
  async getAnalyticsStats() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/analytics/stats`);

      console.log("📈 Estadísticas de análisis obtenidas");
      return response.data;
    } catch (error) {
      console.error("Error obteniendo estadísticas de análisis:", error);
      throw error;
    }
  }

  // Métodos de conveniencia para análisis específicos
  async analyzeEnergyEfficiency(deviceIds: string[]) {
    const results = [];
    for (const deviceId of deviceIds) {
      try {
        const efficiency = await this.getEfficiencyMetrics(deviceId);
        results.push(efficiency.data);
      } catch (error) {
        console.warn(`No se pudo analizar eficiencia para ${deviceId}`);
      }
    }
    return results;
  }

  async predictDeviceTrends(deviceId: string) {
    const types = ["voltage", "current", "power", "temperature"];
    const predictions = [];

    for (const type of types) {
      try {
        const prediction = await this.getPrediction(deviceId, type);
        predictions.push(prediction.data);
      } catch (error) {
        console.warn(`No se pudo predecir ${type} para ${deviceId}`);
      }
    }

    return predictions;
  }

  async checkDeviceHealth(deviceId: string) {
    const types = ["voltage", "current", "power", "temperature"];
    const anomalies = [];

    for (const type of types) {
      try {
        const anomaly = await this.detectAnomalies(deviceId, type);
        if (anomaly.data.hasAnomaly) {
          anomalies.push({ type, ...anomaly.data });
        }
      } catch (error) {
        console.warn(`No se pudo verificar anomalías ${type} para ${deviceId}`);
      }
    }

    return {
      deviceId,
      hasAnomalies: anomalies.length > 0,
      anomalies,
      healthScore: Math.max(0, 100 - anomalies.length * 25), // Simplificado
    };
  }
}

// Instancia singleton
export const websocketClient = new WebSocketClient();
