# API Electric Automatic Chile 🔌⚡

**API REST completa** desarrollada con Express.js, TypeScript y MongoDB para la gestión integral de cotizaciones eléctricas y servicios automatizados de Electric Automatic Chile.

## 🚀 Características Principales

- **🔐 Sistema de Autenticación JWT** - Login, registro, refresh tokens con bcrypt
- **🗄️ Base de Datos MongoDB** - Integración completa con Mongoose ODM
- **💰 Gestión de Cotizaciones** - Estados, seguimiento, estadísticas
- **💬 Sistema de Mensajería** - Chat interno entre usuarios
- **🔔 Notificaciones** - Push y en tiempo real
- **📄 Gestión de Documentos** - Upload, categorización, filtros
- **🏢 Administración de Empresas** - Registro y gestión de clientes empresariales
- **👥 Gestión de Usuarios** - Roles: Superadmin, Empresa, Cliente
- **📊 Dashboard con Estadísticas** - Métricas y analytics en tiempo real
- **🔍 Búsqueda Avanzada** - Filtros, paginación y búsqueda de texto

## 🏗️ Arquitectura Técnica

- **Express.js** con TypeScript completo
- **MongoDB Atlas** como base de datos principal
- **Mongoose ODM** para modelado de datos
- **JWT Authentication** con tokens seguros
- **bcrypt** para hash de contraseñas
- **Arquitectura MVC** modular y escalable
- **API RESTful** con paginación y filtros
- **Middleware de seguridad** (Helmet, CORS)
- **Manejo de errores** centralizado
- **Logging completo** con Morgan
- **Variables de entorno** configurables

## 📁 Estructura del Proyecto

```
api-electricautomaticchile/
├── config/                   # Configuraciones del sistema
│   └── database.ts              # → Configuración MongoDB/Mongoose
├── controllers/              # Controladores de negocio (8 controladores)
│   ├── AuthController.ts         # → Autenticación JWT y autorización
│   ├── UsuariosController.ts      # → Gestión de usuarios con MongoDB
│   ├── ClientesController.ts      # → Administración de clientes
│   ├── CotizacionesController.ts  # → Sistema de cotizaciones
│   ├── DocumentosController.ts    # → Gestión de documentos
│   ├── MensajesController.ts      # → Sistema de mensajería
│   ├── NotificacionesController.ts# → Sistema de notificaciones
│   └── EmpresasController.ts      # → Gestión de empresas
├── middleware/               # Middlewares personalizados
│   └── errorHandler.ts          # → Manejo centralizado de errores
├── models/                  # Modelos Mongoose (7 modelos)
│   ├── Usuario.ts              # → Esquema usuarios con autenticación
│   ├── Cliente.ts              # → Esquema clientes con validaciones
│   ├── Cotizacion.ts           # → Esquema cotizaciones
│   ├── Documento.ts            # → Esquema documentos
│   ├── Mensaje.ts              # → Esquema mensajería
│   ├── Notificacion.ts         # → Esquema notificaciones
│   └── Empresa.ts              # → Esquema empresas
├── routes/                  # Definición de rutas (9 archivos)
│   ├── index.ts                # → Router principal con documentación
│   ├── authRoutes.ts           # → Rutas de autenticación JWT
│   ├── usuariosRoutes.ts       # → Rutas de usuarios
│   ├── clientesRoutes.ts       # → Rutas de clientes
│   ├── cotizacionesRoutes.ts   # → Rutas de cotizaciones
│   ├── documentosRoutes.ts     # → Rutas de documentos
│   ├── mensajesRoutes.ts       # → Rutas de mensajería
│   ├── notificacionesRoutes.ts # → Rutas de notificaciones
│   └── empresasRoutes.ts       # → Rutas de empresas
├── dist/                    # Código compilado (generado)
├── node_modules/            # Dependencias (generado)
├── index.ts                 # Punto de entrada con conexión DB
├── package.json             # Dependencias y scripts
├── tsconfig.json           # Configuración TypeScript
├── nodemon.json            # Configuración desarrollo
├── .env                    # Variables de entorno (crear)
├── .env.example            # Ejemplo variables de entorno
├── .gitignore              # Archivos ignorados por Git
└── README.md               # Este archivo
```

