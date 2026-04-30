import os
import sys
from pathlib import Path

# Add the backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Try to import settings
try:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    import django
    django.setup()
    print("✅ Django settings loaded successfully!")
    print(f"✅ Database engine: {django.conf.settings.DATABASES['default']['ENGINE']}")
    print(f"✅ Installed apps: {django.conf.settings.INSTALLED_APPS}")
except Exception as e:
    print(f"❌ Error: {e}")