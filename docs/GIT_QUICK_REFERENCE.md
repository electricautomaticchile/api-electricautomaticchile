# Git - Referencia Rápida 🚀

## 📋 Comandos Esenciales

### Gestión de Ramas

```bash
# Ver todas las ramas (locales y remotas)
git branch -a

# Ver solo ramas locales
git branch

# Ver solo ramas remotas
git branch -r

# Crear nueva rama
git checkout -b nombre-rama

# Cambiar de rama
git checkout nombre-rama

# Eliminar rama local
git branch -d nombre-rama

# Eliminar rama local (forzado)
git branch -D nombre-rama

# Eliminar rama remota
git push origin --delete nombre-rama

# Sincronizar ramas remotas
git fetch --prune
```

### Flujo de Trabajo Diario

```bash
# Estado actual del repositorio
git status

# Ver diferencias
git diff

# Agregar archivos al staging
git add .
git add archivo.js

# Hacer commit
git commit -m "feat: descripción del cambio"

# Subir cambios
git push

# Bajar cambios
git pull

# Subir nueva rama
git push -u origin nombre-rama
```

### Sincronización con Remoto

```bash
# Actualizar develop desde remoto
git checkout develop
git pull origin develop

# Actualizar main desde remoto
git checkout main
git pull origin main

# Traer todos los cambios remotos
git fetch --all

# Ver diferencias con remoto
git diff origin/develop
```

## 🔄 Flujos de Branching

### Crear Feature Branch

```bash
# 1. Ir a develop y actualizar
git checkout develop
git pull origin develop

# 2. Crear nueva rama de feature
git checkout -b feature/nombre-caracteristica

# 3. Trabajar y hacer commits
git add .
git commit -m "feat: implementar nueva característica"

# 4. Subir rama
git push -u origin feature/nombre-caracteristica

# 5. Crear Pull Request en GitHub
```

### Hacer Hotfix

```bash
# 1. Ir a main y actualizar
git checkout main
git pull origin main

# 2. Crear rama de hotfix
git checkout -b hotfix/123-descripcion-urgente

# 3. Corregir y commitear
git add .
git commit -m "hotfix: corregir problema crítico"

# 4. Subir rama
git push -u origin hotfix/123-descripcion-urgente

# 5. Crear PR a main y develop
```

### Merge de Release

```bash
# 1. Crear rama de release desde develop
git checkout develop
git pull origin develop
git checkout -b release/v1.1.0

# 2. Actualizar versión
npm version 1.1.0

# 3. Commit de versión
git add .
git commit -m "chore: bump version to 1.1.0"

# 4. Subir y crear PR a main
git push -u origin release/v1.1.0
```

## 🔧 Comandos Avanzados

### Historial y Logs

```bash
# Ver historial de commits
git log --oneline

# Ver historial con gráfico
git log --graph --oneline --all

# Ver cambios de un archivo
git log -p archivo.js

# Ver commits por autor
git log --author="nombre"

# Ver commits entre fechas
git log --since="2024-01-01" --until="2024-12-31"
```

### Resolución de Conflictos

```bash
# Ver archivos con conflictos
git status

# Después de resolver conflictos manualmente
git add archivo-con-conflicto.js
git commit -m "resolve: fix merge conflicts"

# Abortar merge si hay problemas
git merge --abort

# Ver herramientas de merge disponibles
git mergetool
```

### Reescribir Historia (Usar con cuidado)

```bash
# Modificar último commit
git commit --amend -m "nuevo mensaje"

# Rebase interactivo (últimos 3 commits)
git rebase -i HEAD~3

# Deshacer último commit (mantener cambios)
git reset --soft HEAD~1

# Deshacer último commit (eliminar cambios)
git reset --hard HEAD~1
```

### Stash (Guardar trabajo temporal)

```bash
# Guardar cambios temporalmente
git stash

# Guardar con mensaje
git stash save "trabajo en progreso"

# Ver lista de stashes
git stash list

# Aplicar último stash
git stash pop

# Aplicar stash específico
git stash apply stash@{0}

# Eliminar stash
git stash drop stash@{0}
```

## 🏷️ Tags y Versiones

```bash
# Crear tag anotado
git tag -a v1.0.0 -m "Versión 1.0.0"

# Crear tag ligero
git tag v1.0.0

# Ver todos los tags
git tag

# Subir tags
git push origin v1.0.0
git push origin --tags

# Eliminar tag local
git tag -d v1.0.0

# Eliminar tag remoto
git push origin --delete v1.0.0
```

## 🚨 Emergencias

### Si subes código a rama incorrecta

```bash
# 1. Crear nueva rama desde la incorrecta
git checkout -b rama-correcta

# 2. Volver a la rama incorrecta
git checkout rama-incorrecta

# 3. Deshacer commits (reemplaza N con número de commits)
git reset --hard HEAD~N

# 4. Forzar push (PELIGROSO - solo si no han hecho pull otros)
git push --force
```

### Si necesitas deshacer un merge

```bash
# Encontrar hash del commit antes del merge
git log --oneline

# Volver a ese commit
git reset --hard <hash-commit>

# Si ya se subió, forzar push (PELIGROSO)
git push --force
```

### Si borraste algo por error

```bash
# Ver historial de todos los comandos
git reflog

# Volver a un estado anterior
git reset --hard HEAD@{N}
```

## 📝 Configuración Útil

```bash
# Configurar usuario globalmente
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"

# Configurar editor
git config --global core.editor "code --wait"

# Aliases útiles
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'

# Ver configuración
git config --list
```

## 🔍 Búsqueda y Debugging

```bash
# Buscar texto en el historial
git log -S "texto-a-buscar" --oneline

# Buscar en archivos
git grep "texto-a-buscar"

# Ver quién modificó cada línea
git blame archivo.js

# Encontrar cuándo se introdujo un bug
git bisect start
git bisect bad HEAD
git bisect good <commit-hash>
```

## 🌟 Tips y Mejores Prácticas

### Mensajes de Commit

```bash
# Buenos ejemplos
git commit -m "feat: add user authentication"
git commit -m "fix: resolve login validation bug"
git commit -m "docs: update API documentation"

# Commit con descripción extendida
git commit -m "feat: add user authentication

- Implement JWT token generation
- Add password hashing with bcrypt
- Create authentication middleware
- Add login/logout endpoints"
```

### Antes de cada Push

```bash
# Verificar estado
git status

# Ver qué se va a subir
git diff --cached

# Hacer push
git push
```

### Sincronización Regular

```bash
# Diariamente, sincronizar develop
git checkout develop
git pull origin develop

# Mantener tu rama actualizada
git checkout tu-rama
git rebase develop
```

---

**Recuerda:** Siempre hacer backup de tu trabajo antes de comandos destructivos como `reset --hard` o `push --force`