## 🛠️ Instalación y Configuración

### 1. Prerrequisitos
- **Node.js** 18+ (recomendado 18.17+)
- **npm** o **yarn**
- **MongoDB Atlas** cuenta (o MongoDB local)
- **Git** para clonado

### 2. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd api-electricautomaticchile
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Configurar variables de entorno
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones reales:
```env
# ===== CONFIGURACIÓN DEL SERVIDOR =====
PORT=3000
NODE_ENV=development

# ===== MONGODB CONFIGURATION =====
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/electricautomatic?retryWrites=true&w=majority

# ===== JWT Y AUTENTICACIÓN =====
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_min_32_caracteres
JWT_REFRESH_SECRET=tu_refresh_secret_super_seguro_aqui_min_32_caracteres
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# ===== CORS Y SEGURIDAD =====
CORS_ORIGIN=http://localhost:3000,http://localhost:4000

# ===== RESEND (EMAILS) =====
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=cotizaciones@electricautomaticchile.com
EMAIL_TO=electricautomaticchile@gmail.com

# ===== AWS S3 (ARCHIVOS) =====
ACCESS_KEY_ID=AKIAT27PJ565CPGHTKEG
SECRET_ACCESS_KEY=tu_secret_access_key_aqui
REGION=us-east-1
S3_BUCKET_NAME=cotizaciones-bucket
PDF_PROMO_BUCKET=pdf-promo-bucket

# ===== FRONTEND CONFIGURATION =====
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_VERSION=v1

# ===== NEXTAUTH (PARA COMPATIBILIDAD) =====
NEXTAUTH_SECRET=tu_nextauth_secret_aqui
NEXTAUTH_URL=http://localhost:3000

# ===== DESARROLLO =====
LOG_LEVEL=info
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_BACKEND_HEALTH_CHECK_INTERVAL=30000
```

### 5. Configurar MongoDB Atlas

