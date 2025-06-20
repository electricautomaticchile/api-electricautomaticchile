# Endpoints de Autenticación

La API utiliza JWT (JSON Web Tokens) para la autenticación. Los usuarios pueden autenticarse usando email o número de cliente.

## Base URL

```
/api/auth
```

## Endpoints

### POST /login

Iniciar sesión en el sistema.

#### Request

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",     // o número de cliente
  "password": "mi_password"
}
```

#### Parámetros

| Campo      | Tipo   | Requerido | Descripción                           |
| ---------- | ------ | --------- | ------------------------------------- |
| `email`    | string | ✅        | Email del usuario o número de cliente |
| `password` | string | ✅        | Contraseña del usuario                |

#### Response Exitoso (200)

```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "_id": "607d1f77bcf86cd799a2a4e5",
      "nombre": "Juan Pérez",
      "email": "juan@empresa.com",
      "numeroCliente": "CLI-2024-0001",
      "tipoUsuario": "cliente",
      "role": "cliente",
      "activo": true,
      "fechaCreacion": "2024-01-15T10:30:00Z",
      "ultimoAcceso": "2024-01-20T14:22:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Errores Comunes

- **400**: Credenciales faltantes
- **401**: Credenciales inválidas o cuenta inactiva
- **500**: Error interno del servidor

---

### POST /register

Registrar un nuevo usuario en el sistema.

#### Request

```http
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "María González",
  "email": "maria@empresa.com",
  "password": "password123",
  "telefono": "+56912345678",
  "tipoUsuario": "cliente",
  "empresaId": "607d1f77bcf86cd799a2a4e6"
}
```

#### Parámetros

| Campo         | Tipo   | Requerido | Descripción                              |
| ------------- | ------ | --------- | ---------------------------------------- |
| `nombre`      | string | ✅        | Nombre completo del usuario              |
| `email`       | string | ✅        | Email único del usuario                  |
| `password`    | string | ✅        | Contraseña (mínimo 6 caracteres)         |
| `telefono`    | string | ❌        | Número de teléfono                       |
| `tipoUsuario` | string | ✅        | Tipo: `superadmin`, `empresa`, `cliente` |
| `empresaId`   | string | ❌        | ID de la empresa (si aplica)             |

#### Response Exitoso (201)

```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "usuario": {
      "id": "607d1f77bcf86cd799a2a4e7",
      "nombre": "María González",
      "email": "maria@empresa.com",
      "tipoUsuario": "cliente",
      "rol": "cliente"
    }
  }
}
```

#### Errores Comunes

- **400**: Datos de validación faltantes o email ya registrado
- **500**: Error interno del servidor

---

### POST /logout

Cerrar sesión (principalmente para limpiar estado en el cliente).

#### Request

```http
POST /api/auth/logout
```

#### Response Exitoso (200)

```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

---

### GET /me

Obtener información del usuario autenticado actual.

#### Request

```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": {
    "_id": "607d1f77bcf86cd799a2a4e5",
    "nombre": "Juan Pérez",
    "email": "juan@empresa.com",
    "numeroCliente": "CLI-2024-0001",
    "telefono": "+56912345678",
    "role": "cliente",
    "tipoUsuario": "cliente",
    "activo": true,
    "fechaCreacion": "2024-01-15T10:30:00Z",
    "ultimoAcceso": "2024-01-20T14:22:00Z"
  }
}
```

#### Errores Comunes

- **401**: Token no proporcionado, inválido o expirado
- **404**: Usuario no encontrado
- **500**: Error interno del servidor

---

### POST /refresh-token

Renovar el token de acceso usando el refresh token.

#### Request

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Parámetros

| Campo          | Tipo   | Requerido | Descripción          |
| -------------- | ------ | --------- | -------------------- |
| `refreshToken` | string | ✅        | Refresh token válido |

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Errores Comunes

- **400**: Refresh token requerido
- **401**: Refresh token inválido o usuario inactivo
- **500**: Error interno del servidor

## Tipos de Usuario

### Roles Disponibles

| Rol          | Descripción               | Permisos                           |
| ------------ | ------------------------- | ---------------------------------- |
| `superadmin` | Administrador del sistema | Acceso completo                    |
| `admin`      | Administrador de empresa  | Gestión de cotizaciones y clientes |
| `vendedor`   | Vendedor                  | Acceso a cotizaciones asignadas    |
| `cliente`    | Cliente final             | Acceso a sus propias cotizaciones  |

### Tipos de Usuario

| Tipo         | Descripción               |
| ------------ | ------------------------- |
| `superadmin` | Control total del sistema |
| `empresa`    | Usuario de empresa        |
| `cliente`    | Cliente final             |

## Autenticación por Número de Cliente

Los clientes pueden autenticarse usando su número de cliente en lugar del email:

```json
{
  "email": "CLI-2024-0001", // Número de cliente
  "password": "mi_password"
}
```

## Seguridad

### JWT Token

- **Duración**: 24 horas
- **Algoritmo**: HS256
- **Payload**: Incluye `userId`, `clienteId`, `role`, `tipoUsuario`

### Refresh Token

- **Duración**: 7 días
- **Uso**: Renovar tokens de acceso
- **Seguridad**: Se invalida al cambiar contraseña

### Contraseñas

- **Encriptación**: bcrypt con salt rounds de 12
- **Validación**: Mínimo 6 caracteres
- **Temporales**: Soporta contraseñas temporales para nuevos clientes

## Ejemplos de Uso

### Login básico con JavaScript

```javascript
const login = async (email, password) => {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      // Guardar tokens
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      return data.data.user;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Error en login:", error);
    throw error;
  }
};
```

### Usar token en requests

```javascript
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};
```
