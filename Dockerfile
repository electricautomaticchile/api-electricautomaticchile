# Usar la imagen oficial de Node.js Alpine (más liviana)
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar todas las dependencias (incluyendo devDependencies para compilar)
RUN npm ci && npm cache clean --force

# Copiar el código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Remover dependencias de desarrollo para reducir tamaño
RUN npm prune --production

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S apiuser -u 1001

# Cambiar propiedad de archivos al usuario no-root
RUN chown -R apiuser:nodejs /app
USER apiuser

# Exponer el puerto (App Runner espera que la app escuche en el puerto definido por la variable PORT)
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["npm", "start"] 