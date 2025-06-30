import { Router } from "express";
import { ReportesController } from "../controllers/ReportesController";

const router = Router();

// Ruta para reporte de clientes
router.get("/clientes", ReportesController.reporteClientesExcel);

// Ruta para reporte de empresas
router.get("/empresas", ReportesController.reporteEmpresasExcel);

// Ruta para reporte de cotizaciones
router.get("/cotizaciones", ReportesController.reporteCotizacionesExcel);

export default router;
