import { Router } from "express";
import ArduinoController from "../controllers/ArduinoController";

const router = Router();

// URL del micro-servicio Python (FastAPI)
const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8001";

// Helper para invocar al servicio Python
async function callPython(path: string) {
  const res = await fetch(`${PYTHON_SERVICE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Python service error: ${res.status} ${text}`);
  }
  return res.json();
}

// Rutas para control de Arduino
router.get("/status", async (_req, res) => {
  try {
    const data = await fetch(`${PYTHON_SERVICE_URL}/status`).then((r) =>
      r.json()
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({
      connected: false,
      port: "",
      led_status: "DESCONOCIDO",
      recent_messages: ["Error de conexión"],
    });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    const data = await fetch(`${PYTHON_SERVICE_URL}/stats`).then((r) =>
      r.json()
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({
      total_commands: 0,
      on_commands: 0,
      total_time_on: 0,
      avg_session_time: 0,
      efficiency_percentage: 0,
    });
  }
});

router.post("/connect", ArduinoController.conectar);

router.post("/disconnect", ArduinoController.desconectar);

router.post("/control/:action", ArduinoController.enviarComando);

router.get("/stats/:empresaId", ArduinoController.obtenerEstadisticas);

router.get("/export/:empresaId", ArduinoController.exportarDatos);

// Rutas para gestión de dispositivos Arduino específicos
router.get("/devices/:empresaId", ArduinoController.obtenerDispositivosEmpresa);

router.post(
  "/devices/:empresaId/register",
  ArduinoController.registrarDispositivo
);

router.put(
  "/devices/:deviceId/configure",
  ArduinoController.configurarDispositivo
);

router.post("/led/on", async (_req, res) => {
  try {
    const data = await callPython("/led/on");
    res.json({ success: true, data });
  } catch (error) {
    console.error("❌ Error encendiendo LED:", error);
    res.status(500).json({ success: false, message: "Error encendiendo LED" });
  }
});

router.post("/led/off", async (_req, res) => {
  try {
    const data = await callPython("/led/off");
    res.json({ success: true, data });
  } catch (error) {
    console.error("❌ Error apagando LED:", error);
    res.status(500).json({ success: false, message: "Error apagando LED" });
  }
});

router.get("/export", async (req, res) => {
  const format = (req.query.format as string) || "json";
  const days = req.query.days;
  try {
    const url = new URL(`${PYTHON_SERVICE_URL}/export`);
    url.searchParams.set("format", format);
    if (days) url.searchParams.set("days", days.toString());
    const response = await fetch(url.toString());
    if (!response.ok) {
      const text = await response.text();
      res.status(500).send(text);
      return;
    }
    // Reenviar headers y cuerpo tal cual para descarga
    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "application/octet-stream"
    );
    const disposition = response.headers.get("content-disposition");
    if (disposition) res.setHeader("Content-Disposition", disposition);
    const stream = response.body as unknown as NodeJS.ReadableStream;
    stream.pipe(res);
  } catch (error) {
    res.status(500).send("Error exportando datos");
  }
});

export default router;
