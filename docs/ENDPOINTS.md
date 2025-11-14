# Endpoints - API Backend

## 🔐 Autenticación

### POST /api/auth/login

Autenticar usuario

**Body:**

```json
{
  "email": "cliente@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "688e5ee1233c78b3e47c7155",
    "email": "cliente@example.com",
    "role": "cliente",
    "type": "cliente"
  }
}
```

### GET /api/auth/me

Obtener usuario actual

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "user": {
    "_id": "688e5ee1233c78b3e47c7155",
    "nombre": "Test Cliente",
    "email": "cliente@example.com",
    "numeroCliente": "629903-3"
  }
}
```

## 👥 Clientes

### GET /api/clientes

Listar todos los clientes

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "688e5ee1233c78b3e47c7155",
      "nombre": "Test Cliente",
      "numeroCliente": "629903-3",
      "email": "cliente@example.com",
      "dispositivoAsignado": "629903-3"
    }
  ]
}
```

### GET /api/clientes/:id

Obtener cliente por ID

### GET /api/clientes/numero/:numeroCliente

Obtener cliente por número

### GET /api/clientes/mi-dispositivo

Obtener dispositivo asignado al cliente autenticado

**Response:**

```json
{
  "success": true,
  "data": {
    "dispositivoId": "629903-3",
    "clienteNombre": "Test Cliente"
  }
}
```

### POST /api/clientes

Crear nuevo cliente

**Body:**

```json
{
  "nombre": "Nuevo Cliente",
  "numeroCliente": "123456-7",
  "email": "nuevo@example.com",
  "password": "password123",
  "direccion": "Calle 123",
  "telefono": "+56912345678"
}
```

### PUT /api/clientes/:id

Actualizar cliente

### DELETE /api/clientes/:id

Eliminar cliente

## 🔌 Dispositivos

### GET /api/dispositivos

Listar todos los dispositivos

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "673b0b8b8b8b8b8b8b8b8b8b",
      "numeroDispositivo": "629903-3",
      "nombre": "Arduino 629903-3",
      "tipo": "arduino_uno",
      "estado": "activo",
      "clienteAsignado": "688e5ee1233c78b3e47c7155",
      "ultimaLectura": {
        "voltage": 220,
        "current": 0.5,
        "activePower": 110,
        "energy": 0.055,
        "cost": 8.25,
        "timestamp": "2025-11-13T23:57:36.785Z"
      }
    }
  ]
}
```

### GET /api/dispositivos/numero/:numeroDispositivo

Obtener dispositivo por número

### POST /api/dispositivos

Crear nuevo dispositivo

**Body:**

```json
{
  "numeroDispositivo": "629903-3",
  "nombre": "Arduino 629903-3",
  "tipo": "arduino_uno",
  "estado": "activo",
  "clienteAsignado": "688e5ee1233c78b3e47c7155",
  "configuracion": {
    "voltajeNominal": 220,
    "corrienteMaxima": 10,
    "potenciaMaxima": 2200,
    "tarifaKwh": 150
  }
}
```

### PUT /api/dispositivos/numero/:numeroDispositivo/ultima-lectura

Actualizar última lectura del dispositivo

**Body:**

```json
{
  "voltage": 220,
  "current": 0.5,
  "activePower": 110,
  "energy": 0.055,
  "cost": 8.25
}
```

### PUT /api/dispositivos/:id

Actualizar dispositivo

### DELETE /api/dispositivos/:id

Eliminar dispositivo

## 📊 Estadísticas

### GET /api/estadisticas/consumo-electrico/:clienteId

Obtener estadísticas de consumo

**Query Params:**

- `periodo`: `mensual` | `diario` | `horario`
- `año`: number (ej: 2023)
- `mes`: number (0-11, solo para periodo diario)

**Response:**

```json
{
  "success": true,
  "data": {
    "periodo": "mensual",
    "fechaInicio": "2023-01-01",
    "fechaFin": "2023-12-31",
    "consumoActual": 150.5,
    "costoEstimado": 22575,
    "consumoPromedio": 145.2,
    "consumoMaximo": 180.3,
    "consumoMinimo": 120.1,
    "tarifaKwh": 150,
    "datosGrafico": [
      { "mes": "Enero", "consumo": 145.2 },
      { "mes": "Febrero", "consumo": 138.5 }
    ],
    "resumen": {
      "dispositivosActivos": 1,
      "ultimaActualizacion": "2025-11-13T23:57:36.785Z",
      "tendencia": "Estable"
    }
  }
}
```

## 🏢 Empresas

### GET /api/empresas

Listar empresas

### GET /api/empresas/:id

Obtener empresa por ID

### POST /api/empresas

Crear empresa

### PUT /api/empresas/:id

Actualizar empresa

### DELETE /api/empresas/:id

Eliminar empresa

## 👨‍💼 Superusuarios

### GET /api/superusuarios

Listar superusuarios

### POST /api/superusuarios

Crear superusuario

### PUT /api/superusuarios/:id

Actualizar superusuario

### DELETE /api/superusuarios/:id

Eliminar superusuario

## ❌ Códigos de Error

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
