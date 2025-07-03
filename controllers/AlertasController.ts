import { Request, Response } from "express";
import {
  IAlerta,
  ICrearAlerta,
  IResumenAlertas,
  IFiltrosAlertas,
} from "../models/Alerta";

// Simulamos una base de datos en memoria para desarrollo
let alertas: IAlerta[] = [
  {
    _id: "1",
    tipo: "error",
    titulo: "Dispositivo desconectado",
    mensaje: "El dispositivo DEV001 no responde desde hace 15 minutos",
    dispositivo: "DEV001",
    empresaId: "1",
    ubicacion: "Edificio Central - Piso 1",
    importante: true,
    leida: false,
    resuelta: false,
    fechaCreacion: new Date(Date.now() - 15 * 60 * 1000),
    metadatos: {
      ultimaConexion: new Date(Date.now() - 15 * 60 * 1000),
      bateria: 45,
    },
  },
  {
    _id: "2",
    tipo: "advertencia",
    titulo: "Batería baja",
    mensaje: "El dispositivo DEV003 tiene batería al 18%",
    dispositivo: "DEV003",
    empresaId: "1",
    ubicacion: "Edificio Norte - Piso 1",
    importante: true,
    leida: false,
    resuelta: false,
    fechaCreacion: new Date(Date.now() - 2 * 60 * 60 * 1000),
    metadatos: {
      bateria: 18,
      temperatura: 32,
    },
  },
  {
    _id: "3",
    tipo: "informacion",
    titulo: "Actualización completada",
    mensaje: "Firmware actualizado correctamente en DEV002",
    dispositivo: "DEV002",
    empresaId: "1",
    ubicacion: "Edificio Central - Piso 2",
    importante: false,
    leida: true,
    resuelta: true,
    fechaCreacion: new Date(Date.now() - 4 * 60 * 60 * 1000),
    fechaResolucion: new Date(Date.now() - 3 * 60 * 60 * 1000),
    accionesTomadas: "Actualización automática completada exitosamente",
  },
];

let nextId = 4;

