from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
import json
import uuid
from datetime import datetime
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

# In-memory storage for complaints
complaints_storage = {}

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

# Get all complaints (for officers)
# Get all complaints (for officers)
# Get all complaints (for officers)
@csrf_exempt
def all_complaints(request):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if user.role not in ['officer', 'admin']:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    # Get all complaints from storage
    all_complaints_list = list(complaints_storage.values())
    
    print(f"User: {user.username}, Role: {user.role}")
    print(f"User department: {user.department.name if user.department else 'None'}")
    print(f"Total complaints in storage: {len(all_complaints_list)}")
    
    # For officers (not admin), filter by department
    if user.role == 'officer' and user.department:
        dept_name = user.department.name
        print(f"Filtering complaints for department: {dept_name}")
        
        # Filter complaints by service_type matching department
        filtered_complaints = []
        for complaint in all_complaints_list:
            complaint_service = complaint.get('service_type', '')
            print(f"Complaint service: {complaint_service}, Department: {dept_name}")
            
            # Match complaint service_type with officer's department
            if complaint_service == dept_name:
                filtered_complaints.append(complaint)
        
        print(f"Filtered complaints count: {len(filtered_complaints)}")
        return JsonResponse(filtered_complaints, safe=False)
    
    # Admin sees all complaints
    if user.role == 'admin':
        return JsonResponse(all_complaints_list, safe=False)
    
    # Officers without department see empty list
    return JsonResponse([], safe=False)

# Get my complaints (for citizens)
@csrf_exempt
def my_complaints(request):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    # Filter complaints by user_id
    user_complaints = []
    for complaint_id, complaint in complaints_storage.items():
        if complaint.get('user_id') == str(user.id):
            user_complaints.append(complaint)
    
    return JsonResponse(user_complaints, safe=False)

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
    under_investigation = sum(1 for c in complaints_storage.values() if c.get('status') == 'under_investigation')
    resolved_complaints = sum(1 for c in complaints_storage.values() if c.get('status') == 'resolved')
    urgent_complaints = sum(1 for c in complaints_storage.values() if c.get('priority') == 'urgent')
    high_priority = sum(1 for c in complaints_storage.values() if c.get('priority') == 'high')
    medium_priority = sum(1 for c in complaints_storage.values() if c.get('priority') == 'medium')
    low_priority = sum(1 for c in complaints_storage.values() if c.get('priority') == 'low')
    
    # Calculate corruption hotspots
    hotspots = {}
    for complaint in complaints_storage.values():
        location = complaint.get('office_location', '')
        if location:
            hotspots[location] = hotspots.get(location, 0) + 1
    
    hotspots_list = [{'location': loc, 'count': count} for loc, count in hotspots.items()]
    hotspots_list.sort(key=lambda x: x['count'], reverse=True)
    
    return JsonResponse({
        'total_complaints': total_complaints,
        'verified_complaints': verified_complaints,
        'pending_complaints': pending_complaints,
        'under_investigation': under_investigation,
        'resolved_complaints': resolved_complaints,
        'urgent_complaints': urgent_complaints,
        'high_priority': high_priority,
        'medium_priority': medium_priority,
        'low_priority': low_priority,
        'avg_resolution_time': 7.5,
        'corruption_hotspots': hotspots_list[:5]
    })

