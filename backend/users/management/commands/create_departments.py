from django.core.management.base import BaseCommand
from users.models import Department

class Command(BaseCommand):
    help = 'Create default departments'
    
    def handle(self, *args, **options):
        departments = [
            {'name': 'passport', 'name_bn': 'পাসপোর্ট অধিদপ্তর'},
            {'name': 'driving_license', 'name_bn': 'বিআরটিএ - ড্রাইভিং লাইসেন্স'},
            {'name': 'birth_certificate', 'name_bn': 'জন্ম নিবন্ধন অধিদপ্তর'},
            {'name': 'tax_id', 'name_bn': 'কর অধিদপ্তর - ট্যাক্স আইডি'},
        ]
        
        for dept in departments:
            Department.objects.get_or_create(
                name=dept['name'],
                defaults={'name_bn': dept['name_bn']}
            )
            self.stdout.write(self.style.SUCCESS(f'Created department: {dept["name_bn"]}'))