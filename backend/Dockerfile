# ---- Build stage ----
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Dependencias necesarias para compilar paquetes Python como psycopg2, argon2, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/ requirements/

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements/local.txt


# ---- Runtime stage ----
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Flags de arranque
ENV RUN_MIGRATIONS=1
ENV BOOTSTRAP_PUBLIC_SCHEMA=1
ENV BOOTSTRAP_DEMO_TENANT=1
ENV RUN_SEEDERS=1
ENV RUN_COLLECTSTATIC=0

# Datos por defecto del tenant demo
ENV DEMO_TENANT_SCHEMA=clinica_demo
ENV DEMO_TENANT_SLUG=clinica-demo
ENV DEMO_TENANT_NAME="Clínica Demo"
ENV DEMO_TENANT_EMAIL=demo@oftalmologia.local
ENV DEMO_TENANT_DOMAIN=clinica-demo

WORKDIR /app

# Dependencias runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    netcat-openbsd \
    util-linux \
    && rm -rf /var/lib/apt/lists/*

# Copiar paquetes Python instalados desde builder
COPY --from=builder /usr/local/lib/python3.12/site-packages/ /usr/local/lib/python3.12/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# Copiar código fuente
COPY . .

# Crear directorios necesarios
RUN mkdir -p staticfiles media logs static

# Permiso de ejecución.
RUN chmod +x entrypoint.sh || true

EXPOSE 8000

ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]