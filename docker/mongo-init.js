// Script de inicialización de MongoDB para ElectricAutomaticChile
// Este script se ejecuta automáticamente cuando se crea el contenedor de MongoDB

// Conectar a la base de datos
db = db.getSiblingDB("electricautomatic");

// Crear colecciones básicas con índices
print("🔧 Inicializando base de datos ElectricAutomatic...");

// Colección de usuarios
db.createCollection("users");
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });
db.users.createIndex({ role: 1 });
print("✅ Colección users creada con índices");

// Colección de productos/servicios (si la necesitas)
db.createCollection("products");
db.products.createIndex({ name: 1 });
db.products.createIndex({ category: 1 });
db.products.createIndex({ active: 1 });
print("✅ Colección products creada con índices");

// Colección de contactos/leads
db.createCollection("contacts");
db.contacts.createIndex({ email: 1 });
db.contacts.createIndex({ createdAt: 1 });
db.contacts.createIndex({ status: 1 });
print("✅ Colección contacts creada con índices");

// Colección de sesiones (para manejo de tokens)
db.createCollection("sessions");
db.sessions.createIndex({ userId: 1 });
db.sessions.createIndex({ refreshToken: 1 }, { unique: true });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
print("✅ Colección sessions creada con índices");

// Crear usuario administrador por defecto (opcional)
// Puedes descomentar esto si quieres un usuario admin inicial
/*
const bcrypt = require('bcrypt');
const adminUser = {
  name: 'Administrador',
  email: 'admin@electricautomaticchile.com',
  password: '$2b$12$LQv3c1yqBw2fnc.A7X9UEu1CX8AhYGx.qOGXZVb/a2qX5QFnJz2xS', // password: admin123
  role: 'admin',
  verified: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

try {
  db.users.insertOne(adminUser);
  print('✅ Usuario administrador creado');
} catch (error) {
  print('⚠️ Usuario administrador ya existe o error al crear: ' + error);
}
*/

print("🎉 Base de datos ElectricAutomatic inicializada correctamente");

// Mostrar estadísticas
print("📊 Colecciones creadas:");
db.getCollectionNames().forEach(function (collection) {
  print("  - " + collection);
});
