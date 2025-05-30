# API Electric Automatic Chile

API REST desarrollada con Express.js y TypeScript para la gestión de Electric Automatic Chile.

## 🚀 Características

- **Express.js** con TypeScript
- **Arquitectura MVC** (Modelos, Vistas, Controladores)
- **Rutas modulares** organizadas por entidades
- **Middleware de seguridad** (Helmet, CORS)
- **Manejo de errores** centralizado
- **Logging** con Morgan
- **Variables de entorno** con dotenv

## 📁 Estructura del Proyecto

```
├── controllers/          # Controladores de la aplicación
│   ├── UsuariosController.ts
│   ├── ProductosController.ts
│   ├── ClientesController.ts
│   └── VentasController.ts
├── middleware/           # Middlewares personalizados
│   └── errorHandler.ts
├── models/              # Interfaces y modelos TypeScript
│   ├── Usuario.ts
│   ├── Producto.ts
│   ├── Cliente.ts
│   └── Venta.ts
├── routes/              # Definición de rutas
│   ├── index.ts
│   ├── usuarios.ts
│   ├── productos.ts
│   ├── clientes.ts
│   └── ventas.ts
├── index.ts             # Punto de entrada de la aplicación
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd api-electricautomaticchile
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   Edita el archivo `.env` con tus configuraciones.

4. **Compilar TypeScript**
   ```bash
   npm run build
   ```

## 🚀 Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

## 📋 API Endpoints

### Health Check
- `GET /health` - Verificar estado de la API

### Usuarios
- `GET /api/usuarios` - Obtener todos los usuarios
- `GET /api/usuarios/:id` - Obtener usuario por ID
- `POST /api/usuarios` - Crear nuevo usuario
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario

### Productos
- `GET /api/productos` - Obtener todos los productos
- `GET /api/productos/:id` - Obtener producto por ID
- `POST /api/productos` - Crear nuevo producto
- `PUT /api/productos/:id` - Actualizar producto
- `DELETE /api/productos/:id` - Eliminar producto

### Clientes
- `GET /api/clientes` - Obtener todos los clientes
- `GET /api/clientes/:id` - Obtener cliente por ID
- `POST /api/clientes` - Crear nuevo cliente
- `PUT /api/clientes/:id` - Actualizar cliente
- `DELETE /api/clientes/:id` - Eliminar cliente

### Ventas
- `GET /api/ventas` - Obtener todas las ventas
- `GET /api/ventas/:id` - Obtener venta por ID
- `POST /api/ventas` - Crear nueva venta
- `PUT /api/ventas/:id` - Actualizar venta
- `DELETE /api/ventas/:id` - Cancelar venta

## 📋 Ejemplos de Uso

### Crear Usuario
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "telefono": "+56987654321",
    "rol": "vendedor"
  }'
```

### Crear Producto
```bash
curl -X POST http://localhost:3000/api/productos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Motor 24V",
    "descripcion": "Motor eléctrico 24V para portones",
    "precio": 200000,
    "categoria": "Motores",
    "stock": 5,
    "stockMinimo": 1,
    "marca": "ElectricPro",
    "modelo": "EP-24V-200"
  }'
```

## 🔧 Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipado estático
- **Cors** - Manejo de CORS
- **Helmet** - Seguridad HTTP
- **Morgan** - Logging HTTP
- **Dotenv** - Variables de entorno
- **Nodemon** - Desarrollo (hot reload)

## 📝 Notas de Desarrollo

- Los datos se almacenan actualmente en memoria (arrays)
- Para producción, implementar una base de datos real
- Los errores se manejan de forma centralizada
- Se utiliza "soft delete" para usuarios, productos y clientes
- Las ventas se marcan como "canceladas" en lugar de eliminarse

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 📞 Contacto

Electric Automatic Chile - info@electricautomatic.cl

Proyecto Link: [https://github.com/usuario/api-electricautomaticchile](https://github.com/usuario/api-electricautomaticchile) 