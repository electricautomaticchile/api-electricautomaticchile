import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import Cliente from "../models/Cliente";

const router = Router();

// Obtener dispositivo asignado al cliente autenticado
router.get("/mi-dispositivo", authMiddleware, async (req, res) => {
  try {
    const clienteId = req.user?.userId;

    if (!clienteId) {
      return res.status(401).json({
        success: false,
        message: "No autenticado",
      });
    }

    const cliente = await Cliente.findById(clienteId).select(
      "dispositivoAsignado nombre"
    );

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      });
    }

    return res.json({
      success: true,
      data: {
        dispositivoId: cliente.dispositivoAsignado || "arduino_uno",
        clienteNombre: cliente.nombre,
      },
    });
  } catch (error) {
    console.error("Error obteniendo dispositivo del cliente:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener dispositivo",
    });
  }
});

// Asignar dispositivo a un cliente (solo admin)
router.put("/:clienteId/dispositivo", authMiddleware, async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { dispositivoId } = req.body;

    // Verificar que el usuario sea admin
    if (req.user?.role !== "admin" && req.user?.role !== "superusuario") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para asignar dispositivos",
      });
    }

    if (!dispositivoId) {
      return res.status(400).json({
        success: false,
        message: "El ID del dispositivo es requerido",
      });
    }

    const cliente = await Cliente.findByIdAndUpdate(
      clienteId,
      { dispositivoAsignado: dispositivoId },
      { new: true }
    ).select("nombre dispositivoAsignado");

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      });
    }

    return res.json({
      success: true,
      message: "Dispositivo asignado correctamente",
      data: {
        clienteId: cliente._id,
        clienteNombre: cliente.nombre,
        dispositivoId: cliente.dispositivoAsignado,
      },
    });
  } catch (error) {
    console.error("Error asignando dispositivo:", error);
    return res.status(500).json({
      success: false,
      message: "Error al asignar dispositivo",
    });
  }
});

export default router;
