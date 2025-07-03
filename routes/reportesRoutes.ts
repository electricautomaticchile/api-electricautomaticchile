import { Router } from "express";
import {
  ReportesController,
  reportesRateLimit,
} from "../controllers/reportes/ReportesControllerRefactored";

const router = Router();

// Aplicar rate limiting a todas las rutas de generación de reportes
router.use(
  [
    "/clientes",
    "/empresas",
    "/cotizaciones",
    "/estadisticas/:subtipo",
    "/consumo-sectorial/:subtipo",
  ],
  reportesRateLimit
);

// ===== RUTAS PARA REPORTES DE CLIENTES =====
router.get("/clientes", ReportesController.reporteClientesExcel);
router.get("/clientes/csv", (req, res) => {
  req.query.formato = "csv";
  return ReportesController.reporteClientesExcel(req, res);
});
router.get("/clientes/pdf", ReportesController.reporteClientesPDF);

// ===== RUTAS PARA REPORTES DE EMPRESAS =====
router.get("/empresas", ReportesController.reporteEmpresasExcel);
router.get("/empresas/csv", (req, res) => {
  req.query.formato = "csv";
  return ReportesController.reporteEmpresasExcel(req, res);
});
router.get("/empresas/pdf", ReportesController.reporteEmpresasPDF);

// ===== RUTAS PARA REPORTES DE COTIZACIONES =====
router.get("/cotizaciones", ReportesController.reporteCotizacionesExcel);
router.get("/cotizaciones/csv", ReportesController.reporteCotizacionesCSV);
router.get("/cotizaciones/pdf", ReportesController.reporteCotizacionesPDF);

// ===== RUTAS PARA REPORTES DE ESTADÍSTICAS =====
router.get(
  "/estadisticas/:subtipo",
  ReportesController.reporteEstadisticasExcel
);
router.get(
  "/estadisticas/:subtipo/csv",
  ReportesController.reporteEstadisticasCSV
);
router.get(
  "/estadisticas/:subtipo/pdf",
  ReportesController.reporteEstadisticasPDF
);

// ===== RUTAS PARA REPORTES DE CONSUMO SECTORIAL =====
router.get(
  "/consumo-sectorial/:subtipo",
  ReportesController.reporteConsumoSectorialExcel
);
router.get(
  "/consumo-sectorial/:subtipo/csv",
  ReportesController.reporteConsumoSectorialCSV
);
router.get(
  "/consumo-sectorial/:subtipo/pdf",
  ReportesController.reporteConsumoSectorialPDF
);

// ===== RUTAS ESPECIALIZADAS Y DE CONVENIENCIA =====
// Rutas que manejan automáticamente el formato según query param
router.get(
  "/consumo-sectorial",
  ReportesController.generarReporteConsumoSectorial
);
router.get("/estadisticas", ReportesController.generarReporteEstadisticas);

// ===== RUTAS DE GESTIÓN Y UTILIDADES =====
// Rutas para gestión de historial (sin rate limiting agresivo)
router.get("/historial", ReportesController.obtenerHistorialReportes);
router.get("/estadisticas-uso", ReportesController.obtenerEstadisticasReportes);

// Nueva ruta para obtener información de formatos disponibles
router.get("/formatos", ReportesController.obtenerFormatosDisponibles);

// Ruta para estadísticas en tiempo real de dispositivos
router.get(
  "/dispositivos-tiempo-real/:empresaId",
  ReportesController.obtenerEstadisticasDispositivosTiempoReal
);

// ===== RUTAS ADMINISTRATIVAS =====
// Ruta administrativa para limpieza (solo superusuarios)
router.delete("/cleanup", ReportesController.limpiarReportesAntiguos);

export default router;