export class AlertasController {
  // GET /api/alertas
  static obtenerAlertas = (req: Request, res: Response): void => {
    try {
      const {
        page = 1,
        limit = 10,
        tipo,
        estado,
        importante,
        empresaId,
        dispositivo,
        search,
      } = req.query;

      let alertasFiltradas = [...alertas];

      // Aplicar filtros
      if (empresaId) {
        alertasFiltradas = alertasFiltradas.filter(
          (a) => a.empresaId === empresaId
        );
      }
      if (tipo) {
        alertasFiltradas = alertasFiltradas.filter((a) => a.tipo === tipo);
      }
      if (importante !== undefined) {
        alertasFiltradas = alertasFiltradas.filter(
          (a) => a.importante === (importante === "true")
        );
      }
      if (dispositivo) {
        alertasFiltradas = alertasFiltradas.filter(
          (a) => a.dispositivo === dispositivo
        );
      }
      if (search) {
        const searchTerm = search.toString().toLowerCase();
        alertasFiltradas = alertasFiltradas.filter(
          (a) =>
            a.titulo.toLowerCase().includes(searchTerm) ||
            a.mensaje.toLowerCase().includes(searchTerm) ||
            a.ubicacion?.toLowerCase().includes(searchTerm)
        );
      }

      // Filtrar por estado
      if (estado) {
        switch (estado) {
          case "no_leidas":
            alertasFiltradas = alertasFiltradas.filter((a) => !a.leida);
            break;
          case "leidas":
            alertasFiltradas = alertasFiltradas.filter((a) => a.leida);
            break;
          case "resueltas":
            alertasFiltradas = alertasFiltradas.filter((a) => a.resuelta);
            break;
          case "activas":
            alertasFiltradas = alertasFiltradas.filter((a) => !a.resuelta);
            break;
        }
      }

      // Ordenar por fecha más reciente y prioridad
      alertasFiltradas.sort((a, b) => {
        if (a.importante && !b.importante) return -1;
        if (!a.importante && b.importante) return 1;
        return b.fechaCreacion.getTime() - a.fechaCreacion.getTime();
      });

      // Paginación
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;
      const alertasPaginadas = alertasFiltradas.slice(
        offset,
        offset + limitNum
      );

      res.status(200).json({
        success: true,
        data: alertasPaginadas,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(alertasFiltradas.length / limitNum),
          totalItems: alertasFiltradas.length,
          itemsPerPage: limitNum,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener alertas",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // GET /api/alertas/activas
  static obtenerAlertasActivas = (req: Request, res: Response): void => {
    try {
      const alertasActivas = alertas.filter((a) => !a.resuelta);

      res.status(200).json({
        success: true,
        data: alertasActivas,
        total: alertasActivas.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener alertas activas",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // GET /api/alertas/empresa/:empresaId
  static obtenerAlertasPorEmpresa = (req: Request, res: Response): void => {
    try {
      const { empresaId } = req.params;
      const { incluirResueltas = "false" } = req.query;

      let alertasEmpresa = alertas.filter((a) => a.empresaId === empresaId);

      if (incluirResueltas === "false") {
        alertasEmpresa = alertasEmpresa.filter((a) => !a.resuelta);
      }

      res.status(200).json({
        success: true,
        data: alertasEmpresa,
        total: alertasEmpresa.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener alertas de la empresa",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // GET /api/alertas/resumen/:empresaId
  static obtenerResumenAlertas = (req: Request, res: Response): void => {
    try {
      const { empresaId } = req.params;

      const alertasEmpresa = alertas.filter((a) => a.empresaId === empresaId);

      const resumen: IResumenAlertas = {
        total: alertasEmpresa.length,
        errorCritico: alertasEmpresa.filter((a) => a.tipo === "error").length,
        advertencia: alertasEmpresa.filter((a) => a.tipo === "advertencia")
          .length,
        informacion: alertasEmpresa.filter((a) => a.tipo === "informacion")
          .length,
        exito: alertasEmpresa.filter((a) => a.tipo === "exito").length,
        noLeidas: alertasEmpresa.filter((a) => !a.leida).length,
        importantes: alertasEmpresa.filter((a) => a.importante).length,
        resueltas: alertasEmpresa.filter((a) => a.resuelta).length,
      };

      res.status(200).json({
        success: true,
        data: resumen,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener resumen de alertas",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // GET /api/alertas/:id
  static obtenerAlerta = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const alerta = alertas.find((a) => a._id === id);

      if (!alerta) {
        res.status(404).json({
          success: false,
          message: "Alerta no encontrada",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: alerta,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener alerta",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // POST /api/alertas
  static crearAlerta = (req: Request, res: Response): void => {
    try {
      const datosAlerta: ICrearAlerta = req.body;

      const nuevaAlerta: IAlerta = {
        _id: nextId.toString(),
        tipo: datosAlerta.tipo,
        titulo: datosAlerta.titulo,
        mensaje: datosAlerta.mensaje,
        dispositivo: datosAlerta.dispositivo,
        empresaId: datosAlerta.empresaId,
        ubicacion: datosAlerta.ubicacion,
        importante: datosAlerta.importante || datosAlerta.tipo === "error",
        leida: false,
        resuelta: false,
        fechaCreacion: new Date(),
        metadatos: datosAlerta.metadatos,
      };

      alertas.unshift(nuevaAlerta);
      nextId++;

      res.status(201).json({
        success: true,
        message: "Alerta creada exitosamente",
        data: nuevaAlerta,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al crear alerta",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // PUT /api/alertas/:id/resolver
  static resolverAlerta = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { accionesTomadas } = req.body;

      const alertaIndex = alertas.findIndex((a) => a._id === id);

      if (alertaIndex === -1) {
        res.status(404).json({
          success: false,
          message: "Alerta no encontrada",
        });
        return;
      }

      alertas[alertaIndex].resuelta = true;
      alertas[alertaIndex].leida = true;
      alertas[alertaIndex].fechaResolucion = new Date();
      if (accionesTomadas) {
        alertas[alertaIndex].accionesTomadas = accionesTomadas;
      }

      res.status(200).json({
        success: true,
        message: "Alerta resuelta exitosamente",
        data: alertas[alertaIndex],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al resolver alerta",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // PUT /api/alertas/:id/asignar
  static asignarAlerta = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { asignadoA } = req.body;

      const alertaIndex = alertas.findIndex((a) => a._id === id);

      if (alertaIndex === -1) {
        res.status(404).json({
          success: false,
          message: "Alerta no encontrada",
        });
        return;
      }

      alertas[alertaIndex].asignadoA = asignadoA;

      res.status(200).json({
        success: true,
        message: "Alerta asignada exitosamente",
        data: alertas[alertaIndex],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al asignar alerta",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // DELETE /api/alertas/:id
  static eliminarAlerta = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;

      const alertaIndex = alertas.findIndex((a) => a._id === id);

      if (alertaIndex === -1) {
        res.status(404).json({
          success: false,
          message: "Alerta no encontrada",
        });
        return;
      }

      alertas.splice(alertaIndex, 1);

      res.status(200).json({
        success: true,
        message: "Alerta eliminada exitosamente",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al eliminar alerta",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // POST /api/alertas/simular
  static simularAlerta = (req: Request, res: Response): void => {
    try {
      const tipos = ["error", "advertencia", "informacion", "exito"] as const;
      const mensajes = [
        "Dispositivo desconectado inesperadamente",
        "Nivel de batería crítico detectado",
        "Actualización de firmware completada",
        "Sistema de respaldo activado",
        "Consumo anómalo en sector norte",
        "Conexión restablecida correctamente",
      ];
      const ubicaciones = [
        "Edificio Central - Piso 1",
        "Edificio Norte - Piso 2",
        "Edificio Este - Planta Baja",
        "Edificio Oeste - Piso 3",
      ];

      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      const mensaje = mensajes[Math.floor(Math.random() * mensajes.length)];
      const ubicacion =
        ubicaciones[Math.floor(Math.random() * ubicaciones.length)];

      const nuevaAlerta: IAlerta = {
        _id: nextId.toString(),
        tipo,
        titulo: `Alerta ${tipo} simulada`,
        mensaje,
        dispositivo: `DEV${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`,
        empresaId: "1",
        ubicacion,
        importante: tipo === "error" || tipo === "advertencia",
        leida: false,
        resuelta: false,
        fechaCreacion: new Date(),
        metadatos: {
          simulada: true,
          bateria: Math.floor(Math.random() * 100),
          temperatura: Math.floor(Math.random() * 20) + 20,
        },
      };

      alertas.unshift(nuevaAlerta);
      nextId++;

      res.status(201).json({
        success: true,
        message: "Alerta simulada creada exitosamente",
        data: nuevaAlerta,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al simular alerta",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  // POST /api/alertas/simular-batch
  static simularAlertasBatch = (req: Request, res: Response): void => {
    try {
      const { cantidad = 5 } = req.body;
      const alertasCreadas: IAlerta[] = [];

      for (let i = 0; i < Math.min(cantidad, 10); i++) {
        // Simular creación de alertas con datos aleatorios
        const tipos = ["error", "advertencia", "informacion", "exito"] as const;
        const tipo = tipos[Math.floor(Math.random() * tipos.length)];

        const nuevaAlerta: IAlerta = {
          _id: nextId.toString(),
          tipo,
          titulo: `Alerta batch ${tipo} #${i + 1}`,
          mensaje: `Mensaje simulado para alerta batch ${i + 1}`,
          dispositivo: `DEV${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`,
          empresaId: "1",
          ubicacion: `Ubicación simulada ${i + 1}`,
          importante: Math.random() > 0.5,
          leida: false,
          resuelta: false,
          fechaCreacion: new Date(
            Date.now() - Math.random() * 24 * 60 * 60 * 1000
          ),
          metadatos: {
            simulada: true,
            batch: true,
          },
        };

        alertas.unshift(nuevaAlerta);
        alertasCreadas.push(nuevaAlerta);
        nextId++;
      }

      res.status(201).json({
        success: true,
        message: `${alertasCreadas.length} alertas simuladas creadas exitosamente`,
        data: alertasCreadas,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al simular alertas batch",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };
}
