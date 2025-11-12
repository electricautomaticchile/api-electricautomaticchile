# API Documentation - Backend API

## Endpoints Principales

### Autenticación

#### POST /api/auth/login
Iniciar sesión de usuario.

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "refreshToken": "refresh_token",
  "user": {
    "id": "user_id",
    "email": "usuario@ejemplo.com",
    "role": "admin"
  }
}
```

#### POST /api/auth/refresh
Refrescar token de autenticación.

#### POST /api/auth/logout
Cerrar sesión.

### Cotizaciones

#### GET /api/cotizaciones
Listar todas las cotizaciones.

#### POST /api/cotizaciones
Crear nueva cotización.

#### GET /api/cotizaciones/:id
Obtener cotización específica.

#### PUT /api/cotizaciones/:id
Actualizar cotización.

#### DELETE /api/cotizaciones/:id
Eliminar cotización.

### Dispositivos IoT

#### GET /api/dispositivos
Listar dispositivos.

#### POST /api/dispositivos
Registrar nuevo dispositivo.

#### GET /api/dispositivos/:id
Obtener datos de dispositivo.

#### PUT /api/dispositivos/:id
Actualizar dispositivo.

### Reportes

#### GET /api/reportes
Obtener reportes del sistema.

#### GET /api/reportes/export
Exportar reportes (CSV/Excel).

### Health Check

#### GET /health
Verificar estado del servicio.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-10T...",
  "uptime": 12345
}
```

## Autenticación

Todos los endpoints (excepto `/auth/login` y `/health`) requieren autenticación JWT.

**Header requerido:**
```
Authorization: Bearer <jwt_token>
```

## Códigos de Estado

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
