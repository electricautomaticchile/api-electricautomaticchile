# Endpoints de Cotizaciones

El módulo de cotizaciones es el corazón del sistema. Gestiona todo el flujo desde la recepción de formularios de contacto hasta la conversión a cliente.

## Base URL

```
/api/cotizaciones
```

## Flujo de Estados

```
Pendiente → En Revisión → Cotizando → Cotizada → Aprobada → Convertida a Cliente
                                              ↓
                                          Rechazada
```

## Endpoints Públicos

### POST /contacto

**Público** - Recibir formulario de contacto desde el frontend.

#### Request

```http
POST /api/cotizaciones/contacto
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@empresa.com",
  "empresa": "Constructora ABC",
  "telefono": "+56912345678",
  "servicio": "cotizacion_completa",
  "plazo": "normal",
  "mensaje": "Necesito cotización para instalación eléctrica completa",
  "archivoUrl": "https://ejemplo.com/archivo.pdf",
  "archivo": "archivo.pdf",
  "archivoTipo": "application/pdf"
}
```

#### Parámetros

| Campo         | Tipo   | Requerido | Descripción                   |
| ------------- | ------ | --------- | ----------------------------- |
| `nombre`      | string | ✅        | Nombre del solicitante        |
| `email`       | string | ✅        | Email de contacto             |
| `empresa`     | string | ❌        | Nombre de la empresa          |
| `telefono`    | string | ❌        | Número de teléfono            |
| `servicio`    | string | ✅        | Tipo de servicio solicitado   |
| `plazo`       | string | ❌        | Urgencia del servicio         |
| `mensaje`     | string | ✅        | Descripción del requerimiento |
| `archivoUrl`  | string | ❌        | URL del archivo adjunto       |
| `archivo`     | string | ❌        | Nombre del archivo            |
| `archivoTipo` | string | ❌        | Tipo MIME del archivo         |

#### Tipos de Servicio

- `cotizacion_reposicion` - Reposición de equipos
- `cotizacion_monitoreo` - Sistema de monitoreo
- `cotizacion_mantenimiento` - Servicio de mantenimiento
- `cotizacion_completa` - Servicio completo

#### Plazos Disponibles

- `urgente` - Prioridad crítica
- `pronto` - Prioridad alta
- `normal` - Prioridad media
- `planificacion` - Prioridad baja

#### Response Exitoso (201)

```json
{
  "success": true,
  "message": "Cotización recibida exitosamente",
  "data": {
    "cotizacion": {
      "_id": "607d1f77bcf86cd799a2a4e8",
      "numero": "COT-2024-0001",
      "nombre": "Juan Pérez",
      "email": "juan@empresa.com",
      "servicio": "cotizacion_completa",
      "estado": "pendiente",
      "prioridad": "media",
      "fechaCreacion": "2024-01-20T10:30:00Z"
    }
  }
}
```

## Endpoints Privados (Requieren Autenticación)

### GET /

Obtener todas las cotizaciones con filtros y paginación.

#### Request

```http
GET /api/cotizaciones?page=1&limit=10&estado=pendiente&prioridad=alta
Authorization: Bearer <jwt_token>
```

#### Query Parameters

| Parámetro    | Tipo   | Descripción                        |
| ------------ | ------ | ---------------------------------- |
| `page`       | number | Página (default: 1)                |
| `limit`      | number | Elementos por página (default: 10) |
| `estado`     | string | Filtrar por estado                 |
| `prioridad`  | string | Filtrar por prioridad              |
| `servicio`   | string | Filtrar por tipo de servicio       |
| `search`     | string | Búsqueda de texto                  |
| `fechaDesde` | string | Fecha desde (ISO)                  |
| `fechaHasta` | string | Fecha hasta (ISO)                  |

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": {
    "cotizaciones": [
      {
        "_id": "607d1f77bcf86cd799a2a4e8",
        "numero": "COT-2024-0001",
        "nombre": "Juan Pérez",
        "email": "juan@empresa.com",
        "empresa": "Constructora ABC",
        "servicio": "cotizacion_completa",
        "estado": "pendiente",
        "prioridad": "media",
        "fechaCreacion": "2024-01-20T10:30:00Z",
        "asignadoA": null
      }
    ],
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

---

### GET /pendientes

Obtener cotizaciones pendientes de revisión.

#### Request

```http
GET /api/cotizaciones/pendientes
Authorization: Bearer <jwt_token>
```

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": [
    {
      "_id": "607d1f77bcf86cd799a2a4e8",
      "numero": "COT-2024-0001",
      "nombre": "Juan Pérez",
      "email": "juan@empresa.com",
      "servicio": "cotizacion_completa",
      "estado": "pendiente",
      "prioridad": "alta",
      "fechaCreacion": "2024-01-20T10:30:00Z"
    }
  ]
}
```

---

### GET /estadisticas

Obtener estadísticas del dashboard de cotizaciones.

#### Request

```http
GET /api/cotizaciones/estadisticas
Authorization: Bearer <jwt_token>
```

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": {
    "totales": {
      "pendiente": 15,
      "en_revision": 8,
      "cotizada": 12,
      "aprobada": 25,
      "convertida_cliente": 18,
      "rechazada": 3
    },
    "valores": {
      "pendiente": 0,
      "cotizada": 15750000,
      "aprobada": 32500000,
      "convertida_cliente": 28900000
    },
    "conversion": {
      "tasa_aprobacion": 0.78,
      "tasa_conversion": 0.72,
      "valor_promedio": 1250000
    }
  }
}
```

