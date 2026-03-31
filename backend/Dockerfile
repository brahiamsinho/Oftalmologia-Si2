# ---- Build stage ----
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias Python
COPY requirements/ requirements/
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements/local.txt

# ---- Runtime stage ----
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copiar paquetes Python instalados
COPY --from=builder /usr/local/lib/python3.12/site-packages/ /usr/local/lib/python3.12/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# Copiar código fuente
COPY . .

# Hacer ejecutable el entrypoint
RUN chmod +x entrypoint.sh

# Crear directorios necesarios
RUN mkdir -p staticfiles media logs static

EXPOSE 8000

# Usar `sh` explícito: con bind mount `./backend:/app` el +x del build se pierde si el host no marca ejecutable.
ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