#### Opción A: MongoDB Atlas (Recomendado para producción)
1. Crea una cuenta en [MongoDB Atlas](https://cloud.mongodb.com/)
2. Crea un nuevo cluster
3. Configura el acceso de red (whitelist tu IP o usar 0.0.0.0/0 para desarrollo)
4. Crea un usuario de base de datos
5. Obtén la cadena de conexión y actualiza `MONGODB_URI` en `.env`

#### Opción B: MongoDB Local
```bash
# Instalar MongoDB localmente
# En Windows: descargar desde https://www.mongodb.com/try/download/community
# En macOS: brew install mongodb-community
# En Ubuntu: sudo apt install mongodb

# Usar URI local en .env
MONGODB_URI=mongodb://localhost:27017/electricautomatic
```

### 6. Compilar y ejecutar

**Para desarrollo:**
```bash
npm run dev
```

**Para producción:**
```bash
npm run build
npm start
```

### 7. Verificar instalación
```bash
# Probar health check
curl http://localhost:3000/health

# Debe devolver:
{
  "status": "OK",
  "message": "API Electricautomaticchile funcionando correctamente",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "database": {
    "connected": true,
    "connection": "MongoDB Atlas"
  }
}
```

## 🌐 API Endpoints Completos

### 🔐 Autenticación (`/api/auth`)
```http
POST   /api/auth/login           # → Iniciar sesión con JWT
POST   /api/auth/register        # → Registrar usuario nuevo
POST   /api/auth/logout          # → Cerrar sesión (invalida token cliente)
GET    /api/auth/me              # → Obtener perfil usuario autenticado
POST   /api/auth/refresh-token   # → Renovar token JWT expirado
```

### 👥 Usuarios (`/api/usuarios`)
```http
GET    /api/usuarios             # → Listar usuarios activos
GET    /api/usuarios/:id         # → Obtener usuario por ObjectId
POST   /api/usuarios             # → Crear usuario nuevo
PUT    /api/usuarios/:id         # → Actualizar usuario existente
DELETE /api/usuarios/:id         # → Eliminar usuario (soft delete)
```

### 🏢 Clientes (`/api/clientes`)
```http
GET    /api/clientes             # → Listar clientes (paginado, filtros)
GET    /api/clientes/:id         # → Obtener cliente por ObjectId
POST   /api/clientes             # → Crear cliente nuevo
PUT    /api/clientes/:id         # → Actualizar cliente existente
DELETE /api/clientes/:id         # → Eliminar cliente (soft delete)

# Query parameters para filtrado:
# ?page=1&limit=10&tipoCliente=empresa&ciudad=Santiago
```

### 💰 Cotizaciones (`/api/cotizaciones`)
```http
GET    /api/cotizaciones                  # → Listar cotizaciones (filtros: estado, fecha, cliente)
GET    /api/cotizaciones/estadisticas     # → Estadísticas de cotizaciones agregadas
GET    /api/cotizaciones/:id             # → Obtener cotización por ObjectId
POST   /api/cotizaciones                 # → Crear cotización nueva
PUT    /api/cotizaciones/:id             # → Actualizar cotización completa
PUT    /api/cotizaciones/:id/estado      # → Cambiar solo estado cotización
DELETE /api/cotizaciones/:id             # → Eliminar cotización

# Estados disponibles: borrador, enviada, aceptada, rechazada, revision, cancelada
```

### 📄 Documentos (`/api/documentos`)
```http
GET    /api/documentos                      # → Listar documentos (filtros múltiples)
GET    /api/documentos/estadisticas         # → Estadísticas de documentos por categoría
GET    /api/documentos/entidad/:tipo/:id    # → Docs por entidad (cotización, cliente, etc)
GET    /api/documentos/:id                  # → Obtener documento por ObjectId
POST   /api/documentos                      # → Crear documento manualmente
POST   /api/documentos/upload               # → Subir archivo con metadatos
PUT    /api/documentos/:id                  # → Actualizar metadatos documento
DELETE /api/documentos/:id                  # → Eliminar documento
```

### 💬 Mensajería (`/api/mensajes`)
```http
GET    /api/mensajes                           # → Listar mensajes (admin)
GET    /api/mensajes/bandeja/:usuarioId        # → Bandeja entrada usuario específico
GET    /api/mensajes/conversacion/:user1/:user2 # → Conversación entre dos usuarios
GET    /api/mensajes/estadisticas/:usuarioId   # → Estadísticas mensajería usuario
GET    /api/mensajes/:id                       # → Obtener mensaje por ObjectId
POST   /api/mensajes                           # → Enviar mensaje nuevo
PUT    /api/mensajes/:id/marcar-leido          # → Marcar mensaje como leído
PUT    /api/mensajes/marcar-todos-leidos/:userId # → Marcar todos como leídos
```

### 🔔 Notificaciones (`/api/notificaciones`)
```http
GET    /api/notificaciones                        # → Listar notificaciones (admin)
GET    /api/notificaciones/usuario/:usuarioId     # → Notificaciones usuario específico
GET    /api/notificaciones/estadisticas/:usuarioId # → Estadísticas notificaciones
GET    /api/notificaciones/:id                    # → Obtener notificación por ObjectId
POST   /api/notificaciones                        # → Crear notificación individual
POST   /api/notificaciones/masiva                 # → Envío masivo notificaciones
PUT    /api/notificaciones/:id/marcar-leida       # → Marcar notificación como leída
PUT    /api/notificaciones/marcar-todas-leidas/:userId # → Marcar todas como leídas
DELETE /api/notificaciones/:id                    # → Eliminar notificación
```

### 🏭 Empresas (`/api/empresas`)
```http
GET    /api/empresas                    # → Listar empresas (paginado, filtros)
GET    /api/empresas/estadisticas       # → Estadísticas empresas agregadas
GET    /api/empresas/buscar/:termino    # → Buscar empresas por texto
GET    /api/empresas/:id               # → Obtener empresa por ObjectId
POST   /api/empresas                   # → Crear empresa nueva
PUT    /api/empresas/:id               # → Actualizar empresa completa
PUT    /api/empresas/:id/estado        # → Cambiar solo estado empresa
DELETE /api/empresas/:id               # → Eliminar empresa (soft delete)
```

### 🔍 Otros Endpoints
```http
GET    /health                         # → Health check con estado DB
GET    /api                           # → Información completa API + endpoints
```

## 💡 Ejemplos de Uso Prácticos

### 🔐 Autenticación Completa

**1. Registrar nuevo usuario:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez Electricista",
    "email": "juan@electricautomatic.cl",
    "password": "MiPassword123!",
    "telefono": "+56987654321",
    "tipoUsuario": "empresa"
  }'
