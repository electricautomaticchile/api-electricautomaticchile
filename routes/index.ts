import { Router } from "express";
import authRoutes from "./authRoutes";
import usuariosRoutes from "./usuariosRoutes";
import superusuariosRoutes from "./superusuariosRoutes";
import clientesRoutes from "./clientesRoutes";
import cotizacionesRoutes from "./cotizacionesRoutes";
import documentosRoutes from "./documentosRoutes";
import mensajesRoutes from "./mensajesRoutes";
import notificacionesRoutes from "./notificacionesRoutes";
import empresasRoutes from "./empresasRoutes";
import dispositivosRoutes from "./dispositivosRoutes";
import leadMagnetRoutes from "./leadMagnetRoutes";
import estadisticasRoutes from "./estadisticasRoutes";
import reportesRoutes from "./reportesRoutes";
import configuracionRoutes from "./configuracionRoutes";
import alertasRoutes from "./alertasRoutes";
// import arduinoRoutes from "./arduinoRoutes"; // Temporalmente deshabilitado hasta implementar Arduino

export const router = Router();

// Rutas principales
router.use("/auth", authRoutes);
router.use("/usuarios", usuariosRoutes);
router.use("/superusuarios", superusuariosRoutes);
router.use("/clientes", clientesRoutes);
router.use("/cotizaciones", cotizacionesRoutes);
router.use("/documentos", documentosRoutes);
router.use("/mensajes", mensajesRoutes);
router.use("/notificaciones", notificacionesRoutes);
router.use("/empresas", empresasRoutes);

// Nuevas rutas implementadas
router.use("/dispositivos", dispositivosRoutes);
router.use("/lead-magnet", leadMagnetRoutes);
router.use("/estadisticas", estadisticasRoutes);
router.use("/reportes", reportesRoutes);
router.use("/configuracion", configuracionRoutes);
router.use("/alertas", alertasRoutes);
// router.use("/arduino", arduinoRoutes); // Temporalmente deshabilitado

// Ruta de información de la API
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API Electric Automatic Chile",
    version: "2.0.0",
    description:
      "API completa para gestión de cotizaciones eléctricas, dispositivos IoT y servicios automatizados",
    endpoints: {
      auth: "/api/auth",
      usuarios: "/api/usuarios",
      superusuarios: "/api/superusuarios",
      clientes: "/api/clientes",
      cotizaciones: "/api/cotizaciones",
      documentos: "/api/documentos",
      mensajes: "/api/mensajes",
      notificaciones: "/api/notificaciones",
      empresas: "/api/empresas",
      dispositivos: "/api/dispositivos",
      "lead-magnet": "/api/lead-magnet",
      estadisticas: "/api/estadisticas",
      reportes: "/api/reportes",
      configuracion: "/api/configuracion",
      alertas: "/api/alertas",
      // arduino: "/api/arduino", // Temporalmente deshabilitado
    },
    features: [
      "Sistema de autenticación completo",
      "Gestión de cotizaciones con estados",
      "Sistema de mensajería interno",
      "Notificaciones push y en tiempo real",
      "Gestión de documentos y archivos",
      "Administración de empresas y clientes",
      "Gestión completa de dispositivos IoT",
      "Sistema de lead magnet automatizado",
      "Estadísticas en tiempo real de consumo",
      "Sistema de alertas en tiempo real",
      "Rate limiting y validaciones centralizadas",
      "API RESTful con paginación y filtros",
    ],
    newFeatures: [
      "🏭 Gestión completa de dispositivos IoT",
      "📊 Estadísticas de consumo en tiempo real",
      "🎯 Sistema de lead magnet automatizado",
      "🚨 Sistema de alertas en tiempo real",
      "🛡️ Rate limiting y seguridad mejorada",
      "✅ Validaciones centralizadas con Zod",
      "📈 Dashboard de métricas empresariales",
    ],
  });
});
