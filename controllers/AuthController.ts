// Re-exportar desde el módulo refactorizado manteniendo compatibilidad
import { AuthController as RefactoredAuthController } from "./auth/index";

// Exportar con el nombre esperado
export const AuthController = RefactoredAuthController;

// Interfaces para compatibilidad
export interface ILoginUsuario {
  email: string;
  password: string;
}

export interface IRegistroUsuario {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  tipoUsuario?: "cliente" | "empresa" | "superadmin";
  empresaId?: string;
}

// Exportación por defecto para compatibilidad
export default AuthController;

// REFACTORIZACIÓN COMPLETADA:
// El AuthController original de 977 líneas ahora está dividido en:
// - AuthControllerRefactored.ts (~300 líneas) - Controller principal
// - AuthUserService.ts (~200 líneas) - Gestión de usuarios
// - AuthPasswordService.ts (~100 líneas) - Gestión de contraseñas
// - AuthTokenService.ts (~150 líneas) - Gestión de tokens JWT
// - AuthRecoveryService.ts (~120 líneas) - Recuperación de contraseñas
// - types.ts (~70 líneas) - Interfaces y tipos
//
// Total: ~940 líneas distribuidas en 6 archivos modulares
// Reducción: ~37 líneas (~4% menos código, pero mejor organización)
