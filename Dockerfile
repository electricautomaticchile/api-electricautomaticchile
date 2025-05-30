# Usar la imagen oficial de Node.js Alpine (más liviana)
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar el código fuente
COPY . .

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S apiuser -u 1001

# Cambiar propiedad de archivos al usuario no-root
RUN chown -R apiuser:nodejs /app
USER apiuser

# Exponer el puerto
EXPOSE 4000

# Comando para iniciar la aplicación
CMD ["npm", "start"] 