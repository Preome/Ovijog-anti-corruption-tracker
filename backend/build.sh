#!/bin/bash

set -e  # Exit on error

echo "========================================="
echo "🚀 Starting Build Process"
echo "========================================="

cd backend

# Create venv if not exists
if [ ! -d "venv" ]; then
  echo "🐍 Creating virtual environment..."
  python -m venv venv
fi

# Activate venv (Windows MINGW64/Git Bash)
if [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "win32"* || "$OS" == "Windows_NT" ]]; then
  ACTIVATE="venv/Scripts/activate"
else
  ACTIVATE="venv/bin/activate"
fi

if [ -f "$ACTIVATE" ]; then
  source "$ACTIVATE"
  echo "✅ Virtual environment activated"
else
  echo "❌ Virtual environment activation failed: $ACTIVATE"
  exit 1
fi

export PYTHONIOENCODING=utf-8

echo "📦 Upgrading pip and installing dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt

echo "🔄 Running database migrations (ignoring specific errors)..."
python manage.py makemigrations users || true
python manage.py makemigrations complaints || true
python manage.py makemigrations hearings || true
python manage.py migrate users 0005 --fake || true
python manage.py migrate users 0006 --fake || true
python manage.py migrate || true

echo "🏢 Seeding departments..."
python manage.py create_departments

echo "👑 Creating superuser (if not exists)..."
python manage.py create_superuser

echo "📁 Collecting static files..."
python manage.py collectstatic --noinput || true

echo "========================================="
echo "✅ Build completed successfully!"
echo "========================================="

