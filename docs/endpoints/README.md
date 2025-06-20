# Índice de Endpoints - API ElectricAutomaticChile

Documentación completa de todos los endpoints disponibles en la API.

## 🔗 Rutas Base

- **API Base**: `/api`
- **Health Check**: `/health`

## 📋 Endpoints por Módulo

### 🔐 Autenticación (`/api/auth`)

| Método | Endpoint         | Acceso  | Descripción           |
| ------ | ---------------- | ------- | --------------------- |
| `POST` | `/login`         | Público | Iniciar sesión        |
| `POST` | `/register`      | Público | Registrar usuario     |
| `POST` | `/logout`        | Público | Cerrar sesión         |
| `GET`  | `/me`            | Privado | Obtener perfil actual |
| `POST` | `/refresh-token` | Público | Renovar token         |

📖 **[Ver documentación completa](./auth.md)**

---

### 📋 Cotizaciones (`/api/cotizaciones`)

| Método   | Endpoint                 | Acceso  | Descripción                     |
| -------- | ------------------------ | ------- | ------------------------------- |
| `POST`   | `/contacto`              | Público | Recibir formulario de contacto  |
| `GET`    | `/`                      | Privado | Listar cotizaciones con filtros |
| `GET`    | `/pendientes`            | Privado | Cotizaciones pendientes         |
| `GET`    | `/estadisticas`          | Privado | Estadísticas del dashboard      |
| `GET`    | `/:id`                   | Privado | Obtener cotización específica   |
| `POST`   | `/`                      | Privado | Crear cotización manual         |
| `PUT`    | `/:id/estado`            | Privado | Cambiar estado                  |
| `PUT`    | `/:id/cotizar`           | Privado | Agregar datos de cotización     |
| `POST`   | `/:id/convertir-cliente` | Privado | Convertir a cliente             |
| `DELETE` | `/:id`                   | Privado | Eliminar cotización             |

📖 **[Ver documentación completa](./cotizaciones.md)**

---

### 👥 Clientes (`/api/clientes`)

| Método   | Endpoint            | Acceso  | Descripción                |
| -------- | ------------------- | ------- | -------------------------- |
| `GET`    | `/`                 | Privado | Listar clientes            |
| `GET`    | `/:id`              | Privado | Obtener cliente específico |
| `POST`   | `/`                 | Privado | Crear cliente              |
| `PUT`    | `/:id`              | Privado | Actualizar cliente         |
| `DELETE` | `/:id`              | Privado | Eliminar cliente           |
| `PUT`    | `/:id/activar`      | Privado | Activar/desactivar cliente |
| `GET`    | `/:id/cotizaciones` | Privado | Cotizaciones del cliente   |

---

### 👤 Usuarios (`/api/usuarios`)

| Método   | Endpoint        | Acceso  | Descripción                |
| -------- | --------------- | ------- | -------------------------- |
| `GET`    | `/`             | Privado | Listar usuarios            |
| `GET`    | `/:id`          | Privado | Obtener usuario específico |
| `POST`   | `/`             | Privado | Crear usuario              |
| `PUT`    | `/:id`          | Privado | Actualizar usuario         |
| `DELETE` | `/:id`          | Privado | Eliminar usuario           |
| `PUT`    | `/:id/password` | Privado | Cambiar contraseña         |
| `PUT`    | `/:id/rol`      | Privado | Cambiar rol                |

---

### 💬 Mensajes (`/api/mensajes`)

| Método   | Endpoint                | Acceso  | Descripción                |
| -------- | ----------------------- | ------- | -------------------------- |
| `GET`    | `/`                     | Privado | Listar mensajes            |
| `GET`    | `/:id`                  | Privado | Obtener mensaje específico |
| `POST`   | `/`                     | Privado | Enviar mensaje             |
| `PUT`    | `/:id/leer`             | Privado | Marcar como leído          |
| `DELETE` | `/:id`                  | Privado | Eliminar mensaje           |
| `GET`    | `/conversacion/:userId` | Privado | Conversación con usuario   |

---

### 🔔 Notificaciones (`/api/notificaciones`)

| Método   | Endpoint               | Acceso  | Descripción              |
| -------- | ---------------------- | ------- | ------------------------ |
| `GET`    | `/`                    | Privado | Listar notificaciones    |
| `GET`    | `/no-leidas`           | Privado | Notificaciones no leídas |
| `PUT`    | `/:id/leer`            | Privado | Marcar como leída        |
| `PUT`    | `/marcar-todas-leidas` | Privado | Marcar todas como leídas |
| `DELETE` | `/:id`                 | Privado | Eliminar notificación    |

---

### 📄 Documentos (`/api/documentos`)

