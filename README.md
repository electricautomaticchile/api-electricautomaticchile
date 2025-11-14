# Electric Automatic Chile - API Backend

API REST para gestión de usuarios, dispositivos IoT y datos de consumo eléctrico.

## 🚀 ¿Qué hace este proyecto?

API backend desarrollada en Node.js/Express que proporciona:

- **Autenticación y Autorización**: Sistema JWT con roles (superadmin, empresa, cliente)
- **Gestión de Usuarios**: CRUD de clientes, empresas y superadmins
- **Gestión de Dispositivos**: Registro y configuración de dispositivos Arduino
- **Estadísticas de Consumo**: Endpoints para obtener datos históricos y en tiempo real
- **Almacenamiento de Lecturas**: Persistencia de datos de consumo eléctrico
- **Gestión de Pagos**: Sistema de boletas y facturas

## 🛠️ Tecnologías

- **Node.js + Express** - Framework backend
- **TypeScript** - Tipado estático
- **MongoDB + Mongoose** - Base de datos NoSQL
- **JWT** - Autenticación
- **Bcrypt** - Encriptación de contraseñas
- **Axios** - Cliente HTTP

## 📦 Instalación

```bash
npm install
```

## 🔧 Configuración

Crea un archivo `.env` con las siguientes variables:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/electricautomaticchile
JWT_SECRET=tu_secret_key_aqui
NODE_ENV=development
```

## 🚀 Desarrollo

```bash
npm run dev
```

La API estará disponible en `http://localhost:4000`

## 📊 Endpoints Principales

- `POST /api/auth/login` - Autenticación
- `GET /api/auth/me` - Obtener usuario actual
- `GET /api/clientes` - Listar clientes
- `GET /api/dispositivos` - Listar dispositivos
- `GET /api/estadisticas/consumo-electrico/:clienteId` - Estadísticas de consumo

## 📚 Documentación Detallada

Para más información sobre deployment, endpoints completos y configuraciones, consulta la carpeta [`docs/`](./docs/)

## 🔗 Proyectos Relacionados

- [Frontend](../electricautomaticchile/)
- [WebSocket API](../Websocket-api/)
