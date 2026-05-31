# Despliegue en Ubuntu (nube — ej. Azure VM)

Guía base para levantar **Oftalmología Si2** (Django + PostgreSQL + Next.js + nginx) con Docker.

**Azure VM con DNS cloudapp:** guía completa paso a paso en [`despliegue-azure-vm.md`](./despliegue-azure-vm.md) (NSG, scripts `scripts/azure/`, nginx prod, HTTPS).

---

## 1. Actualizar el sistema

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 2. Instalar Docker

```bash
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
```

---

## 3. Docker Compose (plugin v2)

```bash
sudo apt install -y docker-compose-v2
docker compose version
```

---

## 4. Permisos Docker (opcional)

```bash
sudo usermod -aG docker $USER
```

Cerrá sesión SSH y volvé a entrar.

---

## 5. Clonar el repositorio

```bash
cd ~
git clone <URL_DEL_REPO>
cd Oftalmologia-Si2
```

---

## 6. Variables de entorno

**Desarrollo local:**

```bash
cp .env.example .env
```

**Azure producción:**

```bash
cp .env.azure.example .env
# o: ./scripts/azure/generate-env.sh TU-DOMINIO > .env
```

Completá: `POSTGRES_*`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `PUBLIC_DOMAIN`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL` (usa `/api`, no `/api/v1`), `CORS_ALLOWED_ORIGINS` si `DJANGO_DEBUG=False`.

---

## 7. Levantar contenedores

**Desarrollo (runserver + next dev):**

```bash
docker compose up -d --build
```

**Producción (Gunicorn + Next build + nginx sin puertos internos):**

```bash
./scripts/azure/deploy.sh oftalmologia-si2.westus3.cloudapp.azure.com
# o manualmente:
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Servicios: `db`, `backend`, `frontend`, `nginx`, `recordatorios-scheduler`, `backup-scheduler` (+ `mailhog` solo en dev).

---

## 8. Base de datos

El `backend/entrypoint.sh` aplica migraciones y seeders al arrancar. Manualmente:

```bash
docker compose exec backend python manage.py migrate_schemas --shared
docker compose exec backend python manage.py migrate_schemas --tenant
```

---

## 9. Comprobar

**Con nginx (recomendado):**

- Web: `http://TU-DOMINIO/` (puerto 80)
- API: `http://TU-DOMINIO/api/health/`
- Tenant API: `http://TU-DOMINIO/t/clinica-demo/api/...`

**Sin nginx (solo dev):**

- Frontend: `http://IP:3000`
- Backend: `http://IP:8000/api/health/`

En **Azure NSG**, abrir solo **22**, **80**, **443**. No exponer 3000, 8000, 5432.

---

## 10. Actualizar en la VM

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## Referencia rápida

| Acción | Comando |
|--------|---------|
| Logs backend | `docker compose logs -f backend` |
| Parar | `docker compose down` |
| Estado | `docker compose ps` |
| Deploy Azure | Ver `docs/guides/despliegue-azure-vm.md` |
