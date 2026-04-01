# Despliegue en Ubuntu (nube — ej. Azure VM)

Guía para levantar **Oftalmología Si2** (Django + PostgreSQL + Next.js + Mailhog) con Docker. **No aplica Laravel** ni `php artisan`.

---

## 1. Actualizar el sistema

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 2. Instalar Docker

```bash
sudo apt install -y docker.io
```

Iniciar y habilitar el servicio:

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

---

## 3. Instalar Docker Compose (plugin v2)

En Ubuntu, el paquete **`docker-compose`** antiguo (Python 1.29.x) puede fallar con Docker Engine 28+ (`KeyError: 'ContainerConfig'`). Instalá el **plugin v2** y usá el comando con **espacio**: `docker compose`.

```bash
sudo apt install -y docker-compose-v2
```

Comprobar (nota: en inglés, **`--version`**, no `--versión`):

```bash
docker --version
docker compose version
```

---

## 4. Permisos Docker (opcional, para no usar `sudo`)

```bash
sudo usermod -aG docker $USER
```

**Cerrá sesión SSH y volvé a entrar** (o ejecutá `newgrp docker`). Después debería funcionar `docker ps` sin `sudo`.

Hasta entonces, anteponé **`sudo`** a todos los comandos `docker` / `docker compose`.

---

## 5. Git

```bash
sudo apt install -y git
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

---

## 6. Clonar el repositorio

```bash
cd ~
git clone
cd
```

(Ajustá la URL si usás otro remoto o SSH.)

---

## 7. Variables de entorno

```bash
cp .env.example .env
nano .env
```

Completá al menos: `POSTGRES_*`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, `CORS_ALLOWED_ORIGINS` (si `DJANGO_DEBUG=False`). Para la IP pública de la VM, seguí los comentarios dentro de `.env.example`.

**App móvil (Flutter):** en tu máquina de desarrollo, configurá `mobile/.env` con `API_BASE_URL` apuntando al API alcanzable desde el dispositivo (no se usa en el servidor solo para el compose web/backend).

---

## 8. Levantar contenedores

Desde la raíz del repo:

```bash
sudo docker compose up -d --build
```

(Sin `sudo` si ya aplicaste el grupo `docker` y reiniciaste sesión.)

Servicios: `db`, `backend`, `frontend`, `mailhog`.

---

## 9. Base de datos (Django)

Primera vez (o tras cambios de modelos en el repo):

```bash
sudo docker compose exec backend python manage.py migrate
sudo docker compose exec backend python manage.py seed
```

Opcional — solo si tocás modelos y generás migraciones en otro entorno:

```bash
sudo docker compose exec backend python manage.py makemigrations
```

---

## 10. Comprobar

```bash
sudo docker compose ps
```

- Panel web: `http://IP_PUBLICA_VM:3000` (o el puerto `HOST_PORT_FRONTEND` del `.env`).
- API: `http://IP_PUBLICA_VM:8000/api/health/` (o `HOST_PORT_BACKEND`).
- Mailhog (solo desarrollo): puerto `HOST_PORT_MAILHOG_UI` (por defecto 8025).

En **Azure**, abrí en el **Network Security Group** los puertos que expongas (típicamente **22** SSH, **3000**, **8000**; **5432** solo si necesitás Postgres desde fuera, no recomendado).

---

## 11. Actualizar código en la VM

```bash
cd ~/Oftalmologia-Si2
git pull origin main
sudo docker compose up -d --build
sudo docker compose exec backend python manage.py migrate
```

---

## Referencia rápida de comandos

| Acción           | Comando                               |
| ---------------- | ------------------------------------- |
| Ver logs backend | `sudo docker compose logs -f backend` |
| Parar todo       | `sudo docker compose down`            |
| Estado           | `sudo docker compose ps`              |

**No uses** pasos de Laravel (`laravel_app`, `artisan`, `storage:link`, etc.); este proyecto es **Django + Next.js**.
