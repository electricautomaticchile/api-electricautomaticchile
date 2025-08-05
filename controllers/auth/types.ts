import { Request } from "express";

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

export interface ICambioPassword {
  passwordActual: string;
  passwordNueva: string;
}

export interface IRecuperacionPassword {
  emailOrNumeroCliente: string;
}

export interface IRestablecerPassword {
  token: string;
  nuevaPassword: string;
}

export interface IRefreshToken {
  refreshToken: string;
}

export interface IUsuarioToken {
  _id: string;
  nombre?: string;
  nombreEmpresa?: string;
  correo: string;
  email?: string;
  numeroCliente: string;
  telefono?: string;
  tipoUsuario: string;
  role: string;
  // Campo type para compatibilidad con el frontend
  type?: string;
  activo?: boolean;
  estado?: string;
  fechaCreacion?: Date;
  fechaRegistro?: Date;
  ultimoAcceso?: Date;
}

export interface IAuthUser {
  sub: string;
  userId: string;
  clienteId: string;
  numeroCliente: string;
  email: string;
  tipoUsuario: string;
  role: string;
  estado?: string;
}

export interface IAuthRequest extends Request {
  user: IAuthUser;
}

export interface ILoginResponse {
  success: boolean;
  message: string;
  data: {
    user: IUsuarioToken;
    token: string;
    refreshToken: string;
    requiereCambioPassword?: boolean;
  };
}
