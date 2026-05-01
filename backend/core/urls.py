from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
import json
import uuid
from datetime import datetime
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

# In-memory storage for complaints (replace with database later)
complaints_storage = {}
applications_storage = {}

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
            'applications': list(applications_storage.values()),
            'message': 'Applications retrieved'
        })
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            tracking_number = f"TRK-{uuid.uuid4().hex[:8].upper()}"
            
            application_data = {
                'id': str(uuid.uuid4()),
                'tracking_number': tracking_number,
                'name': data.get('name'),
                'phone': data.get('phone'),
                'email': data.get('email', ''),
                'service_type': data.get('service_type'),
                'status': 'submitted',
                'submitted_at': datetime.now().isoformat(),
                'expected_completion_date': (datetime.now().replace(day=datetime.now().day + 15)).isoformat()
            }
            
            applications_storage[tracking_number] = application_data
            
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
        app_data = applications_storage.get(tracking_number)
        if app_data:
            return JsonResponse(app_data)
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
    
    # Return real data from storage or mock data
    if applications_storage:
        return JsonResponse(list(applications_storage.values()), safe=False)
    
    # Return mock data as array
    mock_applications = [
        {
            'id': '1',
            'tracking_number': 'TRK-ABC123',
            'name': 'রহিম উদ্দিন',
            'phone': '01712345678',
            'service_type': 'passport',
            'status': 'submitted',
            'submitted_at': '2024-04-30T10:00:00Z'
        },
        {
            'id': '2',
            'tracking_number': 'TRK-DEF456',
            'name': 'করিম মিয়া',
            'phone': '01812345678',
            'service_type': 'driving_license',
            'status': 'processing',
            'submitted_at': '2024-04-29T10:00:00Z'
        },
        {
            'id': '3',
            'tracking_number': 'TRK-GHI789',
            'name': 'ফাতেমা বেগম',
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
    
    # Return real complaints from storage
    if complaints_storage:
        return JsonResponse(list(complaints_storage.values()), safe=False)
    
    # Return mock data as array with evidence
    mock_complaints = [
        {
            'id': '1',
            'complaint_id': 'CMP-ABC123',
            'service_type': 'passport',
            'office_location': 'পাসপোর্ট অফিস, ঢাকা',
            'incident_date': '2024-04-28T10:00:00Z',
            'description': 'প্রক্রিয়াকরণের জন্য অতিরিক্ত অর্থ দাবি করা হয়েছে',
            'amount_requested': 5000,
            'officer_name': 'জনাব করিম',
            'status': 'pending',
            'priority': 'high',
            'is_verified': False,
            'reported_at': '2024-04-29T10:00:00Z',
            'evidence_documents': [
                {
                    'url': 'https://via.placeholder.com/150',
                    'name': 'evidence_1.jpg',
                    'format': 'jpg'
                }
            ],
            'investigation_notes': '',
            'action_taken': '',
            'feedback_to_citizen': ''
        },
        {
            'id': '2',
            'complaint_id': 'CMP-DEF456',
            'service_type': 'driving_license',
            'office_location': 'বিআরটিএ অফিস, চট্টগ্রাম',
            'incident_date': '2024-04-27T10:00:00Z',
            'description': 'লাইসেন্স ইস্যুতে ঘুষ দাবি',
            'amount_requested': 3000,
            'officer_name': 'জনাব রহমান',
            'status': 'under_investigation',
            'priority': 'urgent',
            'is_verified': True,
            'reported_at': '2024-04-28T10:00:00Z',
            'evidence_documents': [],
            'investigation_notes': 'তদন্ত চলছে',
            'action_taken': '',
            'feedback_to_citizen': ''
        },
        {
            'id': '3',
            'complaint_id': 'CMP-GHI789',
            'service_type': 'tax_id',
            'office_location': 'কর অফিস, রাজশাহী',
            'incident_date': '2024-04-26T10:00:00Z',
            'description': 'টি আইএন পেতে ঘুষ দাবি',
            'amount_requested': 2000,
            'officer_name': '',
            'status': 'pending',
            'priority': 'medium',
            'is_verified': False,
            'reported_at': '2024-04-27T10:00:00Z',
            'evidence_documents': [],
            'investigation_notes': '',
            'action_taken': '',
            'feedback_to_citizen': ''
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
    
    # Calculate real stats from storage
    total_complaints = len(complaints_storage)
    verified_complaints = sum(1 for c in complaints_storage.values() if c.get('is_verified', False))
    pending_complaints = sum(1 for c in complaints_storage.values() if c.get('status') == 'pending')
    
    return JsonResponse({
        'total_applications': len(applications_storage) or 25,
        'pending_applications': 12,
        'approved_applications': 10,
        'rejected_applications': 3,
        'total_complaints': total_complaints or 8,
        'verified_complaints': verified_complaints or 3,
        'pending_complaints': pending_complaints or 5,
        'under_investigation': 2,
        'resolved_complaints': 1,
        'urgent_complaints': 1,
        'high_priority': 2,
        'medium_priority': 3,
        'low_priority': 2,
        'avg_processing_time': 5.5,
        'avg_resolution_time': 7.5,
        'corruption_hotspots': [
            {'location': 'পাসপোর্ট অফিস, ঢাকা', 'count': 3},
            {'location': 'বিআরটিএ অফিস, চট্টগ্রাম', 'count': 2},
            {'location': 'কর অফিস, রাজশাহী', 'count': 1}
        ]
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
            
            # Update in storage if exists
            for tracking, app in applications_storage.items():
                if app.get('id') == application_id or tracking == application_id:
                    applications_storage[tracking]['status'] = new_status
                    break
            
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
        try:
            data = json.loads(request.body)
            is_verified = data.get('is_verified', True)
            
            # Update in storage
            if complaint_id in complaints_storage:
                complaints_storage[complaint_id]['is_verified'] = is_verified
                if is_verified:
                    complaints_storage[complaint_id]['status'] = 'verified'
            
            return JsonResponse({
                'success': True,
                'message': 'Complaint verified successfully',
                'complaint_id': complaint_id,
                'is_verified': is_verified
            })
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# Get my applications (for citizens)
@csrf_exempt
def my_applications(request):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    # Get user's applications from storage
    user_apps = []
    for tracking, app in applications_storage.items():
        if app.get('phone') == user.phone or app.get('email') == user.email:
            user_apps.append(app)
    
    if user_apps:
        return JsonResponse(user_apps, safe=False)
    
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

# Get single complaint details
@csrf_exempt
def complaint_detail(request, complaint_id):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if user.role not in ['officer', 'admin']:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    # Check storage first
    if complaint_id in complaints_storage:
        return JsonResponse(complaints_storage[complaint_id])
    
    # Mock data for demonstration
    complaint = {
        'id': complaint_id,
        'complaint_id': f"CMP-{complaint_id[:8]}",
        'service_type': 'passport',
        'office_location': 'পাসপোর্ট অফিস, ঢাকা',
        'incident_date': '2024-04-28T10:00:00Z',
        'description': 'প্রক্রিয়াকরণের জন্য অতিরিক্ত অর্থ দাবি করা হয়েছে',
        'amount_requested': 5000,
        'officer_name': 'জনাব করিম',
        'status': 'pending',
        'priority': 'high',
        'investigation_notes': '',
        'action_taken': '',
        'feedback_to_citizen': '',
        'evidence_documents': [
            {'url': 'https://via.placeholder.com/150', 'name': 'evidence1.jpg', 'format': 'jpg'},
            {'url': 'https://via.placeholder.com/150', 'name': 'evidence2.pdf', 'format': 'pdf'}
        ],
        'reported_at': '2024-04-29T10:00:00Z',
        'is_anonymous': False
    }
    
    return JsonResponse(complaint)

# Update complaint status with full details
@csrf_exempt
def update_complaint_status(request, complaint_id):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if user.role not in ['officer', 'admin']:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    if request.method == 'PATCH':
        try:
            data = json.loads(request.body)
            
            # Update in storage
            if complaint_id in complaints_storage:
                complaints_storage[complaint_id].update({
                    'status': data.get('status', complaints_storage[complaint_id].get('status', 'pending')),
                    'priority': data.get('priority', complaints_storage[complaint_id].get('priority', 'medium')),
                    'investigation_notes': data.get('investigation_notes', ''),
                    'action_taken': data.get('action_taken', ''),
                    'feedback_to_citizen': data.get('feedback_to_citizen', ''),
                    'is_verified': data.get('status') == 'verified' or complaints_storage[complaint_id].get('is_verified', False)
                })
                
                return JsonResponse({
                    'success': True,
                    'message': 'Complaint updated successfully',
                    'complaint_id': complaint_id,
                    'updated_fields': data
                })
            else:
                # For mock data, just return success
                return JsonResponse({
                    'success': True,
                    'message': 'Complaint updated successfully',
                    'complaint_id': complaint_id,
                    'updated_fields': data
                })
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# Get complaint statistics
@csrf_exempt
def complaint_stats(request):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if user.role not in ['officer', 'admin']:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    # Calculate real stats from storage
    total = len(complaints_storage)
    pending = sum(1 for c in complaints_storage.values() if c.get('status') == 'pending')
    under_investigation = sum(1 for c in complaints_storage.values() if c.get('status') == 'under_investigation')
    verified = sum(1 for c in complaints_storage.values() if c.get('is_verified', False))
    
    stats = {
        'total': total or 45,
        'pending': pending or 12,
        'under_investigation': under_investigation or 8,
        'verified': verified or 5,
        'rejected': 3,
        'escalated': 2,
        'resolved': 10,
        'dismissed': 5,
        'by_priority': {
            'low': 10,
            'medium': 15,
            'high': 12,
            'urgent': 8
        },
        'by_service': {
            'passport': 20,
            'driving_license': 15,
            'birth_certificate': 5,
            'tax_id': 5
        },
        'avg_resolution_time_days': 7.5
    }
    
    return JsonResponse(stats)

# Submit new complaint (updated to store evidence)
@csrf_exempt
def complaints_list(request):
    if request.method == 'GET':
        return JsonResponse({'complaints': list(complaints_storage.values())})
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            complaint_id = f"CMP-{uuid.uuid4().hex[:8].upper()}"
            
            # Store complaint with evidence
            complaint_data = {
                'id': complaint_id,
                'complaint_id': complaint_id,
                'service_type': data.get('service_type'),
                'office_location': data.get('office_location'),
                'incident_date': data.get('incident_date'),
                'description': data.get('description'),
                'amount_requested': data.get('amount_requested'),
                'officer_name': data.get('officer_name', ''),
                'evidence_documents': data.get('evidence_documents', []),
                'is_anonymous': data.get('is_anonymous', True),
                'is_verified': False,
                'status': 'pending',
                'priority': 'medium',
                'reported_at': datetime.now().isoformat(),
                'investigation_notes': '',
                'action_taken': '',
                'feedback_to_citizen': ''
            }
            
            complaints_storage[complaint_id] = complaint_data
            
            return JsonResponse({
                'success': True,
                'message': 'Complaint submitted anonymously',
                'complaint_id': complaint_id,
                'evidence_count': len(data.get('evidence_documents', [])),
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
            'complaint-detail': '/api/complaints/<complaint_id>/',
            'complaint-stats': '/api/complaints/stats/',
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
    path('api/complaints/<str:complaint_id>/', complaint_detail),
    path('api/complaints/<str:complaint_id>/update-status/', update_complaint_status),
    path('api/complaints/stats/', complaint_stats),
    
    # Dashboard stats
    path('api/dashboard/admin-stats/', admin_stats),
]