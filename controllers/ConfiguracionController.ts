import { Request, Response } from "express";
import Configuracion, { IConfiguracionModel } from "../models/Configuracion";

// Declaración de tipo explícita para evitar problemas de TypeScript
const ConfiguracionModel = Configuracion as IConfiguracionModel;

export class ConfiguracionController {
  // Obtener configuraciones por categoría
  static async obtenerConfiguraciones(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { categoria, empresaId } = req.query;

      console.log("📋 Obteniendo configuraciones:", { categoria, empresaId });

      if (!categoria) {
        res.status(400).json({
          success: false,
          message: "La categoría es requerida",
        });
        return;
      }

      const configuraciones =
        await ConfiguracionModel.obtenerConfiguracionesPorCategoria(
          categoria as string,
          empresaId as string
        );

      res.status(200).json({
        success: true,
        data: configuraciones,
        total: configuraciones.length,
      });
    } catch (error) {
      console.error("❌ Error obteniendo configuraciones:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener configuraciones",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Obtener una configuración específica
  static async obtenerConfiguracion(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { clave } = req.params;
      const { empresaId, valorPorDefecto } = req.query;

      console.log("🔍 Obteniendo configuración:", { clave, empresaId });

      const valor = await ConfiguracionModel.obtenerConfiguracion(
        clave,
        empresaId as string,
        valorPorDefecto
      );

      res.status(200).json({
        success: true,
        data: {
          clave,
          valor,
        },
      });
    } catch (error) {
      console.error("❌ Error obteniendo configuración:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener configuración",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Establecer configuración
  static async establecerConfiguracion(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const {
        clave,
        valor,
        categoria,
        descripcion,
        esPublica,
        editablePorEmpresa,
        empresaId,
        tipo,
      } = req.body;
      const usuarioId = (req as any).usuario?.id;

      console.log("💾 Estableciendo configuración:", {
        clave,
        categoria,
        empresaId,
      });

      if (!clave || valor === undefined || !categoria) {
        res.status(400).json({
          success: false,
          message: "Clave, valor y categoría son requeridos",
        });
        return;
      }

      const configuracion = await ConfiguracionModel.establecerConfiguracion(
        clave,
        valor,
        categoria,
        {
          empresaId,
          tipo,
          descripcion,
          esPublica,
          editablePorEmpresa,
          usuarioId,
        }
      );

      res.status(200).json({
        success: true,
        message: "Configuración establecida exitosamente",
        data: configuracion,
      });
    } catch (error) {
      console.error("❌ Error estableciendo configuración:", error);
      res.status(500).json({
        success: false,
        message: "Error al establecer configuración",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Actualizar múltiples configuraciones
  static async actualizarConfiguraciones(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { configuraciones, empresaId } = req.body;
      const usuarioId = (req as any).usuario?.id;

      console.log("🔄 Actualizando múltiples configuraciones:", {
        total: configuraciones?.length,
        empresaId,
      });

      if (!Array.isArray(configuraciones) || configuraciones.length === 0) {
        res.status(400).json({
          success: false,
          message: "Se requiere un array de configuraciones válido",
        });
        return;
      }

      const resultados = [];
      const errores = [];

      for (const config of configuraciones) {
        try {
          const {
            clave,
            valor,
            categoria,
            descripcion,
            esPublica,
            editablePorEmpresa,
            tipo,
          } = config;

          if (!clave || valor === undefined || !categoria) {
            errores.push({
              clave: clave || "sin_clave",
              error: "Clave, valor y categoría son requeridos",
            });
            continue;
          }

          const configuracion =
            await ConfiguracionModel.establecerConfiguracion(
              clave,
              valor,
              categoria,
              {
                empresaId,
                tipo,
                descripcion,
                esPublica,
                editablePorEmpresa,
                usuarioId,
              }
            );

          resultados.push({
            clave,
            success: true,
            data: configuracion,
          });
        } catch (error) {
          errores.push({
            clave: config.clave || "desconocida",
            error: error instanceof Error ? error.message : "Error desconocido",
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `${resultados.length} configuraciones actualizadas exitosamente`,
        data: {
          exitosas: resultados,
          errores,
          total: configuraciones.length,
          exitosasCount: resultados.length,
          erroresCount: errores.length,
        },
      });
    } catch (error) {
      console.error("❌ Error actualizando configuraciones:", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar configuraciones",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Eliminar configuración
  static async eliminarConfiguracion(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { clave } = req.params;
      const { empresaId } = req.query;

      console.log("🗑️ Eliminando configuración:", { clave, empresaId });

      const filtro: any = { clave };

      if (empresaId) {
        filtro.empresaId = empresaId;
        filtro.tipo = "empresa";
      } else {
        filtro.tipo = { $in: ["general", "sistema"] };
        filtro.empresaId = { $exists: false };
      }

      const configuracion = await Configuracion.findOneAndDelete(filtro);

      if (!configuracion) {
        res.status(404).json({
          success: false,
          message: "Configuración no encontrada",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Configuración eliminada exitosamente",
        data: configuracion,
      });
    } catch (error) {
      console.error("❌ Error eliminando configuración:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar configuración",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Obtener todas las categorías disponibles
  static async obtenerCategorias(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.query;

      console.log("📂 Obteniendo categorías:", { empresaId });

      const filtro: any = {};

      if (empresaId) {
        // Obtener categorías tanto de empresa como generales
        const categorias = await Configuracion.aggregate([
          {
            $match: {
              $or: [
                { empresaId: empresaId, tipo: "empresa" },
                {
                  tipo: { $in: ["general", "sistema"] },
                  empresaId: { $exists: false },
                },
              ],
            },
          },
          {
            $group: {
              _id: "$categoria",
              count: { $sum: 1 },
              tipos: { $addToSet: "$tipo" },
            },
          },
          {
            $sort: { _id: 1 },
          },
        ]);

        res.status(200).json({
          success: true,
          data: categorias.map((cat) => ({
            categoria: cat._id,
            configuraciones: cat.count,
            tipos: cat.tipos,
          })),
        });
      } else {
        // Solo categorías generales y del sistema
        const categorias = await Configuracion.aggregate([
          {
            $match: {
              tipo: { $in: ["general", "sistema"] },
              empresaId: { $exists: false },
            },
          },
          {
            $group: {
              _id: "$categoria",
              count: { $sum: 1 },
              tipos: { $addToSet: "$tipo" },
            },
          },
          {
            $sort: { _id: 1 },
          },
        ]);

        res.status(200).json({
          success: true,
          data: categorias.map((cat) => ({
            categoria: cat._id,
            configuraciones: cat.count,
            tipos: cat.tipos,
          })),
        });
      }
    } catch (error) {
      console.error("❌ Error obteniendo categorías:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener categorías",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Inicializar configuraciones por defecto
  static async inicializarConfiguracionesPorDefecto(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { empresaId } = req.body;
      const usuarioId = (req as any).usuario?.id;

      console.log("🔧 Inicializando configuraciones por defecto:", {
        empresaId,
      });

      // Configuraciones por defecto del sistema
      const configuracionesDefecto = [
        // Configuraciones generales
        {
          clave: "empresa_nombre",
          valor: "Electric Automatic Chile",
          categoria: "general",
          descripcion: "Nombre de la empresa",
          esPublica: true,
          editablePorEmpresa: true,
        },
        {
          clave: "empresa_email",
          valor: "contacto@electricautomaticchile.com",
          categoria: "general",
          descripcion: "Email de contacto principal",
          esPublica: true,
          editablePorEmpresa: true,
        },
        {
          clave: "empresa_telefono",
          valor: "+56 9 1234 5678",
          categoria: "general",
          descripcion: "Teléfono de contacto",
          esPublica: true,
          editablePorEmpresa: true,
        },

        // Configuraciones de notificaciones
        {
          clave: "notificaciones_email_habilitadas",
          valor: true,
          categoria: "notificaciones",
          descripcion: "Habilitar notificaciones por email",
          esPublica: false,
          editablePorEmpresa: true,
        },
        {
          clave: "notificaciones_push_habilitadas",
          valor: true,
          categoria: "notificaciones",
          descripcion: "Habilitar notificaciones push",
          esPublica: false,
          editablePorEmpresa: true,
        },

        // Configuraciones del sistema
        {
          clave: "sistema_tiempo_sesion",
          valor: 8,
          categoria: "sistema",
          descripcion: "Tiempo de sesión en horas",
          esPublica: false,
          editablePorEmpresa: false,
          tipo: "sistema",
        },
        {
          clave: "sistema_max_intentos_login",
          valor: 5,
          categoria: "sistema",
          descripcion: "Máximo número de intentos de login",
          esPublica: false,
          editablePorEmpresa: false,
          tipo: "sistema",
        },

        // Configuraciones de facturación
        {
          clave: "facturacion_moneda",
          valor: "CLP",
          categoria: "facturacion",
          descripcion: "Moneda para facturación",
          esPublica: true,
          editablePorEmpresa: true,
        },
        {
          clave: "facturacion_iva",
          valor: 19,
          categoria: "facturacion",
          descripcion: "Porcentaje de IVA",
          esPublica: true,
          editablePorEmpresa: false,
          tipo: "sistema",
        },
      ];

      const resultados = [];

      for (const config of configuracionesDefecto) {
        try {
          const configuracion =
            await ConfiguracionModel.establecerConfiguracion(
              config.clave,
              config.valor,
              config.categoria,
              {
                empresaId,
                tipo:
                  (config.tipo as "general" | "empresa" | "sistema") ||
                  (empresaId ? "empresa" : "general"),
                descripcion: config.descripcion,
                esPublica: config.esPublica,
                editablePorEmpresa: config.editablePorEmpresa,
                usuarioId,
              }
            );

          resultados.push(configuracion);
        } catch (error) {
          console.error(
            `Error inicializando configuración ${config.clave}:`,
            error
          );
        }
      }

      res.status(200).json({
        success: true,
        message: `${resultados.length} configuraciones inicializadas exitosamente`,
        data: resultados,
      });
    } catch (error) {
      console.error("❌ Error inicializando configuraciones:", error);
      res.status(500).json({
        success: false,
        message: "Error al inicializar configuraciones",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
