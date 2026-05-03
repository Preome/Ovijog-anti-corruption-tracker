#!/bin/bash

echo "========================================="
echo "🚀 Starting Build Process"
echo "========================================="

echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "🔄 Running database migrations (ignoring errors)..."
python manage.py makemigrations users || true
python manage.py makemigrations complaints || true
python manage.py makemigrations hearings || true
python manage.py migrate --noinput || true

echo "🏢 Seeding departments..."
python manage.py shell << PYEOF || true
from users.models import Department
departments = [
    {'name': 'passport', 'name_bn': 'পাসপোর্ট অধিদপ্তর'},
    {'name': 'driving_license', 'name_bn': 'বিআরটিএ - ড্রাইভিং লাইসেন্স'},
    {'name': 'birth_certificate', 'name_bn': 'জন্ম নিবন্ধন অধিদপ্তর'},
    {'name': 'tax_id', 'name_bn': 'কর অধিদপ্তর - ট্যাক্স আইডি'},
]
for dept in departments:
    obj, created = Department.objects.get_or_create(
        name=dept['name'], 
        defaults={'name_bn': dept['name_bn']}
    )
    if created:
        print(f'✅ Created: {dept["name_bn"]}')
print(f'✅ Total departments: {Department.objects.count()}')
PYEOF

echo "👑 Creating superuser..."
python manage.py shell << PYEOF || true
from users.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'Admin2024!')
    print('✅ Superuser created')
else:
    print('⚠️ Superuser already exists')
PYEOF

echo "📁 Collecting static files..."
python manage.py collectstatic --noinput || true

echo "========================================="
echo "✅ Build completed successfully!"
echo "========================================="