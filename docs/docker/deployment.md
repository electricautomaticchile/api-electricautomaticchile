# Docker y Deployment

Guía completa para el deployment de la API ElectricAutomaticChile usando Docker.

## 🏗️ Arquitectura Docker

### Multi-stage Build

El `Dockerfile` utiliza multi-stage build para optimizar el tamaño y seguridad:

```dockerfile
# Stage 1: Build
FROM node:22.13.1-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22.13.1-slim AS final
WORKDIR /app
# Solo copia archivos necesarios
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
```

### Optimizaciones

- **Usuario no-root**: `appuser` para seguridad
- **Cache de dependencias**: Optimizado para rebuilds rápidos
- **Tamaño mínimo**: Solo archivos de producción
- **Memory limit**: `--max-old-space-size=4096`

## 🐳 Docker Compose

### Servicios

#### API Service

```yaml
api-electricautomatic:
  container_name: api-electricautomatic
  build: .
  restart: unless-stopped
  init: true
  ports:
    - "4000:4000"
  environment:
    - NODE_ENV=production
    - MONGODB_URI=mongodb://root:example@mongo:27017/electricautomatic?authSource=admin
  depends_on:
    mongo:
      condition: service_healthy
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

#### MongoDB Service

```yaml
mongo:
  container_name: mongo-electricautomatic
  image: mongo:7.0
  restart: unless-stopped
  ports:
    - "27017:27017"
  environment:
    MONGO_INITDB_ROOT_USERNAME: root
    MONGO_INITDB_ROOT_PASSWORD: example
    MONGO_INITDB_DATABASE: electricautomatic
  volumes:
    - mongo-data:/data/db
    - ./docker/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
  healthcheck:
    test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
    interval: 10s
    timeout: 5s
    retries: 5
```

## 🚀 Deployment

### 1. Desarrollo Local

```bash
# Clonar repositorio
git clone <repository-url>
cd api-electricautomaticchile

# Configurar variables de entorno
cp .env.example .env
# Editar .env con configuraciones locales

# Iniciar con Docker Compose
docker-compose up --build

# O solo MongoDB y ejecutar API local
docker-compose up mongo
npm run dev
```

### 2. Producción

#### Con Docker Compose

```bash
# Producción completa
docker-compose -f compose.yaml up -d --build

# Verificar servicios
docker-compose ps
docker-compose logs api-electricautomatic
```

#### Solo Container API

```bash
# Build imagen
docker build -t api-electricautomatic:latest .

# Ejecutar con variables de entorno
docker run -d \
  --name api-electricautomatic \
  --restart unless-stopped \
  -p 4000:4000 \
  --env-file .env \
  api-electricautomatic:latest
```

### 3. AWS App Runner

El proyecto incluye `apprunner.yaml` para deployment automático:

```yaml
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "Build completed"
run:
  runtime-version: latest
  command: npm start
  network:
    port: 4000
    env: PORT
  env:
    - name: NODE_ENV
      value: production
```

#### Configuración en AWS

1. **Crear servicio App Runner**
2. **Conectar repositorio GitHub**
3. **Configurar variables de entorno**:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `RESEND_API_KEY`
   - `FRONTEND_URL`

## 🔧 Variables de Entorno

### Archivo .env Ejemplo

```env
# Base de datos
MONGODB_URI=mongodb://localhost:27017/electricautomatic

# JWT Secrets
JWT_SECRET=tu_jwt_secret_super_seguro_minimo_32_caracteres
JWT_REFRESH_SECRET=tu_refresh_secret_super_seguro_minimo_32_caracteres

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx

# CORS - Frontend URLs
FRONTEND_URL=https://electricautomaticchile.com

# Servidor
PORT=4000
NODE_ENV=production

# MongoDB Atlas (Producción)
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/electricautomatic?retryWrites=true&w=majority
```

### Variables por Entorno

#### Desarrollo

```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/electricautomatic
FRONTEND_URL=http://localhost:3000
```

#### Producción

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/electricautomatic
FRONTEND_URL=https://electricautomaticchile.com
```

## 🔍 Health Checks

### Endpoint de Health Check

```javascript
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

### Docker Health Checks

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## 📊 Monitoring y Logs

### Ver Logs

```bash
# Docker Compose
docker-compose logs -f api-electricautomatic

# Docker container
docker logs -f api-electricautomatic

# Con timestamps
docker logs -f --timestamps api-electricautomatic
```

### Métricas del Sistema

```bash
# Uso de recursos
docker stats api-electricautomatic

# Información del container
docker inspect api-electricautomatic
```

## 🔒 Seguridad

### Container Security

- **Usuario no-root**: Ejecuta como `appuser`
- **Read-only filesystem**: Para archivos de aplicación
- **Minimal base image**: `node:slim`
- **No shell access**: En producción

### Network Security

- **Internal network**: Comunicación entre containers
- **Exposed ports**: Solo los necesarios
- **CORS configurado**: Dominios específicos

## 🛠️ Maintenance

### Backup MongoDB

```bash
# Backup
docker exec mongo-electricautomatic mongodump --out /backup

# Restore
docker exec mongo-electricautomatic mongorestore /backup
```

### Actualizar Aplicación

```bash
# Pull cambios
git pull origin main

# Rebuild y restart
docker-compose up -d --build api-electricautomatic

# Verificar
curl http://localhost:4000/health
```

### Limpiar Sistema

```bash
# Limpiar containers parados
docker container prune

# Limpiar imágenes no utilizadas
docker image prune

# Limpiar todo (cuidado en producción)
docker system prune -a
```

## 🚨 Troubleshooting

### Problemas Comunes

#### Container no inicia

```bash
# Ver logs
docker-compose logs api-electricautomatic

# Verificar variables de entorno
docker-compose config

# Verificar salud de MongoDB
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"
```

#### Error de conexión MongoDB

```bash
# Verificar network
docker network ls
docker network inspect api-electricautomaticchile_backend

# Test conexión
docker-compose exec api-electricautomatic curl mongo:27017
```

#### Performance Issues

```bash
# Monitorear recursos
docker stats

# Verificar logs de memoria
docker logs api-electricautomatic 2>&1 | grep -i memory

# Ajustar limits
docker-compose.yaml:
  deploy:
    resources:
      limits:
        memory: 1G
        cpus: '0.5'
```

## 📈 Scaling

### Horizontal Scaling

```yaml
# docker-compose.scale.yaml
api-electricautomatic:
  scale: 3
  environment:
    - NODE_ENV=production
  deploy:
    replicas: 3
```

### Load Balancer

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
  depends_on:
    - api-electricautomatic
```

### Production Checklist

- [ ] Variables de entorno configuradas
- [ ] HTTPS configurado (nginx/cloudflare)
- [ ] MongoDB Atlas con backup automático
- [ ] Logs centralizados
- [ ] Monitoring configurado
- [ ] Health checks funcionando
- [ ] CORS configurado para producción
- [ ] Secrets seguros (no en código)
