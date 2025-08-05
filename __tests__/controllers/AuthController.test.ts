import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthController } from "../../controllers/AuthController";

// Mock dependencies
jest.mock("mongoose");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../../lib/logger");

describe("AuthController", () => {
  let authController: AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    authController = new AuthController();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("login", () => {
    const mockEmpresaUser = {
      _id: "68617f19caa1923bdc0b568b",
      nombreEmpresa: "Segunda Empresa Test",
      numeroCliente: "500001-5",
      correo: "segunda@empresa.com",
      password: "$2b$12$hashedPassword",
      estado: "activo",
      role: "empresa",
    };

    const mockClienteUser = {
      _id: "688e5ee1233c78b3e47c7155",
      nombre: "Felipe",
      numeroCliente: "629903-3",
      correo: "test@gmail.com",
      password: "$2b$12$hashedPassword",
      activo: true,
      role: "cliente",
    };

    const mockSuperusuarioUser = {
      _id: "68606cebc145750be897e74c",
      nombre: "Felipe",
      numeroCliente: "900000-4",
      correo: "pipeaalzamora@gmail.com",
      password: "$2b$12$hashedPassword",
      activo: true,
      role: "superadmin",
    };

    beforeEach(() => {
      // Mock mongoose connection
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn(),
        }),
      };

      (mongoose.connection as any) = {
        db: mockDb,
      };
    });

    it("should successfully login empresa user with correct credentials", async () => {
      // Arrange
      mockRequest.body = {
        email: "500001-5",
        password: "stackmern",
      };

      const mockCollection = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // superusuarios
          .mockResolvedValueOnce(mockEmpresaUser) // empresas
          .mockResolvedValueOnce(null), // clientes (not reached)
      };

      (mongoose.connection.db!.collection as jest.Mock).mockReturnValue(
        mockCollection
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("mock-jwt-token");

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        numeroCliente: "500001-5",
        activo: true,
      });
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        numeroCliente: "500001-5",
        estado: "activo",
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "stackmern",
        mockEmpresaUser.password
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          token: "mock-jwt-token",
          user: {
            id: mockEmpresaUser._id,
            name: mockEmpresaUser.nombreEmpresa,
            email: mockEmpresaUser.correo,
            numeroCliente: mockEmpresaUser.numeroCliente,
            type: "empresa",
            role: "empresa",
            tipoUsuario: "empresa",
          },
        },
        message: "Login exitoso",
      });
    });

    it("should fail login for empresa user with estado inactivo", async () => {
      // Arrange
      mockRequest.body = {
        email: "500001-5",
        password: "stackmern",
      };

      const mockCollection = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // superusuarios
          .mockResolvedValueOnce(null) // empresas (not found due to estado filter)
          .mockResolvedValueOnce(null), // clientes
      };

      (mongoose.connection.db!.collection as jest.Mock).mockReturnValue(
        mockCollection
      );

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        numeroCliente: "500001-5",
        estado: "activo",
      });
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Credenciales inválidas",
      });
    });

    it("should successfully login cliente user with activo true", async () => {
      // Arrange
      mockRequest.body = {
        email: "629903-3",
        password: "testpassword",
      };

      const mockCollection = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // superusuarios
          .mockResolvedValueOnce(null) // empresas
          .mockResolvedValueOnce(mockClienteUser), // clientes
      };

      (mongoose.connection.db!.collection as jest.Mock).mockReturnValue(
        mockCollection
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("mock-jwt-token");

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        numeroCliente: "629903-3",
        activo: true,
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          token: "mock-jwt-token",
          user: {
            id: mockClienteUser._id,
            name: mockClienteUser.nombre,
            email: mockClienteUser.correo,
            numeroCliente: mockClienteUser.numeroCliente,
            type: "cliente",
            role: "cliente",
            tipoUsuario: "cliente",
          },
        },
        message: "Login exitoso",
      });
    });

    it("should successfully login superusuario with activo true", async () => {
      // Arrange
      mockRequest.body = {
        email: "900000-4",
        password: "adminpassword",
      };

      const mockCollection = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(mockSuperusuarioUser) // superusuarios
          .mockResolvedValueOnce(null) // empresas (not reached)
          .mockResolvedValueOnce(null), // clientes (not reached)
      };

      (mongoose.connection.db!.collection as jest.Mock).mockReturnValue(
        mockCollection
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("mock-jwt-token");

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        numeroCliente: "900000-4",
        activo: true,
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          token: "mock-jwt-token",
          user: {
            id: mockSuperusuarioUser._id,
            name: mockSuperusuarioUser.nombre,
            email: mockSuperusuarioUser.correo,
            numeroCliente: mockSuperusuarioUser.numeroCliente,
            type: "superadmin",
            role: "superadmin",
            tipoUsuario: "superadmin",
          },
        },
        message: "Login exitoso",
      });
    });

    it("should fail login with incorrect password", async () => {
      // Arrange
      mockRequest.body = {
        email: "500001-5",
        password: "wrongpassword",
      };

      const mockCollection = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // superusuarios
          .mockResolvedValueOnce(mockEmpresaUser) // empresas
          .mockResolvedValueOnce(null), // clientes (not reached)
      };

      (mongoose.connection.db!.collection as jest.Mock).mockReturnValue(
        mockCollection
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongpassword",
        mockEmpresaUser.password
      );
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Credenciales inválidas",
      });
    });

    it("should fail login when user not found in any collection", async () => {
      // Arrange
      mockRequest.body = {
        email: "nonexistent-user",
        password: "password",
      };

      const mockCollection = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // superusuarios
          .mockResolvedValueOnce(null) // empresas
          .mockResolvedValueOnce(null), // clientes
      };

      (mongoose.connection.db!.collection as jest.Mock).mockReturnValue(
        mockCollection
      );

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Credenciales inválidas",
      });
    });

    it("should return 400 when email or password is missing", async () => {
      // Arrange
      mockRequest.body = {
        email: "500001-5",
        // password missing
      };

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Número de cliente y contraseña son requeridos",
      });
    });
  });
});