```

**2. Iniciar sesión:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@electricautomatic.cl",
    "password": "MiPassword123!"
  }'

# Respuesta:
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "usuario": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "nombre": "Juan Pérez Electricista",
      "email": "juan@electricautomatic.cl",
      "tipoUsuario": "empresa",
      "rol": "cliente"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

**3. Obtener perfil autenticado:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 👥 Gestión de Usuarios

**Crear usuario con datos completos:**
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "nombre": "María González",
    "email": "maria@cliente.com",
    "password": "SecurePass456!",
    "telefono": "+56912345678",
    "rol": "vendedor",
    "tipoUsuario": "empresa",
    "configuraciones": {
      "notificaciones": true,
      "tema": "claro",
      "idioma": "es"
    }
  }'
```

### 🏢 Gestión de Clientes

**Crear cliente empresa:**
```bash
curl -X POST http://localhost:3000/api/clientes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "nombre": "Constructora San Pedro",
    "email": "contacto@sanpedro.cl",
    "telefono": "+56987654321",
    "direccion": "Av. Providencia 1234, Of. 501",
    "ciudad": "Santiago",
    "rut": "76.543.210-8",
    "tipoCliente": "empresa"
  }'
```

**Listar clientes con paginación:**
```bash
curl "http://localhost:3000/api/clientes?page=1&limit=5&tipoCliente=empresa" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 💰 Sistema de Cotizaciones

**Crear cotización completa:**
```bash
curl -X POST http://localhost:3000/api/cotizaciones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "clienteId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "titulo": "Instalación Sistema Eléctrico Completo",
    "descripcion": "Cotización para instalación eléctrica en edificio comercial de 5 pisos",
    "items": [
      {
        "descripcion": "Motor portón automático 24V",
        "cantidad": 2,
        "precioUnitario": 450000,
        "subtotal": 900000
      },
      {
        "descripcion": "Panel de control digital",
        "cantidad": 1,
        "precioUnitario": 280000,
        "subtotal": 280000
      },
      {
        "descripcion": "Instalación y configuración",
        "cantidad": 1,
        "precioUnitario": 320000,
        "subtotal": 320000
      }
    ],
    "subtotal": 1500000,
    "iva": 285000,
    "total": 1785000,
    "validezDias": 30,
    "condicionesPago": "50% anticipo, 50% contra entrega"
  }'
```

**Cambiar estado de cotización:**
```bash
curl -X PUT http://localhost:3000/api/cotizaciones/64f8a1b2c3d4e5f6a7b8c9d2/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "estado": "aceptada",
    "comentario": "Cliente acepta propuesta, iniciar trabajos la próxima semana"
  }'
```

### 💬 Sistema de Mensajería

**Enviar mensaje interno:**
```bash
curl -X POST http://localhost:3000/api/mensajes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "destinatarioId": "64f8a1b2c3d4e5f6a7b8c9d3",
    "asunto": "Consulta sobre cotización #1234",
    "contenido": "Hola, tengo una consulta sobre los plazos de entrega para la cotización que enviamos ayer. ¿Podrías confirmar las fechas?",
    "prioridad": "media",
    "categoria": "consulta"
  }'
