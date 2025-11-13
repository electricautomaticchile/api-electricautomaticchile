import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Endpoint para obtener datos de medidores (JSON)
router.get("/medidores", authMiddleware, (req, res) => {
  const { filtro } = req.query;

  // Datos de medidores en Barnechea
  const medidores = [
    {
      id: "meter_001",
      nombre: "Residencial Los Trapenses",
      lat: -33.3589,
      lng: -70.5089,
      direccion: "Av. Los Trapenses 4567, Barnechea",
      estado: "active",
      consumo: 245.8,
      anomalias: 0,
      serial: "EAC-BRN-001",
    },
    {
      id: "meter_002",
      nombre: "Condominio La Dehesa",
      lat: -33.3645,
      lng: -70.5234,
      direccion: "Camino La Dehesa 1234, Barnechea",
      estado: "active",
      consumo: 312.5,
      anomalias: 0,
      serial: "EAC-BRN-002",
    },
    {
      id: "meter_003",
      nombre: "Casa Particular - Sr. Silva",
      lat: -33.3512,
      lng: -70.5156,
      direccion: "Av. El Rodeo 890, Barnechea",
      estado: "suspicious",
      consumo: 89.2,
      anomalias: 2,
      serial: "EAC-BRN-003",
    },
    {
      id: "meter_004",
      nombre: "Edificio Comercial Plaza Norte",
      lat: -33.3701,
      lng: -70.5312,
      direccion: "Av. Padre Hurtado 5678, Barnechea",
      estado: "fraud_detected",
      consumo: 0,
      anomalias: 5,
      serial: "EAC-BRN-004",
    },
    {
      id: "meter_005",
      nombre: "Casa en Construcción Lote 45",
      lat: -33.3667,
      lng: -70.5145,
      direccion: "Parcela 45, Sector Los Dominicos, Barnechea",
      estado: "inactive",
      consumo: 0,
      anomalias: 0,
      serial: "EAC-BRN-005",
    },
    {
      id: "meter_006",
      nombre: "Restaurant El Arrayán",
      lat: -33.3623,
      lng: -70.5178,
      direccion: "Av. Manquehue Norte 2345, Barnechea",
      estado: "suspicious",
      consumo: 156.3,
      anomalias: 1,
      serial: "EAC-BRN-006",
    },
    {
      id: "meter_007",
      nombre: "Oficina Desocupada - Torre B",
      lat: -33.3734,
      lng: -70.5289,
      direccion: "Av. Apoquindo 8900, Barnechea",
      estado: "inactive",
      consumo: 0,
      anomalias: 0,
      serial: "EAC-BRN-007",
    },
    {
      id: "meter_008",
      nombre: "Clínica Veterinaria Los Andes",
      lat: -33.3556,
      lng: -70.5267,
      direccion: "Camino El Alba 678, Barnechea",
      estado: "suspicious",
      consumo: 198.7,
      anomalias: 1,
      serial: "EAC-BRN-008",
    },
    {
      id: "meter_009",
      nombre: "Bodega Industrial San Carlos",
      lat: -33.3478,
      lng: -70.5201,
      direccion: "Camino San Carlos 999, Barnechea",
      estado: "fraud_detected",
      consumo: 0,
      anomalias: 3,
      serial: "EAC-BRN-009",
    },
    {
      id: "meter_010",
      nombre: "Local Comercial Cerrado",
      lat: -33.3601,
      lng: -70.5334,
      direccion: "Mall Plaza Los Dominicos Local 234, Barnechea",
      estado: "inactive",
      consumo: 0,
      anomalias: 0,
      serial: "EAC-BRN-010",
    },
  ];

  // Filtrar medidores según el parámetro
  let medidoresFiltrados = medidores;
  if (filtro && filtro !== "todos") {
    if (filtro === "anomalias") {
      medidoresFiltrados = medidores.filter((m) => m.anomalias > 0);
    } else {
      medidoresFiltrados = medidores.filter((m) => m.estado === filtro);
    }
  }

  // Devolver JSON con los medidores filtrados
  res.json({
    success: true,
    data: medidoresFiltrados,
    total: medidoresFiltrados.length,
    filtro: filtro || "todos",
  });
});

export default router;
