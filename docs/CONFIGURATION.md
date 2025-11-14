# Configuración - API Backend

## 🔧 Variables de Entorno

### Requeridas

```env
# Puerto del servidor
PORT=4000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/electricautomaticchile

# JWT Secret (mínimo 32 caracteres)
JWT_SECRET=tu_secret_key_muy_seguro_32_caracteres_minimo

# Entorno
NODE_ENV=development
```

### Opcionales

```env
# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# JWT
JWT_EXPIRES_IN=7d

# Bcrypt
BCRYPT_ROUNDS=10
```

## 🗄️ Modelos de Base de Datos

### Cliente

```typescript
{
  nombre: string;
  numeroCliente: string; // Único
  email: string; // Único
  password: string; // Hasheado
  direccion?: string;
  telefono?: string;
  dispositivoAsignado?: string;
  empresa?: ObjectId;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Dispositivo

```typescript
{
  numeroDispositivo: string; // Único
  nombre: string;
  tipo: 'arduino_uno' | 'arduino_mega' | 'esp32' | 'esp8266';
  estado: 'activo' | 'inactivo' | 'mantenimiento';
  clienteAsignado?: ObjectId;
  empresaAsignada?: ObjectId;
  ubicacion?: string;
  configuracion: {
    voltajeNominal: number;
    corrienteMaxima: number;
    potenciaMaxima: number;
    tarifaKwh: number;
  };
  ultimaLectura?: {
    voltage: number;
    current: number;
    activePower: number;
    energy: number;
    cost: number;
    timestamp: Date;
  };
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Empresa

```typescript
{
  nombre: string;
  rut: string; // Único
  email: string; // Único
  password: string; // Hasheado
  direccion?: string;
  telefono?: string;
  clientesAsignados: ObjectId[];
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Superusuario

```typescript
{
  nombre: string;
  email: string; // Único
  password: string; // Hasheado
  permisos: string[];
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔐 Middleware

### authMiddleware

Valida JWT en header `Authorization: Bearer <token>`

```typescript
req.user = {
  userId: string;
  role: 'cliente' | 'empresa' | 'superadmin';
  type: string;
}
```

### Rate Limiting

- 100 requests por 15 minutos por IP
- Configurable con variables de entorno

## 🛡️ Seguridad

### Helmet.js

Headers de seguridad configurados:

- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

### CORS

Configurado para permitir solo dominios específicos:

```typescript
{
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true
}
```

### Password Hashing

```typescript
bcrypt.hash(password, 10);
```

## 📝 Logging

Winston configurado con:

- Console transport (desarrollo)
- File transport (producción)
- Formato JSON
- Niveles: error, warn, info, debug

## 🔄 Scripts Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm start

# Tests
npm test

# Linting
npm run lint
```
