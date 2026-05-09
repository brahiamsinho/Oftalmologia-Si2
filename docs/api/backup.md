# API de Backup/Restore

## Descripción
Sistema de backup y restore por tenant con límites por plan y auditoría completa.

## Autenticación
Todos los endpoints requieren autenticación JWT.

## Endpoints

### 1. Listar Backups
```
GET /t/<slug>/api/backup/
```

**Response:**
```json
{
  "count": 2,
  "results": [
    {
      "id_backup": 2,
      "estado": "COMPLETADO",
      "tamaño_mb": 4.50,
      "creado_en": "2026-05-09T03:00:00-04:00",
      "expira_en": "2026-05-16T03:00:00-04:00",
      "dias_restantes": 7,
      "creado_por_nombre": "Admin Demo",
      "restaurado_en": null,
      "motivo_restore": ""
    },
    {
      "id_backup": 1,
      "estado": "RESTAURADO",
      "tamaño_mb": 3.80,
      "creado_en": "2026-05-07T03:00:00-04:00",
      "expira_en": "2026-05-14T03:00:00-04:00",
      "dias_restantes": 5,
      "creado_por_nombre": "Admin Demo",
      "restaurado_en": "2026-05-08T10:30:00-04:00",
      "motivo_restore": "Recuperación después de error en migración"
    }
  ]
}
```

### 2. Crear Backup Manual
```
POST /t/<slug>/api/backup/
```

**Response 201:**
```json
{
  "id_backup": 3,
  "estado": "COMPLETADO",
  "tamaño_mb": 5.20,
  "creado_en": "2026-05-09T15:30:00-04:00",
  "expira_en": "2026-05-16T15:30:00-04:00",
  "dias_restantes": 7,
  "creado_por_nombre": "Admin Demo",
  "restaurado_en": null,
  "motivo_restore": ""
}
```

**Error 403 (Plan FREE):**
```json
{
  "error": "Plan FREE no permite backups"
}
```

**Error 409 (Operación en progreso):**
```json
{
  "error": "Ya hay una operación de backup/restore en progreso"
}
```

### 3. Restaurar Backup
```
POST /t/<slug>/api/backup/{id}/restore/
```

**Body:**
```json
{
  "confirmar": true,
  "motivo": "Recuperación después de error en migración"
}
```

**Response 200:**
```json
{
  "mensaje": "Backup restaurado exitosamente",
  "backup": {
    "id_backup": 1,
    "estado": "RESTAURADO",
    "tamaño_mb": 3.80,
    "creado_en": "2026-05-07T03:00:00-04:00",
    "expira_en": "2026-05-14T03:00:00-04:00",
    "dias_restantes": 5,
    "creado_por_nombre": "Admin Demo",
    "restaurado_en": "2026-05-09T15:45:00-04:00",
    "motivo_restore": "Recuperación después de error en migración"
  }
}
```

**Error 400 (Sin confirmación):**
```json
{
  "confirmar": ["Debe confirmar explícitamente la restauración"]
}
```

**Error 403 (Plan no permite restore):**
```json
{
  "error": "Plan FREE no permite restaurar backups"
}
```

### 4. Descargar Backup
```
GET /t/<slug>/api/backup/{id}/download/
```

**Response:** Archivo `.sql.gz` para descarga.

### 5. Eliminar Backup
```
DELETE /t/<slug>/api/backup/{id}/
```

**Response 204:** Sin contenido.

### 6. Obtener Configuración de Backup Automático
```
GET /t/<slug>/api/backup-config/
```

**Response:**
```json
{
  "id_config": 1,
  "backup_automatico": true,
  "hora_backup": "03:00:00",
  "frecuencia": "daily",
  "retencion_dias": 7,
  "creado_en": "2026-05-01T00:00:00-04:00",
  "actualizado_en": "2026-05-01T00:00:00-04:00"
}
```

### 7. Actualizar Configuración de Backup Automático
```
PATCH /t/<slug>/api/backup-config/1/
```

**Body:**
```json
{
  "hora_backup": "04:00:00",
  "frecuencia": "daily",
  "retencion_dias": 14
}
```

**Response:**
```json
{
  "id_config": 1,
  "backup_automatico": true,
  "hora_backup": "04:00:00",
  "frecuencia": "daily",
  "retencion_dias": 14,
  "creado_en": "2026-05-01T00:00:00-04:00",
  "actualizado_en": "2026-05-09T15:50:00-04:00"
}
```

### 8. Información de Límites del Plan
```
GET /t/<slug>/api/backup/plan-info/
```

**Response:**
```json
{
  "plan_codigo": "PLUS",
  "plan_nombre": "Plus",
  "max_backups": 5,
  "retencion_dias": 30,
  "permite_restore": true,
  "permite_automatico": true,
  "backups_actuales": 2,
  "backups_restantes": 3
}
```

## Límites por Plan

| Plan | Backups | Retención | Restore | Automático |
|------|---------|-----------|---------|------------|
| FREE | 0 | 0 días | ❌ | ❌ |
| PLUS | 5 | 30 días | ✅ | ✅ |
| PRO | Ilimitado | 90 días | ✅ | ✅ |

## Management Commands

### Backup Automático
```bash
python manage.py backup_automatico
```

**Opciones:**
- `--force`: Ejecuta backup para todos los tenants sin verificar hora
- `--tenant-slug <slug>`: Ejecuta backup solo para un tenant específico

### Ejemplo de uso
```bash
# Ejecutar backups automáticos según configuración
python manage.py backup_automatico

# Forzar backup para todos los tenants
python manage.py backup_automatico --force

# Backup solo para un tenant específico
python manage.py backup_automatico --tenant-slug clinica-demo
```

## Docker Compose

### Backup Scheduler
El servicio `backup-scheduler` ejecuta el comando `backup_automatico` cada hora:

```yaml
backup-scheduler:
  build:
    context: ./backend
    dockerfile: Dockerfile
  restart: unless-stopped
  env_file:
    - .env
  volumes:
    - ./backend:/app
    - backend_media:/app/media
  depends_on:
    db:
      condition: service_healthy
  networks:
    - oftalmologia_net
  command: >
    sh -c "while true; do
      python manage.py backup_automatico;
      sleep 3600;
    done"
```

## Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `BACKUP_STORAGE_PATH` | `backups` | Ruta base para almacenar backups |
| `BACKUP_TIMEOUT_SECONDS` | `600` | Timeout para operaciones de backup/restore |
| `BACKUP_MAX_SIZE_MB` | `500` | Tamaño máximo permitido para un backup |

## Bitácora

Todas las operaciones de backup/restore se registran en la bitácora del sistema:

- **BACKUP_CREATED**: Backup manual o automático creado
- **BACKUP_RESTORED**: Backup restaurado (con motivo)
- **BACKUP_DELETED**: Backup eliminado manualmente
- **BACKUP_CONFIG_UPDATED**: Configuración de backup automático actualizada

## Seguridad

1. **Aislamiento por tenant**: Cada backup solo contiene el schema del tenant
2. **Confirmación explícita**: Restore requiere `{"confirmar": true}`
3. **Motivo obligatorio**: Recomendado para auditoría
4. **Bitácora completa**: Todas las operaciones se registran con IP y user-agent
5. **Límites por plan**: Validación estricta antes de cada operación
6. **Sin concurrencia**: Solo una operación de backup/restore a la vez por tenant
