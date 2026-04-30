from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
import json
import uuid
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

# Helper function to get user from JWT token
def get_user_from_request(request):
    from rest_framework_simplejwt.authentication import JWTAuthentication
    try:
        auth = JWTAuthentication()
        result = auth.authenticate(request)
        if result:
            user, _ = result
            return user
    except Exception:
        pass
    return None

# API Views
@csrf_exempt
@require_http_methods(["GET", "POST"])
def applications_list(request):
    if request.method == 'GET':
        return JsonResponse({
            'applications': [],
            'message': 'No applications yet'
        })
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            tracking_number = f"TRK-{uuid.uuid4().hex[:8].upper()}"
            
            return JsonResponse({
                'success': True,
                'message': 'Application submitted successfully',
                'tracking_number': tracking_number,
                'status': 'submitted'
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)

@csrf_exempt
def application_detail(request, tracking_number):
    if request.method == 'GET':
        return JsonResponse({
            'tracking_number': tracking_number,
            'status': 'processing',
            'name': 'Sample Applicant',
            'service_type': 'passport',
            'submitted_at': '2024-04-30T10:00:00Z',
            'expected_completion_date': '2024-05-15T10:00:00Z'
        })
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# Get all applications (for officers)
@csrf_exempt
def all_applications(request):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if user.role not in ['officer', 'admin']:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    # Return mock data as array
    mock_applications = [
        {
            'id': '1',
            'tracking_number': 'TRK-ABC123',
            'name': 'জন Doe',
            'phone': '01712345678',
            'service_type': 'passport',
            'status': 'submitted',
            'submitted_at': '2024-04-30T10:00:00Z'
        },
        {
            'id': '2',
            'tracking_number': 'TRK-DEF456',
            'name': 'Jane Smith',
            'phone': '01812345678',
            'service_type': 'driving_license',
            'status': 'processing',
            'submitted_at': '2024-04-29T10:00:00Z'
        },
        {
            'id': '3',
            'tracking_number': 'TRK-GHI789',
            'name': 'মোহাম্মদ আলী',
            'phone': '01912345678',
            'service_type': 'birth_certificate',
            'status': 'approved',
            'submitted_at': '2024-04-28T10:00:00Z'
        }
    ]
    
    return JsonResponse(mock_applications, safe=False)

# Get all complaints (for officers)
@csrf_exempt
def all_complaints(request):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if user.role not in ['officer', 'admin']:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    # Return mock data as array
    mock_complaints = [
        {
            'id': '1',
            'complaint_id': 'CMP-ABC123',
            'service_type': 'passport',
            'office_location': 'পাসপোর্ট অফিস, ঢাকা',
            'incident_date': '2024-04-28T10:00:00Z',
            'description': 'প্রক্রিয়াকরণের জন্য অতিরিক্ত অর্থ দাবি করা হয়েছে',
            'amount_requested': 5000,
            'is_verified': False,
            'reported_at': '2024-04-29T10:00:00Z'
        },
        {
            'id': '2',
            'complaint_id': 'CMP-DEF456',
            'service_type': 'driving_license',
            'office_location': 'বিআরটিএ অফিস, চট্টগ্রাম',
            'incident_date': '2024-04-27T10:00:00Z',
            'description': 'লাইসেন্স ইস্যুতে ঘুষ দাবি',
            'amount_requested': 3000,
            'is_verified': True,
            'reported_at': '2024-04-28T10:00:00Z'
        },
        {
            'id': '3',
            'complaint_id': 'CMP-GHI789',
            'service_type': 'tax_id',
            'office_location': 'কর অফিস, রাজশাহী',
            'incident_date': '2024-04-26T10:00:00Z',
            'description': 'টি আইএন পেতে ঘুষ দাবি',
            'amount_requested': 2000,
            'is_verified': False,
            'reported_at': '2024-04-27T10:00:00Z'
        }
    ]
    
    return JsonResponse(mock_complaints, safe=False)

# Admin stats (for officers)
@csrf_exempt
def admin_stats(request):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if user.role not in ['officer', 'admin']:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    # Return mock stats
    return JsonResponse({
        'total_applications': 25,
        'pending_applications': 12,
        'total_complaints': 8,
        'verified_complaints': 3,
        'avg_processing_time': 5.5
    })

# Update application status
@csrf_exempt
def update_application_status(request, application_id):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if user.role not in ['officer', 'admin']:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    if request.method == 'PATCH':
        try:
            data = json.loads(request.body)
            new_status = data.get('status')
            return JsonResponse({
                'success': True,
                'message': 'Status updated successfully',
                'new_status': new_status
            })
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# Verify complaint
@csrf_exempt
def verify_complaint(request, complaint_id):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if user.role not in ['officer', 'admin']:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    if request.method == 'PATCH':
        return JsonResponse({
            'success': True,
            'message': 'Complaint verified successfully',
            'complaint_id': complaint_id,
            'is_verified': True
        })
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# Get my applications (for citizens)
@csrf_exempt
def my_applications(request):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    mock_applications = [
        {
            'id': '1',
            'tracking_number': 'TRK-ABC123',
            'service_type': 'passport',
            'status': 'processing',
            'submitted_at': '2024-04-30T10:00:00Z',
            'expected_completion_date': '2024-05-15T10:00:00Z'
        }
    ]
    
    return JsonResponse(mock_applications, safe=False)

@csrf_exempt
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
            'all-applications': '/api/applications/all-applications/',
            'my-applications': '/api/applications/my-applications/',
            'all-complaints': '/api/complaints/all-complaints/',
            'admin-stats': '/api/dashboard/admin-stats/',
            'admin': '/admin/'
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_home),
    path('api/auth/', include('users.urls')),
    
    # Application endpoints
    path('api/applications/', applications_list),
    path('api/applications/<str:tracking_number>/', application_detail),
    path('api/applications/all-applications/', all_applications),
    path('api/applications/my-applications/', my_applications),
    path('api/applications/<str:application_id>/update-status/', update_application_status),
    
    # Complaint endpoints
    path('api/complaints/', complaints_list),
    path('api/complaints/all-complaints/', all_complaints),
    path('api/complaints/<str:complaint_id>/verify/', verify_complaint),
    
    # Dashboard stats
    path('api/dashboard/admin-stats/', admin_stats),
]