# Get single complaint details
@csrf_exempt
def complaint_detail(request, complaint_id):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if user.role not in ['officer', 'admin']:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    complaint = complaints_storage.get(complaint_id)
    if not complaint:
        return JsonResponse({'error': 'Complaint not found'}, status=404)
    
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
            
            if complaint_id in complaints_storage:
                complaints_storage[complaint_id].update({
                    'status': data.get('status', complaints_storage[complaint_id].get('status', 'pending')),
                    'priority': data.get('priority', complaints_storage[complaint_id].get('priority', 'medium')),
                    'investigation_notes': data.get('investigation_notes', ''),
                    'action_taken': data.get('action_taken', ''),
                    'feedback_to_citizen': data.get('feedback_to_citizen', ''),
                    'is_verified': data.get('status') == 'verified' or complaints_storage[complaint_id].get('is_verified', False),
                    'updated_at': datetime.now().isoformat()
                })
                
                return JsonResponse({
                    'success': True,
                    'message': 'Complaint updated successfully',
                    'complaint_id': complaint_id,
                    'updated_fields': data
                })
            else:
                return JsonResponse({'error': 'Complaint not found'}, status=404)
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
            
            if complaint_id in complaints_storage:
                complaints_storage[complaint_id]['is_verified'] = is_verified
                if is_verified:
                    complaints_storage[complaint_id]['status'] = 'verified'
                    complaints_storage[complaint_id]['verified_at'] = datetime.now().isoformat()
            
            return JsonResponse({
                'success': True,
                'message': 'Complaint verified successfully',
                'complaint_id': complaint_id,
                'is_verified': is_verified
            })
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# Submit new complaint (with user info)
@csrf_exempt
def complaints_list(request):
    if request.method == 'GET':
        return JsonResponse(list(complaints_storage.values()), safe=False)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            user = get_user_from_request(request)
            complaint_id = f"CMP-{uuid.uuid4().hex[:8].upper()}"
            
            # Store complaint with user information
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
                'priority': data.get('priority', 'medium'),
                'reported_at': datetime.now().isoformat(),
                'investigation_notes': '',
                'action_taken': '',
                'feedback_to_citizen': '',
                'user_id': str(user.id) if user else None,
                'user_name': user.username if user else None,
                'user_phone': user.phone if user else None,
                'user_email': user.email if user else None
            }
            
            complaints_storage[complaint_id] = complaint_data
            
            return JsonResponse({
                'success': True,
                'message': 'Complaint submitted successfully',
                'complaint_id': complaint_id,
                'priority': complaint_data['priority'],
                'evidence_count': len(data.get('evidence_documents', [])),
                'status': 'received'
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

# Get complaint statistics
@csrf_exempt
def complaint_stats(request):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if user.role not in ['officer', 'admin']:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    total = len(complaints_storage)
    pending = sum(1 for c in complaints_storage.values() if c.get('status') == 'pending')
    under_investigation = sum(1 for c in complaints_storage.values() if c.get('status') == 'under_investigation')
    verified = sum(1 for c in complaints_storage.values() if c.get('is_verified', False))
    resolved = sum(1 for c in complaints_storage.values() if c.get('status') == 'resolved')
    rejected = sum(1 for c in complaints_storage.values() if c.get('status') == 'rejected')
    escalated = sum(1 for c in complaints_storage.values() if c.get('status') == 'escalated')
    dismissed = sum(1 for c in complaints_storage.values() if c.get('status') == 'dismissed')
    
    by_priority = {
        'low': sum(1 for c in complaints_storage.values() if c.get('priority') == 'low'),
        'medium': sum(1 for c in complaints_storage.values() if c.get('priority') == 'medium'),
        'high': sum(1 for c in complaints_storage.values() if c.get('priority') == 'high'),
        'urgent': sum(1 for c in complaints_storage.values() if c.get('priority') == 'urgent')
    }
    
    by_service = {
        'passport': sum(1 for c in complaints_storage.values() if c.get('service_type') == 'passport'),
        'driving_license': sum(1 for c in complaints_storage.values() if c.get('service_type') == 'driving_license'),
        'birth_certificate': sum(1 for c in complaints_storage.values() if c.get('service_type') == 'birth_certificate'),
        'tax_id': sum(1 for c in complaints_storage.values() if c.get('service_type') == 'tax_id')
    }
    
    stats = {
        'total': total,
        'pending': pending,
        'under_investigation': under_investigation,
        'verified': verified,
        'rejected': rejected,
        'escalated': escalated,
        'resolved': resolved,
        'dismissed': dismissed,
        'by_priority': by_priority,
        'by_service': by_service,
        'avg_resolution_time_days': 7.5
    }
    
    return JsonResponse(stats)

def api_home(request):
    return JsonResponse({
        'message': 'Anti-Corruption Digital Service Tracker API',
        'status': 'active',
        'version': '1.0.0',
        'endpoints': {
            'complaints': '/api/complaints/',
            'all-complaints': '/api/complaints/all-complaints/',
            'my-complaints': '/api/complaints/my-complaints/',
            'admin-stats': '/api/dashboard/admin-stats/',
            'complaint-stats': '/api/complaints/stats/',
            'admin': '/admin/'
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_home),
    path('api/auth/', include('users.urls')),
    
    # Complaint endpoints
    path('api/complaints/', complaints_list),
    path('api/complaints/all-complaints/', all_complaints),
    path('api/complaints/my-complaints/', my_complaints),
    path('api/complaints/stats/', complaint_stats),
    path('api/complaints/<str:complaint_id>/verify/', verify_complaint),
    path('api/complaints/<str:complaint_id>/update-status/', update_complaint_status),
    path('api/complaints/<str:complaint_id>/', complaint_detail),
    
    # Dashboard stats
    path('api/dashboard/admin-stats/', admin_stats),
]