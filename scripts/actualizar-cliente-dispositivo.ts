import mongoose from "mongoose";
import dotenv from "dotenv";
import Cliente from "../models/Cliente";

dotenv.config({ path: ".env" });

async function actualizarCliente() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI no está definida");
    }

    console.log("🔌 Conectando a MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Conectado a MongoDB\n");

    // Actualizar el cliente
    const resultado = await Cliente.findByIdAndUpdate(
      "688e5ee1233c78b3e47c7155",
      { dispositivoAsignado: "629903-3" },
      { new: true }
    );

    if (resultado) {
      console.log("✅ Cliente actualizado:");
      console.log(`   ID: ${resultado._id}`);
      console.log(`   Nombre: ${resultado.nombre}`);
      console.log(`   Dispositivo: ${resultado.dispositivoAsignado}`);
    } else {
      console.log("❌ Cliente no encontrado");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Desconectado de MongoDB");
  }
}

actualizarCliente()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
