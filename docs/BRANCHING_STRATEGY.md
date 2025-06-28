# Estrategia de Branching - Electric Automatic Chile API

## 📋 Resumen

Este documento define la estrategia de branching para el proyecto API de Electric Automatic Chile, basada en Git Flow con adaptaciones específicas para nuestro flujo de trabajo.

## 🌿 Estructura de Ramas

### Ramas Principales

#### `main`

- **Propósito**: Contiene el código en producción
- **Protecciones**:
  - Requiere revisión de código (Pull Request)
  - Requiere que pasen todos los tests
  - Solo administradores pueden hacer merge
- **Deploy**: Automático a producción

#### `develop`

- **Propósito**: Rama de desarrollo principal donde se integran las nuevas características
- **Protecciones**: Requiere revisión de código
- **Deploy**: Automático a entorno de desarrollo

#### `staging`

- **Propósito**: Pruebas de integración antes de producción
- **Protecciones**: Requiere revisión de código
- **Deploy**: Automático a entorno de staging

### Ramas de Trabajo

#### `feature/*`

- **Propósito**: Desarrollo de nuevas características
- **Convención**: `feature/[nombre-caracteristica]`
- **Ejemplos**:
  - `feature/arduino-integration`
  - `feature/payment-gateway`
  - `feature/user-notifications`
- **Flujo**:
  1. Se crea desde `develop`
  2. Se trabaja en la característica
  3. Se hace Pull Request a `develop`
  4. Se elimina después del merge

#### `bugfix/*`

- **Propósito**: Corrección de errores no críticos
- **Convención**: `bugfix/[numero-issue]-[descripcion-breve]`
- **Ejemplos**:
  - `bugfix/123-login-validation`
  - `bugfix/456-email-template`
- **Flujo**:
  1. Se crea desde `develop`
  2. Se corrige el error
  3. Se hace Pull Request a `develop`

#### `hotfix/*`

- **Propósito**: Correcciones urgentes en producción
- **Convención**: `hotfix/[numero-issue]-[descripcion]`
- **Ejemplos**:
  - `hotfix/789-security-patch`
  - `hotfix/012-database-connection`
- **Flujo**:
  1. Se crea desde `main`
  2. Se corrige el error crítico
  3. Se hace Pull Request a `main` Y `develop`

#### `release/*`

- **Propósito**: Preparar nuevas versiones
- **Convención**: `release/v[X.Y.Z]`
- **Ejemplos**:
  - `release/v1.1.0`
  - `release/v2.0.0`
- **Flujo**:
  1. Se crea desde `develop`
  2. Se realizan ajustes finales
  3. Se actualiza versión en package.json
  4. Se hace Pull Request a `main`
  5. Se tagea la versión en `main`
  6. Se hace merge back a `develop`

#### `test/*`

- **Propósito**: Pruebas específicas o experimentales
- **Convención**: `test/[nombre-prueba]`
- **Ejemplos**:
  - `test/performance-optimization`
  - `test/new-database-driver`

## 🔄 Flujos de Trabajo

### Desarrollo de Nueva Característica

```bash
# 1. Actualizar develop
git checkout develop
git pull origin develop

# 2. Crear rama de feature
git checkout -b feature/nombre-caracteristica

# 3. Desarrollar y commitear
git add .
git commit -m "feat: descripción de la característica"

# 4. Subir rama
git push -u origin feature/nombre-caracteristica

# 5. Crear Pull Request a develop
```

### Corrección de Bug

```bash
# 1. Crear rama de bugfix
git checkout develop
git pull origin develop
git checkout -b bugfix/123-descripcion-bug

# 2. Corregir y commitear
git add .
git commit -m "fix: descripción de la corrección"

# 3. Subir y crear PR
git push -u origin bugfix/123-descripcion-bug
```

### Hotfix de Producción

```bash
# 1. Crear rama de hotfix desde main
git checkout main
git pull origin main
git checkout -b hotfix/456-descripcion-urgente

# 2. Corregir y commitear
git add .
git commit -m "hotfix: descripción de la corrección urgente"

# 3. Subir rama
git push -u origin hotfix/456-descripcion-urgente

# 4. Crear PR a main y develop
```

### Release

```bash
# 1. Crear rama de release
git checkout develop
git pull origin develop
git checkout -b release/v1.1.0

# 2. Actualizar versión
npm version 1.1.0

# 3. Commitear cambios de versión
git add .
git commit -m "chore: bump version to 1.1.0"

# 4. Subir y crear PR a main
git push -u origin release/v1.1.0
```

## 📝 Convenciones de Commits

Seguimos la convención de [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva característica
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato (no afectan el código)
- `refactor:` Refactoring de código
- `test:` Agregar o modificar tests
- `chore:` Tareas de mantenimiento

### Ejemplos:

```
feat: add JWT authentication middleware
fix: resolve database connection timeout
docs: update API documentation
refactor: optimize device data processing
test: add unit tests for user controller
chore: update dependencies
```

## ⚡ Comandos Útiles

### Ver todas las ramas

```bash
git branch -a
```

### Cambiar de rama

```bash
git checkout nombre-rama
```

### Crear y cambiar a nueva rama

```bash
git checkout -b nueva-rama
```

### Eliminar rama local

```bash
git branch -d nombre-rama
```

### Eliminar rama remota

```bash
git push origin --delete nombre-rama
```

### Sincronizar con remoto

```bash
git fetch --prune
```

## 🛡️ Reglas de Protección

### Rama `main`

- ✅ Requiere Pull Request
- ✅ Requiere revisión de al menos 1 persona
- ✅ Requiere que pasen todos los status checks
- ✅ Requiere que la rama esté actualizada
- ✅ Incluye administradores en las restricciones

### Rama `develop`

- ✅ Requiere Pull Request
- ✅ Requiere que pasen todos los status checks
- ✅ Permite merge directo para administradores

### Rama `staging`

- ✅ Requiere Pull Request
- ✅ Requiere que pasen todos los status checks

## 📋 Lista de Verificación para Pull Requests

### Antes de crear el PR:

- [ ] El código está actualizado con la rama base
- [ ] Todos los tests pasan localmente
- [ ] El código sigue las convenciones del proyecto
- [ ] Se agregó documentación si es necesario
- [ ] Se actualizó el CHANGELOG si aplica

### Template de PR:

```markdown
## Descripción

Descripción breve de los cambios realizados.

## Tipo de cambio

- [ ] Bug fix (cambio que corrige un issue)
- [ ] Nueva característica (cambio que agrega funcionalidad)
- [ ] Breaking change (cambio que puede romper funcionalidad existente)
- [ ] Documentación

## ¿Cómo se ha probado?

- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Pruebas manuales

## Checklist:

- [ ] Mi código sigue las convenciones del proyecto
- [ ] He realizado una auto-revisión de mi código
- [ ] He comentado mi código, especialmente en áreas difíciles de entender
- [ ] He agregado tests que prueban mi cambio
- [ ] Los tests nuevos y existentes pasan localmente
```

## 🚀 CI/CD Integration

### GitHub Actions

- **develop**: Deploy automático a desarrollo
- **staging**: Deploy automático a staging
- **main**: Deploy automático a producción con confirmación manual

### Status Checks Required:

- ✅ Tests unitarios
- ✅ Tests de integración
- ✅ Linting
- ✅ Build exitoso
- ✅ Security scan

---

**Última actualización**: $(date)
**Versión del documento**: 1.0.0
