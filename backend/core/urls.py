from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
import json
import uuid
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

# API Views
@csrf_exempt
@require_http_methods(["GET", "POST"])
def applications_list(request):
    if request.method == 'GET':
        # Return list of applications (for admin)
        return JsonResponse({
            'applications': [],
            'message': 'No applications yet'
        })
    
    elif request.method == 'POST':
        try:
            # Parse the request body
            data = json.loads(request.body)
            
            # Generate tracking number
            tracking_number = f"TRK-{uuid.uuid4().hex[:8].upper()}"
            
            # Here you would save to database
            # For now, return success response
            return JsonResponse({
                'success': True,
                'message': 'Application submitted successfully',
                'tracking_number': tracking_number,
                'status': 'submitted'
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({
                'error': 'Invalid JSON data'
            }, status=400)

@csrf_exempt
def application_detail(request, tracking_number):
    if request.method == 'GET':
        # Mock data for demonstration
        return JsonResponse({
            'tracking_number': tracking_number,
            'status': 'processing',
            'name': 'Sample Applicant',
            'service_type': 'passport',
            'submitted_at': '2024-04-30T10:00:00Z',
            'expected_completion_date': '2024-05-15T10:00:00Z'
        })
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
@require_http_methods(["GET", "POST"])
def complaints_list(request):
    if request.method == 'GET':
        return JsonResponse({'complaints': []})
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            complaint_id = f"CMP-{uuid.uuid4().hex[:8].upper()}"
            
            return JsonResponse({
                'success': True,
                'message': 'Complaint submitted anonymously',
                'complaint_id': complaint_id,
                'status': 'received'
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

def api_home(request):
    return JsonResponse({
        'message': 'Anti-Corruption Digital Service Tracker API',
        'status': 'active',
        'version': '1.0.0',
        'endpoints': {
            'applications': '/api/applications/',
            'track': '/api/applications/<tracking_number>/',
            'complaints': '/api/complaints/',
            'admin': '/admin/'
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_home),
    path('api/applications/', applications_list),
    path('api/applications/<str:tracking_number>/', application_detail),
    path('api/complaints/', complaints_list),
]