```

### 📄 Gestión de Documentos

**Subir documento técnico:**
```bash
curl -X POST http://localhost:3000/api/documentos/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "archivo=@plano_electrico.pdf" \
  -F "tipoEntidad=cotizacion" \
  -F "entidadId=64f8a1b2c3d4e5f6a7b8c9d2" \
  -F "categoria=tecnico" \
  -F "descripcion=Plano eléctrico detallado del proyecto"
```

## 🎯 Modelos de Datos MongoDB

### 👤 Usuario (users collection)
```typescript
{
  _id: ObjectId,
  nombre: string,
  email: string (unique),
  password: string (hashed),
  telefono?: string,
  rol: "admin" | "vendedor" | "cliente",
  tipoUsuario: "superadmin" | "empresa" | "cliente",
  empresaId?: ObjectId,
  configuraciones: {
    notificaciones: boolean,
    tema: "claro" | "oscuro",
    idioma: string
  },
  ultimoAcceso?: Date,
  activo2FA?: boolean,
  activo: boolean,
  fechaCreacion: Date,
  fechaActualizacion?: Date
}
```

### 🏢 Cliente (clientes collection)
```typescript
{
  _id: ObjectId,
  nombre: string,
  email?: string,
  telefono: string,
  direccion?: string,
  ciudad?: string,
  rut?: string,
  tipoCliente: "particular" | "empresa",
  activo: boolean,
  fechaCreacion: Date,
  fechaActualizacion?: Date
}
```

### 💰 Cotización (cotizaciones collection)
```typescript
{
  _id: ObjectId,
  numero: string (auto-generated),
  clienteId: ObjectId,
  titulo: string,
  descripcion?: string,
  items: [{
    descripcion: string,
    cantidad: number,
    precioUnitario: number,
    subtotal: number
  }],
  subtotal: number,
  iva: number,
  total: number,
  estado: "borrador" | "enviada" | "aceptada" | "rechazada" | "revision" | "cancelada",
  validezDias: number,
  fechaCreacion: Date,
  fechaActualizacion?: Date
}
```

## 🎯 Tipos de Usuario y Permisos

### 👨‍💼 Superadmin
- **Acceso:** Completo a toda la plataforma
- **Funciones:**
  - Gestión de usuarios y empresas
  - Configuración del sistema
  - Estadísticas globales
  - Administración de base de datos

### 🏢 Empresa
- **Acceso:** Gestión de sus propios datos
- **Funciones:**
  - Gestión de clientes asignados
  - Creación y seguimiento de cotizaciones
  - Sistema de mensajería con clientes
  - Dashboard con métricas de negocio
  - Gestión de documentos del proyecto

### 👤 Cliente
- **Acceso:** Solo sus datos y cotizaciones
- **Funciones:**
  - Visualización de cotizaciones recibidas
  - Comunicación con la empresa
  - Descarga de documentos autorizados
  - Historial de servicios contratados

## 📊 Estados del Sistema

### Estados de Cotizaciones
| Estado | Descripción | Siguiente Acción |
|--------|-------------|------------------|
| `borrador` | En elaboración por la empresa | Enviar al cliente |
| `enviada` | Enviada al cliente, esperando respuesta | Cliente revisa |
| `aceptada` | Aceptada por el cliente | Iniciar trabajo |
| `rechazada` | Rechazada por el cliente | Revisar o archivar |
| `revision` | En proceso de revisión/modificación | Actualizar términos |
| `cancelada` | Cancelada por cualquier motivo | Archivar |

### Prioridades de Notificaciones
- `baja` - Informativa, no urgente
- `media` - Importante, revisar pronto
- `alta` - Urgente, requiere atención inmediata
- `critica` - Crítica, atención inmediata requerida

## 🔧 Stack Tecnológico Completo

### Backend Principal
- **Node.js** 18+ - Runtime JavaScript/TypeScript
- **Express.js** 4.19+ - Framework web robusto
- **TypeScript** 5.0+ - Tipado estático y desarrollo moderno
- **Mongoose** 8.0+ - ODM elegante para MongoDB

### Base de Datos
- **MongoDB Atlas** - Base de datos NoSQL en la nube
- **MongoDB Compass** - GUI para administración (recomendado)
- **Índices optimizados** - Para búsquedas rápidas

### Autenticación y Seguridad
- **jsonwebtoken** - Tokens JWT seguros
- **bcrypt** - Hash de contraseñas con salt
- **Helmet** - Headers de seguridad HTTP
- **CORS** - Control de acceso entre dominios

### Desarrollo y Herramientas
- **Nodemon** - Hot reload para desarrollo
- **ts-node** - Ejecución directa de TypeScript
- **Morgan** - Logging de requests HTTP
- **dotenv** - Gestión de variables de entorno

### Validación y Middleware
- **Mongoose Validators** - Validación a nivel de esquema
- **Express Validators** - Validación de requests
- **Error Handling** - Manejo centralizado de errores

## 🚀 Despliegue y Producción

### Variables de Entorno Producción
```env
NODE_ENV=production
PORT=3000

