import { Request, Response, NextFunction } from "express";
import { z, ZodError, ZodSchema } from "zod";

// Esquemas de validación centralizados
export const validationSchemas = {
  // Usuario
  crearUsuario: z.object({
    body: z.object({
      nombre: z
        .string()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(100, "El nombre no puede exceder 100 caracteres"),
      email: z.string().email("Email inválido").toLowerCase(),
      password: z
        .string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .regex(/[A-Z]/, "La contraseña debe tener al menos una letra mayúscula")
        .regex(/[a-z]/, "La contraseña debe tener al menos una letra minúscula")
        .regex(/[0-9]/, "La contraseña debe tener al menos un número")
        .regex(
          /[^A-Za-z0-9]/,
          "La contraseña debe tener al menos un carácter especial"
        ),
      telefono: z
        .string()
        .regex(/^\+?[\d\s\-\(\)]+$/, "Formato de teléfono inválido")
        .optional(),
      rol: z.enum(["admin", "vendedor", "cliente"]).default("cliente"),
      tipoUsuario: z.enum(["superadmin", "empresa", "cliente"]),
      empresaId: z.string().optional(),
    }),
  }),

  actualizarUsuario: z.object({
    body: z.object({
      nombre: z.string().min(2).max(100).optional(),
      email: z.string().email().toLowerCase().optional(),
      telefono: z
        .string()
        .regex(/^\+?[\d\s\-\(\)]+$/)
        .optional(),
      rol: z.enum(["admin", "vendedor", "cliente"]).optional(),
      tipoUsuario: z.enum(["superadmin", "empresa", "cliente"]).optional(),
      activo: z.boolean().optional(),
    }),
    params: z.object({
      id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de usuario inválido"),
    }),
  }),

  // Autenticación
  login: z.object({
    body: z.object({
      email: z.string().email("Email inválido").toLowerCase(),
      password: z.string().min(1, "La contraseña es requerida"),
    }),
  }),

  // Cotizaciones
  crearCotizacion: z.object({
    body: z.object({
      nombre: z
        .string()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(100),
      email: z.string().email("Email inválido").toLowerCase(),
      empresa: z.string().max(100).optional(),
      telefono: z
        .string()
        .regex(/^\+?[\d\s\-\(\)]+$/, "Formato de teléfono inválido")
        .optional(),
      servicio: z.enum([
        "cotizacion_reposicion",
        "cotizacion_monitoreo",
        "cotizacion_mantenimiento",
        "cotizacion_completa",
      ]),
      plazo: z
        .enum(["urgente", "pronto", "normal", "planificacion"])
        .optional(),
      mensaje: z
        .string()
        .min(10, "El mensaje debe tener al menos 10 caracteres")
        .max(1000),
      archivoUrl: z.string().url().optional(),
    }),
  }),

  actualizarEstadoCotizacion: z.object({
    body: z.object({
      estado: z.enum([
        "pendiente",
        "en_revision",
        "cotizando",
        "cotizada",
        "aprobada",
        "rechazada",
        "convertida_cliente",
      ]),
      notas: z.string().max(500).optional(),
    }),
    params: z.object({
      id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de cotización inválido"),
    }),
  }),

  // Dispositivos IoT
  crearDispositivo: z.object({
    body: z.object({
      idDispositivo: z
        .string()
        .min(3, "El ID del dispositivo debe tener al menos 3 caracteres"),
      modelo: z.string().min(2, "El modelo es requerido"),
      fabricante: z.string().min(2, "El fabricante es requerido"),
      tipoDispositivo: z.enum([
        "medidorInteligente",
        "reguladorVoltaje",
        "monitorizador",
        "otro",
      ]),
      numeroSerie: z
        .string()
        .min(3, "El número de serie debe tener al menos 3 caracteres"),
      version: z.object({
        hardware: z.string().min(1, "La versión de hardware es requerida"),
        firmware: z.string().min(1, "La versión de firmware es requerida"),
      }),
      clienteId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "ID de cliente inválido"),
      ubicacion: z
        .object({
          direccion: z.string().optional(),
          coordenadas: z
            .object({
              latitud: z.number().min(-90).max(90),
              longitud: z.number().min(-180).max(180),
            })
            .optional(),
          descripcion: z.string().optional(),
        })
        .optional(),
      fechaInstalacion: z.string().datetime("Fecha de instalación inválida"),
    }),
  }),

  // Mediciones IoT
  nuevaMedicion: z.object({
    body: z.object({
      dispositivo: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "ID de dispositivo inválido"),
      lecturas: z
        .array(
          z.object({
            valor: z.number(),
            unidad: z.string().min(1, "La unidad es requerida"),
            esVoltaje: z.boolean().optional(),
            esAmperaje: z.boolean().optional(),
            esPotencia: z.boolean().optional(),
            esConsumo: z.boolean().optional(),
          })
        )
        .min(1, "Debe incluir al menos una lectura"),
    }),
  }),

  // Parámetros de consulta comunes
  paginacion: z.object({
    query: z.object({
      page: z.string().regex(/^\d+$/).transform(Number).default("1"),
      limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
      sort: z.string().optional(),
      order: z.enum(["asc", "desc"]).default("desc"),
    }),
  }),

  // Lead magnet
  leadMagnet: z.object({
    body: z.object({
      email: z.string().email("Email inválido").toLowerCase(),
      nombre: z
        .string()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .optional(),
      empresa: z.string().max(100).optional(),
    }),
  }),
};

// Middleware de validación
export const validate = (
  schema: ZodSchema
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json({
          success: false,
          message: "Error de validación",
          errors,
        });
        return;
      }
      next(error);
    }
  };
};

// Validador específico para ObjectId de MongoDB
export const validateObjectId = (
  paramName: string = "id"
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;

    if (!objectIdRegex.test(id)) {
      res.status(400).json({
        success: false,
        message: `ID inválido para el parámetro '${paramName}'`,
        error: "El ID debe ser un ObjectId válido de MongoDB",
      });
      return;
    }

    next();
  };
};

// Validador de archivos
export const validateFile = (options: {
  required?: boolean;
  maxSize?: number; // en bytes
  allowedTypes?: string[];
}): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const file = req.file;

    if (options.required && !file) {
      res.status(400).json({
        success: false,
        message: "Archivo requerido",
      });
      return;
    }

    if (file) {
      // Validar tamaño
      if (options.maxSize && file.size > options.maxSize) {
        res.status(400).json({
          success: false,
          message: `El archivo es demasiado grande. Máximo permitido: ${
            options.maxSize / (1024 * 1024)
          }MB`,
        });
        return;
      }

      // Validar tipo
      if (
        options.allowedTypes &&
        !options.allowedTypes.includes(file.mimetype)
      ) {
        res.status(400).json({
          success: false,
          message: `Tipo de archivo no permitido. Tipos permitidos: ${options.allowedTypes.join(
            ", "
          )}`,
        });
        return;
      }
    }

    next();
  };
};
