# Modelo Cotización

El modelo Cotización es el corazón del sistema, manejando todo el flujo desde formularios de contacto hasta la conversión a cliente.

## Esquema de Base de Datos

```javascript
{
  _id: ObjectId,
  numero: String,                    // Autogenerado: COT-YYYY-NNNN

  // Datos del formulario inicial
  nombre: String,                    // REQUERIDO
  email: String,                     // REQUERIDO
  empresa: String,
  telefono: String,
  servicio: String,                  // REQUERIDO - Enum
  plazo: String,                     // Enum
  mensaje: String,                   // REQUERIDO
  archivoUrl: String,
  archivo: String,
  archivoTipo: String,

  // Estados del flujo
  estado: String,                    // Default: 'pendiente'
  prioridad: String,                 // Auto-calculada según plazo

  // Datos de cotización (cuando se genera)
  titulo: String,
  descripcion: String,
  items: [{
    descripcion: String,
    cantidad: Number,
    precioUnitario: Number,
    subtotal: Number
  }],
  subtotal: Number,
  iva: Number,
  total: Number,
  validezDias: Number,               // Default: 30
  condicionesPago: String,

  // Referencias
  clienteId: ObjectId,               // Ref: Cliente
  asignadoA: ObjectId,              // Ref: Usuario

  // Metadatos
  fechaCreacion: Date,
  fechaActualizacion: Date,
  fechaCotizacion: Date,
  fechaAprobacion: Date,
  fechaConversion: Date,
  notas: String                      // Notas internas
}
```

## Enums y Valores Válidos

### Estados

- `pendiente` - Recién recibida
- `en_revision` - En proceso de revisión
- `cotizando` - Preparando cotización
- `cotizada` - Cotización lista
- `aprobada` - Aprobada por cliente
- `rechazada` - Rechazada
- `convertida_cliente` - Convertida a cliente

### Tipos de Servicio

- `cotizacion_reposicion` - Reposición de equipos
- `cotizacion_monitoreo` - Sistema de monitoreo
- `cotizacion_mantenimiento` - Servicio de mantenimiento
- `cotizacion_completa` - Servicio completo

### Prioridades

- `baja` - Planificación a largo plazo
- `media` - Normal (default)
- `alta` - Pronto
- `critica` - Urgente

### Plazos

- `urgente` → Prioridad crítica
- `pronto` → Prioridad alta
- `normal` → Prioridad media
- `planificacion` → Prioridad baja

## Validaciones

### Campos Requeridos

- `nombre`: máx. 100 caracteres
- `email`: formato válido
- `servicio`: debe ser uno de los enums
- `mensaje`: máx. 1000 caracteres

### Validaciones de Negocio

- El `numero` se genera automáticamente si no se proporciona
- La `prioridad` se calcula automáticamente basada en `plazo`
- Los campos de cotización (`items`, `total`) son opcionales hasta el estado 'cotizada'

## Índices de Base de Datos

```javascript
// Índices únicos
{ numero: 1 }

// Índices de consulta
{ email: 1 }
{ estado: 1 }
{ prioridad: 1 }
{ servicio: 1 }
{ fechaCreacion: -1 }
{ asignadoA: 1 }
{ clienteId: 1 }

// Índice de búsqueda de texto
{
  nombre: 'text',
  email: 'text',
  empresa: 'text',
  titulo: 'text',
  descripcion: 'text'
}
```

## Métodos del Modelo

### Métodos Estáticos

#### `findPendientes()`

Encuentra cotizaciones pendientes de revisión ordenadas por prioridad.

#### `findPorEstado(estado)`

Encuentra cotizaciones por estado específico.

#### `estadisticas()`

Retorna estadísticas agregadas por estado y valor total.

### Middleware Pre-save

```javascript
// Actualiza fechas automáticamente según cambio de estado
if (this.isModified("estado")) {
  switch (this.estado) {
    case "cotizada":
      this.fechaCotizacion = new Date();
      break;
    case "aprobada":
      this.fechaAprobacion = new Date();
      break;
    case "convertida_cliente":
      this.fechaConversion = new Date();
      break;
  }
}
```

## Colección en MongoDB

**Nombre de colección**: `contactoformularios`

> Nota: Mantiene compatibilidad con formularios existentes

## Interfaces TypeScript

### ICrearCotizacion

```typescript
interface ICrearCotizacion {
  nombre: string;
  email: string;
  empresa?: string;
  telefono?: string;
  servicio:
    | "cotizacion_reposicion"
    | "cotizacion_monitoreo"
    | "cotizacion_mantenimiento"
    | "cotizacion_completa";
  plazo?: "urgente" | "pronto" | "normal" | "planificacion";
  mensaje: string;
  archivoUrl?: string;
  archivo?: string;
  archivoTipo?: string;
}
```

### IActualizarCotizacion

```typescript
interface IActualizarCotizacion {
  estado?: string;
  prioridad?: string;
  titulo?: string;
  descripcion?: string;
  items?: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
  subtotal?: number;
  iva?: number;
  total?: number;
  validezDias?: number;
  condicionesPago?: string;
  asignadoA?: string;
  notas?: string;
}
```

## Ejemplos de Uso

### Crear Cotización desde Formulario

```javascript
const nuevaCotizacion = new Cotizacion({
  nombre: "Juan Pérez",
  email: "juan@empresa.com",
  servicio: "cotizacion_completa",
  mensaje: "Necesito instalación eléctrica",
  plazo: "normal",
});

await nuevaCotizacion.save();
// Estado: 'pendiente', Prioridad: 'media' (auto-calculada)
```

### Agregar Datos de Cotización

```javascript
await Cotizacion.findByIdAndUpdate(id, {
  estado: "cotizada",
  titulo: "Instalación Industrial",
  items: [
    {
      descripcion: "Tablero Principal",
      cantidad: 1,
      precioUnitario: 850000,
      subtotal: 850000,
    },
  ],
  subtotal: 850000,
  iva: 161500,
  total: 1011500,
});
```

### Consultas Comunes

```javascript
// Cotizaciones pendientes por prioridad
const pendientes = await Cotizacion.findPendientes();

// Estadísticas del dashboard
const stats = await Cotizacion.estadisticas();

// Búsqueda de texto
const resultados = await Cotizacion.find({
  $text: { $search: "instalación eléctrica" },
});

// Filtros combinados
const filtradas = await Cotizacion.find({
  estado: "pendiente",
  prioridad: { $in: ["alta", "critica"] },
  fechaCreacion: { $gte: new Date("2024-01-01") },
}).sort({ prioridad: -1, fechaCreacion: -1 });
```
