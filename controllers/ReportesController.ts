// Re-exportar desde el módulo refactorizado manteniendo compatibilidad
import {
  ReportesController as RefactoredReportesController,
  reportesRateLimit as refactoredRateLimit,
} from "./reportes/index";

// Exportar con el nombre esperado
export const ReportesController = RefactoredReportesController;
export const reportesRateLimit = refactoredRateLimit;

// Exportación por defecto para compatibilidad
export default ReportesController;
