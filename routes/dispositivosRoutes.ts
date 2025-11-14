import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import Dispositivo from "../models/Dispositivo";
import Cliente from "../models/Cliente";

const router = Router();

// Obtener dispositivo por número
router.get("/numero/:numeroDispositivo", async (req, res) => {
  try {
    const { numeroDispositivo } = req.params;

    const dispositivo = await Dispositivo.findOne({ numeroDispositivo })
      .populate("clienteAsignado", "nombre correo numeroCliente")
      .populate("empresaAsignada", "nombre correo");

    if (!dispositivo) {
      return res.status(404).json({
        success: false,
        message: "Dispositivo no encontrado",
      });
    }

    return res.json({
      success: true,
      data: dispositivo,
    });
  } catch (error) {
    console.error("Error obteniendo dispositivo:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener dispositivo",
    });
  }
});

// Crear dispositivo (sin auth para permitir registro automático desde WebSocket-api)
router.post("/", async (req, res) => {
  try {
    const dispositivo = await Dispositivo.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Dispositivo creado exitosamente",
      data: dispositivo,
    });
  } catch (error) {
    console.error("Error creando dispositivo:", error);
    return res.status(500).json({
      success: false,
      message: "Error al crear dispositivo",
    });
  }
});

// Actualizar última lectura del dispositivo
router.put("/numero/:numeroDispositivo/ultima-lectura", async (req, res) => {
  try {
    const { numeroDispositivo } = req.params;
    const { voltaje, corriente, potencia, energia, timestamp } = req.body;

    const dispositivo = await Dispositivo.findOneAndUpdate(
      { numeroDispositivo },
      {
        ultimaLectura: {
          voltaje,
          corriente,
          potencia,
          energia,
          timestamp: timestamp || new Date(),
        },
        ultimaConexion: new Date(),
      },
      { new: true }
    );

    if (!dispositivo) {
      return res.status(404).json({
        success: false,
        message: "Dispositivo no encontrado",
      });
    }

    return res.json({
      success: true,
      data: dispositivo,
    });
  } catch (error) {
    console.error("Error actualizando lectura:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar lectura",
    });
  }
});

// Listar todos los dispositivos
router.get("/", authMiddleware, async (req, res) => {
  try {
    const dispositivos = await Dispositivo.find({})
      .populate("clienteAsignado", "nombre correo numeroCliente")
      .populate("empresaAsignada", "nombre correo")
      .sort({ fechaCreacion: -1 });

    return res.json({
      success: true,
      data: dispositivos,
    });
  } catch (error) {
    console.error("Error listando dispositivos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al listar dispositivos",
    });
  }
});

// Obtener dispositivo por ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const dispositivo = await Dispositivo.findById(req.params.id)
      .populate("clienteAsignado", "nombre correo numeroCliente")
      .populate("empresaAsignada", "nombre correo");

    if (!dispositivo) {
      return res.status(404).json({
        success: false,
        message: "Dispositivo no encontrado",
      });
    }

    return res.json({
      success: true,
      data: dispositivo,
    });
  } catch (error) {
    console.error("Error obteniendo dispositivo:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener dispositivo",
    });
  }
});

// Actualizar dispositivo
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const dispositivo = await Dispositivo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!dispositivo) {
      return res.status(404).json({
        success: false,
        message: "Dispositivo no encontrado",
      });
    }

    return res.json({
      success: true,
      message: "Dispositivo actualizado exitosamente",
      data: dispositivo,
    });
  } catch (error) {
    console.error("Error actualizando dispositivo:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar dispositivo",
    });
  }
});

// Eliminar dispositivo
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const dispositivo = await Dispositivo.findByIdAndDelete(req.params.id);

    if (!dispositivo) {
      return res.status(404).json({
        success: false,
        message: "Dispositivo no encontrado",
      });
    }

    return res.json({
      success: true,
      message: "Dispositivo eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error eliminando dispositivo:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar dispositivo",
    });
  }
});

export default router;
