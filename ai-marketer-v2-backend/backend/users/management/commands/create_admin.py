from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()

class Command(BaseCommand):
    def handle(self, *args, **options):
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@aimarketer.com')
        admin_password = os.getenv('ADMIN_PASSWORD', 'admin123!')
        admin_name = os.getenv('ADMIN_NAME', 'Admin User')
        
        if User.objects.filter(email=admin_email).exists():
            print(f"⚠️ Admin user already exists: {admin_email}")
            return
        
        try:
            user = User.objects.create_superuser(
                email=admin_email,
                name=admin_name,
                password=admin_password
            )
            print(f"✅ Admin user created successfully: {admin_email}")
            
        except Exception as e:
            print(f"❌ Failed to create admin user: {str(e)}")
            raise e