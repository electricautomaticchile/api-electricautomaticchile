# Deployment - API Backend

## 🚀 Deployment en Producción

### Railway / Render (Recomendado)

1. Conecta tu repositorio de GitHub
2. Configura las variables de entorno
3. Deploy automático en cada push

### VPS (Ubuntu/Debian)

```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clonar repositorio
git clone <repo-url>
cd api-electricautomaticchile

# Instalar dependencias
npm install

# Build
npm run build

# Instalar PM2
npm install -g pm2

# Iniciar con PM2
pm2 start dist/index.js --name "electric-api"
pm2 save
pm2 startup
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

```bash
docker build -t electric-api .
docker run -p 4000:4000 --env-file .env electric-api
```

## 🔧 Variables de Entorno

### Producción

```env
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/electricautomaticchile
JWT_SECRET=super_secret_key_minimo_32_caracteres
NODE_ENV=production
CORS_ORIGIN=https://tudominio.com,https://www.tudominio.com
```

## 🗄️ Base de Datos

### MongoDB Atlas (Recomendado)

1. Crear cluster en MongoDB Atlas
2. Configurar IP whitelist (0.0.0.0/0 para producción)
3. Crear usuario de base de datos
4. Obtener connection string

### Backup

```bash
# Backup
mongodump --uri="mongodb+srv://..." --out=./backup

# Restore
mongorestore --uri="mongodb+srv://..." ./backup
```

## 🔒 Seguridad

- Rate limiting configurado (100 requests/15min)
- Helmet.js para headers de seguridad
- CORS configurado para dominios específicos
- Validación de inputs con express-validator
- Passwords hasheados con bcrypt (10 rounds)

## 📊 Monitoreo

```bash
# Logs con PM2
pm2 logs electric-api

# Monitoreo
pm2 monit

# Status
pm2 status
```

## 🔄 CI/CD

### GitHub Actions

```yaml
name: Deploy API
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - run: npm test
      # Deploy steps...
```
