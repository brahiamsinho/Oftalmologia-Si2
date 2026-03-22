#!/usr/bin/env python
"""
Script para detectar y mostrar la IP pública del servidor.
Útil para configurar aplicaciones en entornos cloud como AWS EC2.

Uso:
    python detect_ip.py
"""

import logging
import sys
from core.utils.ip_detection import get_public_ip, get_hostname, get_server_url

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    try:
        print("\n🔍 Detectando información del servidor...\n")
        
        hostname = get_hostname()
        ip = get_public_ip()
        backend_url = get_server_url(port=8000)
        frontend_url = get_server_url(port=5173)
        
        print("="*50)
        print(f"🖥️  Hostname: {hostname}")
        print(f"📡 IP pública: {ip}")
        print(f"🌐 URL Backend: {backend_url}")
        print(f"🌐 URL Frontend: {frontend_url}")
        print("="*50)
        
        print("\n✅ ¡Detección completada con éxito!")
        print("   Puedes usar estas URLs en tu configuración.")
        print("   Para aplicar automáticamente, usa la configuración")
        print("   de detección automática en settings.py\n")
        
    except Exception as e:
        logger.error(f"❌ Error al detectar la IP: {e}")
        sys.exit(1)