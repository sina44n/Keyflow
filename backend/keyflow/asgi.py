"""KEYFLOW ASGI Configuration (for future Django Channels / WebSocket support)"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keyflow.settings')
application = get_asgi_application()