| Método   | Endpoint        | Acceso  | Descripción         |
| -------- | --------------- | ------- | ------------------- |
| `GET`    | `/`             | Privado | Listar documentos   |
| `GET`    | `/:id`          | Privado | Obtener documento   |
| `POST`   | `/upload`       | Privado | Subir documento     |
| `DELETE` | `/:id`          | Privado | Eliminar documento  |
| `GET`    | `/:id/download` | Privado | Descargar documento |

---

### 🏢 Empresas (`/api/empresas`)

| Método   | Endpoint        | Acceso  | Descripción                |
| -------- | --------------- | ------- | -------------------------- |
| `GET`    | `/`             | Privado | Listar empresas            |
| `GET`    | `/:id`          | Privado | Obtener empresa específica |
| `POST`   | `/`             | Privado | Crear empresa              |
| `PUT`    | `/:id`          | Privado | Actualizar empresa         |
| `DELETE` | `/:id`          | Privado | Eliminar empresa           |
| `GET`    | `/:id/usuarios` | Privado | Usuarios de la empresa     |

---

## 🔍 Health Check

### GET /health

**Público** - Verificar estado del servidor y base de datos.

```http
GET /health

Response:
{
  "status": "OK",
  "message": "API Electricautomaticchile funcionando correctamente",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "database": {
    "connected": true,
    "connection": "MongoDB Atlas"
  }
}
```

## 🔐 Autenticación

### Endpoints Públicos

No requieren autenticación:

- `POST /api/cotizaciones/contacto`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `POST /api/auth/refresh-token`
- `GET /health`

### Endpoints Privados

Requieren header `Authorization: Bearer <token>`:

- Todos los demás endpoints

### Roles y Permisos

| Rol          | Permisos                                     |
| ------------ | -------------------------------------------- |
| `superadmin` | Acceso completo a todos los endpoints        |
| `admin`      | Gestión de cotizaciones, clientes y usuarios |
| `vendedor`   | Acceso a cotizaciones asignadas y clientes   |
| `cliente`    | Acceso solo a sus propias cotizaciones       |

## 📊 Filtros y Paginación

### Parámetros de Query Comunes

| Parámetro   | Tipo   | Descripción                        |
| ----------- | ------ | ---------------------------------- |
| `page`      | number | Número de página (default: 1)      |
| `limit`     | number | Elementos por página (default: 10) |
| `search`    | string | Búsqueda de texto                  |
| `sortBy`    | string | Campo para ordenar                 |
| `sortOrder` | string | Orden: `asc` o `desc`              |

### Filtros Específicos por Endpoint

- **Cotizaciones**: `estado`, `prioridad`, `servicio`, `fechaDesde`, `fechaHasta`
- **Clientes**: `activo`, `tipoCliente`, `fechaRegistro`
- **Usuarios**: `rol`, `tipoUsuario`, `activo`
- **Mensajes**: `leido`, `remitente`, `destinatario`

## ⚠️ Códigos de Estado HTTP

### Códigos de Éxito

- **200 OK**: Solicitud exitosa
- **201 Created**: Recurso creado exitosamente
- **204 No Content**: Operación exitosa sin contenido

### Códigos de Error del Cliente

- **400 Bad Request**: Datos inválidos o faltantes
- **401 Unauthorized**: No autenticado o token inválido
- **403 Forbidden**: Sin permisos para la operación
- **404 Not Found**: Recurso no encontrado
- **409 Conflict**: Conflicto con el estado actual
- **422 Unprocessable Entity**: Error de validación

### Códigos de Error del Servidor

- **500 Internal Server Error**: Error interno del servidor
- **503 Service Unavailable**: Servicio temporalmente no disponible

## 📋 Formato de Respuesta Estándar

### Respuesta Exitosa

```json
{
  "success": true,
  "message": "Descripción de la operación",
  "data": { ... }
}
```

### Respuesta con Paginación

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "itemsPerPage": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Respuesta de Error

```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles técnicos del error",
  "code": "ERROR_CODE"
}
```

## 🚀 Ejemplos de Uso

### Autenticación y Uso de Token

```javascript
// Login
const loginResponse = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "user@example.com", password: "password" }),
});

const { data } = await loginResponse.json();
const token = data.token;

// Uso del token en requests
const response = await fetch("/api/cotizaciones", {
  headers: { Authorization: `Bearer ${token}` },
});
```

### Filtros y Paginación

```javascript
// Cotizaciones pendientes, página 2, 20 por página
const url = "/api/cotizaciones?estado=pendiente&page=2&limit=20";

// Búsqueda de texto
const searchUrl = "/api/cotizaciones?search=instalación eléctrica";

// Rango de fechas
const dateUrl = "/api/cotizaciones?fechaDesde=2024-01-01&fechaHasta=2024-01-31";
```

## 📞 Soporte

Para consultas sobre endpoints específicos:

- Revisa la documentación detallada de cada módulo
- Utiliza `GET /health` para verificar el estado de la API
- Consulta los logs del servidor para debugging

---

_Para documentación detallada de cada endpoint, haz clic en los enlaces de cada sección._