---

### GET /:id

Obtener cotización específica por ID.

#### Request

```http
GET /api/cotizaciones/607d1f77bcf86cd799a2a4e8
Authorization: Bearer <jwt_token>
```

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": {
    "_id": "607d1f77bcf86cd799a2a4e8",
    "numero": "COT-2024-0001",
    "nombre": "Juan Pérez",
    "email": "juan@empresa.com",
    "empresa": "Constructora ABC",
    "telefono": "+56912345678",
    "servicio": "cotizacion_completa",
    "plazo": "normal",
    "mensaje": "Necesito cotización para instalación eléctrica completa",
    "estado": "cotizada",
    "prioridad": "media",
    "titulo": "Instalación Eléctrica Industrial",
    "descripcion": "Proyecto completo de instalación eléctrica",
    "items": [
      {
        "descripcion": "Tablero eléctrico principal",
        "cantidad": 1,
        "precioUnitario": 850000,
        "subtotal": 850000
      },
      {
        "descripcion": "Cableado estructurado",
        "cantidad": 100,
        "precioUnitario": 2500,
        "subtotal": 250000
      }
    ],
    "subtotal": 1100000,
    "iva": 209000,
    "total": 1309000,
    "validezDias": 30,
    "condicionesPago": "50% anticipo, 50% contra entrega",
    "fechaCreacion": "2024-01-20T10:30:00Z",
    "fechaCotizacion": "2024-01-21T14:20:00Z",
    "asignadoA": {
      "_id": "607d1f77bcf86cd799a2a4e9",
      "nombre": "Carlos Vendedor"
    }
  }
}
```

---

### POST /

Crear cotización manual (uso interno).

#### Request

```http
POST /api/cotizaciones
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "nombre": "María González",
  "email": "maria@empresa.com",
  "empresa": "Servicios XYZ",
  "telefono": "+56987654321",
  "servicio": "cotizacion_mantenimiento",
  "plazo": "pronto",
  "mensaje": "Mantenimiento preventivo anual"
}
```

#### Response Exitoso (201)

```json
{
  "success": true,
  "message": "Cotización creada exitosamente",
  "data": {
    "_id": "607d1f77bcf86cd799a2a4e9",
    "numero": "COT-2024-0002",
    "nombre": "María González",
    "estado": "pendiente",
    "prioridad": "alta"
  }
}
```

---

### PUT /:id/estado

Cambiar estado de una cotización.

#### Request

```http
PUT /api/cotizaciones/607d1f77bcf86cd799a2a4e8/estado
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "estado": "en_revision",
  "notas": "Revisando requerimientos técnicos"
}
```

#### Parámetros

| Campo    | Tipo   | Requerido | Descripción                   |
| -------- | ------ | --------- | ----------------------------- |
| `estado` | string | ✅        | Nuevo estado de la cotización |
| `notas`  | string | ❌        | Notas internas del cambio     |

#### Estados Válidos

- `pendiente` - Recién recibida
- `en_revision` - En proceso de revisión
- `cotizando` - Preparando cotización
- `cotizada` - Cotización lista
- `aprobada` - Aprobada por el cliente
- `rechazada` - Rechazada
- `convertida_cliente` - Convertida a cliente

#### Response Exitoso (200)

```json
{
  "success": true,
  "message": "Estado actualizado exitosamente",
  "data": {
    "_id": "607d1f77bcf86cd799a2a4e8",
    "estado": "en_revision",
    "fechaActualizacion": "2024-01-21T09:15:00Z"
  }
}
```

---

### PUT /:id/cotizar

Agregar datos de cotización (precio, items, etc.).

#### Request

```http
PUT /api/cotizaciones/607d1f77bcf86cd799a2a4e8/cotizar
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "titulo": "Instalación Eléctrica Industrial",
  "descripcion": "Proyecto completo de instalación eléctrica para nave industrial",
  "items": [
    {
      "descripcion": "Tablero eléctrico principal 400A",
      "cantidad": 1,
      "precioUnitario": 850000,
      "subtotal": 850000
    },
    {
      "descripcion": "Cableado estructurado CAT6",
      "cantidad": 100,
      "precioUnitario": 2500,
      "subtotal": 250000
    }
  ],
  "subtotal": 1100000,
  "iva": 209000,
  "total": 1309000,
  "validezDias": 30,
  "condicionesPago": "50% anticipo, 50% contra entrega"
}
```

#### Parámetros

| Campo             | Tipo   | Requerido | Descripción                   |
| ----------------- | ------ | --------- | ----------------------------- |
| `titulo`          | string | ✅        | Título de la cotización       |
| `descripcion`     | string | ❌        | Descripción detallada         |
| `items`           | array  | ✅        | Lista de items cotizados      |
| `subtotal`        | number | ✅        | Subtotal sin IVA              |
| `iva`             | number | ✅        | Monto del IVA                 |
| `total`           | number | ✅        | Total con IVA                 |
| `validezDias`     | number | ❌        | Días de validez (default: 30) |
| `condicionesPago` | string | ❌        | Condiciones de pago           |

#### Estructura de Items

```javascript
{
  "descripcion": "string",    // Descripción del item
  "cantidad": "number",       // Cantidad
  "precioUnitario": "number", // Precio unitario
  "subtotal": "number"        // cantidad * precioUnitario
}
```

#### Response Exitoso (200)

```json
{
  "success": true,
  "message": "Cotización actualizada exitosamente",
  "data": {
    "_id": "607d1f77bcf86cd799a2a4e8",
    "estado": "cotizada",
    "total": 1309000,
    "fechaCotizacion": "2024-01-21T14:20:00Z"
  }
}
```

---

### POST /:id/convertir-cliente

Convertir cotización aprobada a cliente.

#### Request

```http
POST /api/cotizaciones/607d1f77bcf86cd799a2a4e8/convertir-cliente
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "passwordTemporal": "temp123456",
  "planSeleccionado": "premium",
  "montoMensual": 150000
}
```

#### Parámetros

| Campo              | Tipo   | Requerido | Descripción                                          |
| ------------------ | ------ | --------- | ---------------------------------------------------- |
| `passwordTemporal` | string | ❌        | Contraseña temporal (se genera si no se proporciona) |
| `planSeleccionado` | string | ❌        | Plan del cliente                                     |
| `montoMensual`     | number | ❌        | Monto mensual del plan                               |

#### Response Exitoso (200)

```json
{
  "success": true,
  "message": "Cotización convertida a cliente exitosamente",
  "data": {
    "cotizacion": {
      "_id": "607d1f77bcf86cd799a2a4e8",
      "estado": "convertida_cliente",
      "fechaConversion": "2024-01-22T10:00:00Z"
    },
    "cliente": {
      "_id": "607d1f77bcf86cd799a2a4ea",
      "numeroCliente": "CLI-2024-0001",
      "nombre": "Juan Pérez",
      "email": "juan@empresa.com"
    },
    "credenciales": {
      "numeroCliente": "CLI-2024-0001",
      "passwordTemporal": "temp123456"
    }
  }
}
```

---

### DELETE /:id

Eliminar cotización.

#### Request

```http
DELETE /api/cotizaciones/607d1f77bcf86cd799a2a4e8
Authorization: Bearer <jwt_token>
```

#### Response Exitoso (200)

```json
{
  "success": true,
  "message": "Cotización eliminada exitosamente"
}
```

## Filtros y Búsqueda

### Búsqueda de Texto

El parámetro `search` busca en los siguientes campos:

- `nombre`
- `email`
- `empresa`
- `titulo`
- `descripcion`

### Filtros Disponibles

- **Estado**: `estado=pendiente`
- **Prioridad**: `prioridad=alta`
- **Servicio**: `servicio=cotizacion_completa`
- **Rango de fechas**: `fechaDesde=2024-01-01&fechaHasta=2024-01-31`
- **Usuario asignado**: `asignadoA=607d1f77bcf86cd799a2a4e9`

### Ordenamiento

Por defecto se ordena por:

1. Prioridad (descendente)
2. Fecha de creación (descendente)

## Webhooks y Notificaciones

### Eventos Automatizados

- **Nueva cotización**: Se envía notificación a administradores
- **Estado cambiado**: Se notifica al cliente vía email
- **Cotización lista**: Se envía email con detalles al cliente
- **Conversión a cliente**: Se envían credenciales de acceso

### Integración con Frontend

- **Notificaciones en tiempo real**: WebSocket o Server-Sent Events
- **Formulario público**: Endpoint `/contacto` sin autenticación
- **Dashboard admin**: Todos los endpoints privados

## Ejemplos de Uso

### Recibir formulario desde frontend

```javascript
const enviarCotizacion = async (formData) => {
  try {
    const response = await fetch("/api/cotizaciones/contacto", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (result.success) {
      console.log("Cotización enviada:", result.data.cotizacion.numero);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Error al enviar cotización:", error);
    throw error;
  }
};
```

### Listar cotizaciones con filtros

```javascript
const obtenerCotizaciones = async (filtros = {}) => {
  const params = new URLSearchParams(filtros);
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`/api/cotizaciones?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error al obtener cotizaciones:", error);
    throw error;
  }
};
```
