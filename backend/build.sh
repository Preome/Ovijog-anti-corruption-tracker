#!/bin/bash

echo "========================================="
echo "🚀 Starting Build Process"
echo "========================================="

# Install dependencies
echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run migrations
echo "🔄 Running database migrations..."
python manage.py makemigrations users
python manage.py makemigrations
python manage.py migrate

# Create departments
echo "🏢 Seeding departments..."
python manage.py shell << EOF
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
    else:
        print(f'⚠️ Already exists: {dept["name_bn"]}')
print(f'✅ Total departments: {Department.objects.count()}')
EOF

# Create superuser (if not exists)
echo "👑 Creating superuser..."
python manage.py shell << EOF
from users.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'Admin2024!')
    print('✅ Superuser created')
else:
    print('⚠️ Superuser already exists')
EOF

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "========================================="
echo "✅ Build completed successfully!"
echo "========================================="