# Session 2026-05-30 — Portainer produccion

## Objetivo
Panel ops para ver contenedores Docker en Azure VM sin abrir puertos extra.

## Implementado
- `docker-compose.portainer.yml`
- `scripts/azure/enable-portainer.sh`
- nginx `location /portainer/` en `default.prod.conf` y `default.prod.https.conf`
- Documentacion en `docs/guides/despliegue-azure-vm.md` y `.env.prod.example`

## Uso en VM
```bash
git pull
chmod +x scripts/azure/enable-portainer.sh
./scripts/azure/enable-portainer.sh
# https://oftalmologia-si2.westus3.cloudapp.azure.com/portainer/
```

## Seguridad
- Socket Docker = control total del host.
- Puerto 9000 solo en 127.0.0.1; acceso publico solo via HTTPS/nginx.
