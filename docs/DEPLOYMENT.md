# Deployment - Backend API

## AWS App Runner

### 1. Configuración

El proyecto incluye `apprunner.yaml` para deployment automático.

### 2. Variables de Entorno en AWS

Configurar en AWS App Runner:

```bash
NODE_ENV=production
PORT=8080
MONGODB_URI=<mongodb_uri>
JWT_SECRET=<jwt_secret>
JWT_REFRESH_SECRET=<refresh_secret>
WS_API_URL=<websocket_api_url>
FRONTEND_URL=<frontend_url>
RESEND_API_KEY=<resend_key>
```

### 3. Build

```bash
npm ci
npm run build
```

### 4. Start

```bash
npm start
```

## Health Check

AWS App Runner verificará `/health` cada 30 segundos.

## Logs

Los logs están disponibles en AWS CloudWatch.
