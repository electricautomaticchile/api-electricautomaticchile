import mongoose from "mongoose";
import dotenv from "dotenv";
import Cliente from "../models/Cliente";
import Empresa from "../models/Empresa";

dotenv.config({ path: ".env" });

async function asignarEmpresa() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI no está definida");
    }

    console.log("🔌 Conectando a MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Conectado a MongoDB\n");

    // Buscar la empresa
    const empresa = await Empresa.findOne();
    if (!empresa) {
      console.log("❌ No hay empresas en la base de datos");
      return;
    }

    console.log(`✅ Empresa encontrada: ${empresa.nombreEmpresa}`);
    console.log(`   ID: ${empresa._id}\n`);

    // Buscar el cliente de prueba
    const cliente = await Cliente.findOne({ numeroCliente: "629903-3" });
    if (!cliente) {
      console.log("❌ Cliente 629903-3 no encontrado");
      return;
    }

    console.log(`✅ Cliente encontrado: ${cliente.nombre}`);
    console.log(`   ID: ${cliente._id}`);

    // Asignar empresa al cliente
    (cliente as any).empresa = empresa._id;
    await cliente.save();

    console.log(`\n✅ Empresa asignada al cliente exitosamente!`);
    console.log(`   Cliente: ${cliente.nombre}`);
    console.log(`   Empresa: ${empresa.nombreEmpresa}`);

    // Agregar cliente a la lista de clientes asignados de la empresa
    if (
      empresa.clientesAsignados &&
      !empresa.clientesAsignados.includes(cliente._id as any)
    ) {
      empresa.clientesAsignados.push(cliente._id as any);
      await empresa.save();
      console.log(`\n✅ Cliente agregado a la lista de la empresa`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Desconectado de MongoDB");
  }
}

asignarEmpresa()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
