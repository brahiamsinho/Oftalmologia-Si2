"""
Valores por defecto solo para pytest (cuando no hay .env completo).
En runtime real, definir variables en la raíz del monorepo: .env
"""
import os

os.environ.setdefault('DJANGO_SECRET_KEY', 'x' * 50)
os.environ.setdefault('DJANGO_DEBUG', 'True')
os.environ.setdefault('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1,testserver')
os.environ.setdefault('FRONTEND_URL', 'http://localhost:3000')
os.environ.setdefault('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')
os.environ.setdefault('POSTGRES_DB', 'test_db')
os.environ.setdefault('POSTGRES_USER', 'test')
os.environ.setdefault('POSTGRES_PASSWORD', 'test')
os.environ.setdefault('POSTGRES_HOST', 'localhost')
os.environ.setdefault('POSTGRES_PORT', '5432')