# MongoDB Producción
MONGODB_URI=mongodb+srv://user:password@production-cluster.mongodb.net/electricautomatic_prod

# JWT Producción (generar secretos únicos)
JWT_SECRET=jwt_secret_super_seguro_produccion_min_32_caracteres
JWT_REFRESH_SECRET=refresh_secret_super_seguro_produccion_min_32_caracteres

# CORS Producción
CORS_ORIGIN=https://electricautomaticchile.com,https://admin.electricautomaticchile.com

# Logging
LOG_LEVEL=error
```

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY dist ./dist
COPY .env.production ./.env

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production

# Comando de inicio
CMD ["node", "dist/index.js"]
```

### Scripts de Deployment
```bash
# Build para producción
npm run build

# Iniciar en producción
NODE_ENV=production npm start

# PM2 para producción (recomendado)
npm install -g pm2
pm2 start dist/index.js --name "electric-api"
```

## 📈 Monitoreo y Métricas

La API incluye endpoints de estadísticas para monitorear:

### Métricas Disponibles
- 📊 **Cotizaciones:** Estados, conversión, valores promedio
- 💬 **Mensajería:** Actividad, respuestas, engagement
- 🔔 **Notificaciones:** Enviadas, leídas, efectividad
- 📄 **Documentos:** Categorías, uploads, descargas
- 👥 **Usuarios:** Registros, actividad, retención
- 🏢 **Empresas:** Registradas, activas, performance

### Health Check Avanzado
```bash
curl http://localhost:3000/health

# Respuesta completa:
{
  "status": "OK",
  "message": "API Electricautomaticchile funcionando correctamente",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "database": {
    "connected": true,
    "connection": "MongoDB Atlas",
    "responseTime": "45ms"
  },
  "version": "1.0.0",
  "uptime": "2h 15m 30s"
}
```

## 🐛 Debug y Solución de Problemas

### Problemas Comunes

**1. Error de conexión a MongoDB:**
```bash
# Verificar URI en .env
echo $MONGODB_URI

# Probar conexión directa
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conexión exitosa'))
  .catch(err => console.log('❌ Error:', err.message));
"
```

**2. Errores de JWT:**
```bash
# Verificar secretos
echo $JWT_SECRET | wc -c  # Debe ser >= 32 caracteres

# Verificar token
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -v
```

**3. Ver logs detallados:**
```bash
# Desarrollo con logs verbose
DEBUG=* npm run dev

# Producción con PM2
pm2 logs electric-api --lines 100
```

### Comandos Útiles de Debug
```bash
# Verificar estado del servidor
curl http://localhost:3000/health

# Ver usuarios en base de datos
mongo "your-mongodb-uri" --eval "db.usuarios.find().pretty()"

# Limpiar base de datos de desarrollo
mongo "your-mongodb-uri" --eval "db.dropDatabase()"

# Verificar índices
mongo "your-mongodb-uri" --eval "db.usuarios.getIndexes()"
```

## 🤝 Contribución y Desarrollo

