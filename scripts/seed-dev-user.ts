/**
 * Script para crear usuario de desarrollo
 * 
 * Este script crea un usuario universal que puede acceder a todos los dashboards
 * en modo desarrollo local.
 * 
 * Uso:
 *   npm run seed:dev
 *   o
 *   ts-node scripts/seed-dev-user.ts
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, "../.env.local") });

// Credenciales del usuario de desarrollo
const DEV_USER = {
  numeroCliente: "000000-0",
  password: "dev123456",
  nombre: "Usuario Desarrollo",
  correo: "dev@electricautomaticchile.local",
  telefono: "+56912345678",
};

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/electricautomatic";
    await mongoose.connect(mongoUri);
    console.log("✅ Conectado a MongoDB");
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error);
    process.exit(1);
  }
}

async function createDevUser() {
  try {
    console.log("\n🔧 Creando usuario de desarrollo...\n");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Base de datos no conectada");
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEV_USER.password, salt);

    // 1. Crear/Actualizar en EMPRESAS (para dashboard-empresa)
    console.log("\n📝 Creando en colección: empresas");
    await db.collection("empresas").updateOne(
      { numeroCliente: DEV_USER.numeroCliente },
      {
        $set: {
          numeroCliente: DEV_USER.numeroCliente,
          password: hashedPassword,
          passwordVisible: DEV_USER.password,
          nombre: DEV_USER.nombre,
          razonSocial: "Empresa Desarrollo S.A.",
          rut: "11111111-1",
          email: DEV_USER.correo,
          telefono: DEV_USER.telefono,
          direccion: "Calle Desarrollo 123, Santiago",
          ciudad: "Santiago",
          region: "Metropolitana",
          estado: "activo",
          tipo: "empresa",
          fechaRegistro: new Date(),
          fechaActualizacion: new Date(),
          configuracion: {
            notificaciones: true,
            tema: "claro",
          },
        },
      },
      { upsert: true }
    );
    console.log("✅ Usuario creado/actualizado en empresas");

    // 2. Crear/Actualizar en CLIENTES (para dashboard-cliente)
    console.log("\n📝 Creando en colección: clientes");
    await db.collection("clientes").updateOne(
      { numeroCliente: DEV_USER.numeroCliente },
      {
        $set: {
          numeroCliente: DEV_USER.numeroCliente,
          password: hashedPassword,
          passwordVisible: DEV_USER.password,
          nombre: DEV_USER.nombre,
          rut: "11111111-1",
          email: DEV_USER.correo,
          telefono: DEV_USER.telefono,
          direccion: "Calle Desarrollo 123, Santiago",
          ciudad: "Santiago",
          region: "Metropolitana",
          activo: true,
          tipo: "cliente",
          fechaRegistro: new Date(),
          fechaActualizacion: new Date(),
          configuracion: {
            notificaciones: true,
            tema: "claro",
          },
        },
      },
      { upsert: true }
    );
    console.log("✅ Usuario creado/actualizado en clientes");

    // Resumen
    console.log("\n" + "=".repeat(60));
    console.log("🎉 USUARIO DE DESARROLLO CREADO EXITOSAMENTE");
    console.log("=".repeat(60));
    console.log("\n📋 CREDENCIALES DE ACCESO:\n");
    console.log(`   Número de Cliente: ${DEV_USER.numeroCliente}`);
    console.log(`   Contraseña:        ${DEV_USER.password}`);
    console.log("\n🎯 DASHBOARDS DISPONIBLES:\n");
    console.log("   • Dashboard Empresa:    http://localhost:3000/dashboard-empresa");
    console.log("   • Dashboard Cliente:    http://localhost:3000/dashboard-cliente");
    console.log("\n💡 NOTA:");
    console.log("   Este usuario funciona para ambos dashboards.");
    console.log("   Usa las mismas credenciales en cualquier dashboard.");
    console.log("\n" + "=".repeat(60) + "\n");

  } catch (error) {
    console.error("\n❌ Error creando usuario de desarrollo:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await createDevUser();
    console.log("✅ Proceso completado exitosamente\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en el proceso:", error);
    process.exit(1);
  }
}

// Ejecutar script
main();
