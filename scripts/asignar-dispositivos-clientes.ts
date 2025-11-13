import mongoose from "mongoose";
import dotenv from "dotenv";
import Cliente from "../models/Cliente";

// Cargar variables de entorno
dotenv.config({ path: ".env.local" });

async function asignarDispositivosAClientes() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error(
        "MONGODB_URI no está definida en las variables de entorno"
      );
    }

    console.log("🔌 Conectando a MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Conectado a MongoDB");

    // Obtener todos los clientes sin dispositivo asignado
    const clientesSinDispositivo = await Cliente.find({
      $or: [
        { dispositivoAsignado: { $exists: false } },
        { dispositivoAsignado: null },
        { dispositivoAsignado: "" },
      ],
    });

    console.log(
      `📊 Clientes sin dispositivo asignado: ${clientesSinDispositivo.length}`
    );

    if (clientesSinDispositivo.length === 0) {
      console.log("✅ Todos los clientes ya tienen dispositivo asignado");
      return;
    }

    // Asignar "arduino_uno" a todos los clientes sin dispositivo
    const resultado = await Cliente.updateMany(
      {
        $or: [
          { dispositivoAsignado: { $exists: false } },
          { dispositivoAsignado: null },
          { dispositivoAsignado: "" },
        ],
      },
      {
        $set: { dispositivoAsignado: "arduino_uno" },
      }
    );

    console.log(
      `✅ Dispositivos asignados: ${resultado.modifiedCount} clientes actualizados`
    );

    // Mostrar algunos ejemplos
    const clientesActualizados = await Cliente.find({
      dispositivoAsignado: "arduino_uno",
    })
      .select("nombre correo dispositivoAsignado")
      .limit(5);

    console.log("\n📋 Ejemplos de clientes actualizados:");
    clientesActualizados.forEach((cliente) => {
      console.log(
        `  - ${cliente.nombre} (${cliente.correo}): ${cliente.dispositivoAsignado}`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Desconectado de MongoDB");
  }
}

// Ejecutar el script
asignarDispositivosAClientes()
  .then(() => {
    console.log("\n✅ Script completado exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error ejecutando el script:", error);
    process.exit(1);
  });