### Flujo de Desarrollo
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/NuevaFuncionalidad`)
3. Haz tus cambios siguiendo las convenciones
4. Ejecuta tests: `npm test` (cuando estén implementados)
5. Commit con mensajes descriptivos (`git commit -m 'Add: Sistema de notificaciones push'`)
6. Push a la rama (`git push origin feature/NuevaFuncionalidad`)
7. Abre un Pull Request

### Convenciones de Código
- **TypeScript:** Usar tipado estricto en todas las funciones
- **Naming:** camelCase para variables, PascalCase para clases
- **Comentarios:** Documentar funciones complejas
- **Error Handling:** Siempre manejar errores con try/catch
- **Validación:** Validar datos de entrada en controladores
- **Seguridad:** Nunca exponer contraseñas en respuestas

### Estructura de Commits
```bash
# Tipos de commit
feat: nueva funcionalidad
fix: corrección de bug
docs: actualización documentación
style: cambios de formato
refactor: refactorización código
test: agregar tests
chore: tareas de mantenimiento

# Ejemplos
git commit -m "feat: agregar autenticación de dos factores"
git commit -m "fix: corregir validación de RUT chileno"
git commit -m "docs: actualizar ejemplos de API en README"
```

## 📝 Roadmap de Desarrollo

### 🔄 Próximas Mejoras (Sprint 1-2)
- [ ] **Tests automatizados** - Jest + Supertest
- [ ] **Sistema de roles granular** - Permisos específicos
- [ ] **WebSocket** para notificaciones en tiempo real
- [ ] **Rate limiting** - Protección contra spam
- [ ] **Logging avanzado** - Winston + ELK Stack

### 🚀 Funcionalidades Mediano Plazo (Sprint 3-6)
- [ ] **API de pagos** - Integración con WebPay/Flow
- [ ] **Plantillas de cotización** - Sistema modular
- [ ] **Firma digital** - Validación legal de documentos
- [ ] **Dashboard analytics** - Métricas avanzadas
- [ ] **Backup automático** - Respaldo programado

### 🔮 Futuras Integraciones (Sprint 7+)
- [ ] **WhatsApp Business API** - Notificaciones por WhatsApp
- [ ] **Facturación electrónica SII** - Integración con facturación chilena
- [ ] **Google Calendar** - Sincronización de citas
- [ ] **PDF automáticos** - Generación de reportes
- [ ] **Sistema de inventario** - Control de stock
- [ ] **CRM completo** - Gestión de relaciones con clientes
- [ ] **Aplicación móvil** - App nativa iOS/Android

## 📄 Licencia y Legal

Este proyecto está bajo la **Licencia ISC** - ver el archivo [LICENSE](LICENSE) para más detalles.

### Términos de Uso
- ✅ Uso comercial permitido
- ✅ Modificación permitida
- ✅ Distribución permitida
- ✅ Uso privado permitido
- ❌ Sin garantía incluida
- ❌ Sin responsabilidad del autor

## 📞 Contacto y Soporte

### Electric Automatic Chile
- 📧 **Email:** info@electricautomatic.cl
- 🌐 **Website:** [www.electricautomatic.cl](https://www.electricautomatic.cl)
- 📱 **Teléfono:** +56 9 XXXX XXXX
- 📍 **Dirección:** Santiago, Chile

### Equipo de Desarrollo
- 💼 **LinkedIn:** [Tu LinkedIn](https://linkedin.com/in/tu-perfil)
- 🐙 **GitHub:** [Tu GitHub](https://github.com/tu-usuario)
- 📧 **Email Técnico:** dev@electricautomatic.cl

### Soporte Técnico
- 🐛 **Issues:** [GitHub Issues](https://github.com/usuario/api-electricautomaticchile/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/usuario/api-electricautomaticchile/discussions)
- 📖 **Wiki:** [GitHub Wiki](https://github.com/usuario/api-electricautomaticchile/wiki)

---

⚡ **Desarrollado con ❤️ para Electric Automatic Chile** ⚡

*Esta documentación está viva y se actualiza constantemente. Si encuentras algún error, problema o tienes sugerencias de mejora, no dudes en abrir un issue o contribuir directamente al proyecto.*

**Última actualización:** Enero 2024 | **Versión API:** 1.0.0 | **Base de datos:** MongoDB Atlas 