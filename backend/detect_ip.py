#!/usr/bin/env python3
"""
Muestra hostname, IP pública (si hay salida a Internet) y URLs de ejemplo.
Los puertos se toman de variables de entorno (mismas que docker-compose / .env).

  BACKEND_PUBLIC_PORT   (por defecto HOST_PORT_BACKEND o 8000)
  FRONTEND_PUBLIC_PORT  (por defecto HOST_PORT_FRONTEND o 3000)
"""
from __future__ import annotations

import os
import socket
import sys
import urllib.error
import urllib.request


def _get_public_ip() -> str:
    try:
        with urllib.request.urlopen('https://api.ipify.org', timeout=5) as r:
            return r.read().decode().strip()
    except (urllib.error.URLError, TimeoutError, OSError):
        return '(no disponible)'


def main() -> int:
    backend_port = os.environ.get(
        'BACKEND_PUBLIC_PORT',
        os.environ.get('HOST_PORT_BACKEND', '8000'),
    )
    frontend_port = os.environ.get(
        'FRONTEND_PUBLIC_PORT',
        os.environ.get('HOST_PORT_FRONTEND', '3000'),
    )
    ip = _get_public_ip()
    host = socket.gethostname()
    print('\n🔍 Información del servidor\n')
    print('=' * 50)
    print(f'🖥️  Hostname: {host}')
    print(f'📡 IP pública: {ip}')
    if ip != '(no disponible)':
        print(f'🌐 API (ejemplo): http://{ip}:{backend_port}/api/')
        print(f'🌐 Web (ejemplo): http://{ip}:{frontend_port}/')
    print('=' * 50)
    print('\nAjustá FRONTEND_URL, NEXT_PUBLIC_API_URL y DJANGO_ALLOWED_HOSTS en .env según tu despliegue.\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
