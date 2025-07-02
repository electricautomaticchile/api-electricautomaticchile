import { Router } from "express";
import {
  ReportesController,
  reportesRateLimit,
} from "../controllers/ReportesController";

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

// Rutas para generación de reportes (con rate limiting)
router.get("/clientes", ReportesController.reporteClientesExcel);
router.get("/empresas", ReportesController.reporteEmpresasExcel);
router.get("/cotizaciones", ReportesController.reporteCotizacionesExcel);
router.get("/cotizaciones/csv", ReportesController.reporteCotizacionesCSV);

// Rutas para gestión de historial (sin rate limiting agresivo)
router.get("/historial", ReportesController.obtenerHistorialReportes);
router.get("/estadisticas", ReportesController.obtenerEstadisticasReportes);

// Rutas para reportes de estadísticas de consumo
router.get(
  "/estadisticas/:subtipo",
  ReportesController.reporteEstadisticasExcel
);
router.get(
  "/estadisticas/:subtipo/csv",
  ReportesController.reporteEstadisticasCSV
);

// Rutas para reportes de consumo sectorial
router.get(
  "/consumo-sectorial/:subtipo",
  ReportesController.reporteConsumoSectorialExcel
);
router.get(
  "/consumo-sectorial/:subtipo/csv",
  ReportesController.reporteConsumoSectorialCSV
);

// Ruta administrativa para limpieza (solo superusuarios)
router.delete("/cleanup", ReportesController.limpiarReportesAntiguos);

export default router;
