# API de Tickets - Documentación

## Endpoints Disponibles

### POST /api/tickets

Crear un nuevo ticket de soporte

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "clienteId": "688e5ee1233c78b3e47c7155",
  "asunto": "Problema con el medidor",
  "descripcion": "El medidor muestra valores incorrectos",
  "categoria": "tecnico",
  "prioridad": "media",
  "dispositivoId": "673b0b8b8b8b8b8b8b8b8b8b"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Ticket creado exitosamente",
  "data": {
    "_id": "...",
    "numeroTicket": "TIC-2025-001",
    "clienteId": "...",
    "nombreCliente": "Juan Pérez",
    "numeroCliente": "629903-3",
    "asunto": "Problema con el medidor",
    "estado": "abierto",
    ...
  }
}
```

### GET /api/tickets

Obtener lista de tickets (con filtros y paginación)

**Query Params:**

- `clienteId` - Filtrar por cliente
- `empresaId` - Filtrar por empresa
- `estado` - Filtrar por estado (abierto, en-proceso, resuelto, cerrado)
- `categoria` - Filtrar por categoría
- `prioridad` - Filtrar por prioridad
- `page` - Número de página (default: 1)
- `limit` - Tickets por página (default: 10)

**Response:**

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### GET /api/tickets/:id

Obtener un ticket por ID

### GET /api/tickets/numero/:numeroTicket

Obtener un ticket por número (ej: TIC-2025-001)

### POST /api/tickets/:id/respuestas

Agregar una respuesta al ticket

**Body:**

```json
{
  "autorId": "688e5ee1233c78b3e47c7155",
  "autorNombre": "Carlos Mendoza",
  "autorTipo": "soporte",
  "mensaje": "Hemos revisado tu caso..."
}
```

### PUT /api/tickets/:id/estado

Actualizar el estado del ticket

**Body:**

```json
{
  "estado": "en-proceso"
}
```

Estados válidos: `abierto`, `en-proceso`, `resuelto`, `cerrado`

### PUT /api/tickets/:id/prioridad

Actualizar la prioridad del ticket

**Body:**

```json
{
  "prioridad": "alta"
}
```

Prioridades válidas: `baja`, `media`, `alta`, `urgente`

### PUT /api/tickets/:id/asignar

Asignar el ticket a un usuario

**Body:**

```json
{
  "asignadoA": "user_id",
  "asignadoNombre": "Carlos Mendoza"
}
```

### GET /api/tickets/estadisticas

Obtener estadísticas de tickets

**Query Params:**

- `empresaId` - Filtrar por empresa
- `clienteId` - Filtrar por cliente

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 50,
    "porEstado": {
      "abiertos": 10,
      "enProceso": 15,
      "resueltos": 20,
      "cerrados": 5
    },
    "porCategoria": {
      "tecnico": 25,
      "facturacion": 10,
      "consulta": 10,
      "reclamo": 5
    },
    "porPrioridad": {
      "baja": 15,
      "media": 20,
      "alta": 10,
      "urgente": 5
    }
  }
}
```

## Notificaciones Automáticas

El sistema envía emails automáticamente en los siguientes casos:

1. **Ticket Creado**
   - Email al cliente (confirmación)
   - Email al soporte (notificación)

2. **Nueva Respuesta**
   - Email al cliente (si responde soporte)
   - Email al soporte (si responde cliente)

3. **Cambio de Estado**
   - Email al cliente

4. **Ticket Cerrado**
   - Email al cliente (con encuesta de satisfacción)

## Variables de Entorno Requeridas

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=onboarding@resend.dev
SOPORTE_EMAIL=soporte@electricautomaticchile.com
FRONTEND_URL=http://localhost:3000
```
