# Backend API - Electric Automatic Chile

API REST principal del sistema que maneja toda la lógica de negocio, autenticación y base de datos.

## 🎯 ¿Para qué sirve?

Este servicio es el **cerebro del sistema**. Maneja:
- Autenticación y autorización de usuarios
- Gestión de cotizaciones y servicios
- Administración de dispositivos IoT
- Reportes y analítica
- Integración con servicios externos

## 🔌 ¿Cómo se conecta con los otros proyectos?

```
Frontend (Puerto 3000)
    ↓ HTTP/REST
Backend API (Puerto 4000) ← Tú estás aquí
    ↓ HTTP
WebSocket API (Puerto 5000)
```

- **Frontend → Backend**: Recibe todas las peticiones HTTP (login, cotizaciones, etc.)
- **Backend → WebSocket**: Envía notificaciones para que lleguen en tiempo real al frontend
- **Backend → MongoDB**: Guarda y consulta todos los datos

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env.local
# Editar .env.local con tus valores
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

### 4. Build para producción
```bash
npm run build
npm start
```

## 📡 Endpoints Principales

- `POST /api/auth/login` - Iniciar sesión
- `GET /api/cotizaciones` - Listar cotizaciones
- `POST /api/dispositivos` - Crear dispositivo
- `GET /api/reportes` - Obtener reportes
- `GET /health` - Health check

## ⚙️ Variables de Entorno Importantes

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `JWT_SECRET` | Secret para tokens (debe ser igual en WebSocket) | ✅ Sí |
| `MONGODB_URI` | URL de MongoDB | ✅ Sí |
| `WS_API_URL` | URL del WebSocket API | ✅ Sí |
| `FRONTEND_URL` | URL del Frontend | ✅ Sí |

## 📚 Documentación Adicional

Ver carpeta `docs/` para documentación detallada.
