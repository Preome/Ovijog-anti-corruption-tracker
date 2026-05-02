from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
import json
import uuid
from datetime import datetime
from django.views.decorators.csrf import csrf_exempt
from complaints.models import Complaint
from users.models import User, Notification
from users import views as users_views

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

# Helper function to convert complaint to dict
def complaint_to_dict(complaint):
    return {
        'id': str(complaint.id),
        'complaint_id': complaint.complaint_id,
        'service_type': complaint.service_type,
        'office_location': complaint.office_location,
        'incident_date': complaint.incident_date.isoformat() if complaint.incident_date else None,
        'description': complaint.description,
        'amount_requested': str(complaint.amount_requested) if complaint.amount_requested else None,
        'officer_name': complaint.officer_name,
        'status': complaint.status,
        'priority': complaint.priority,
        'is_verified': complaint.status == 'verified',
        'is_anonymous': complaint.is_anonymous,
        'evidence_documents': complaint.evidence_documents,
        'investigation_notes': complaint.investigation_notes,
        'action_taken': complaint.action_taken,
        'feedback_to_citizen': complaint.feedback_to_citizen,
        'reported_at': complaint.reported_at.isoformat() if complaint.reported_at else None,
        'updated_at': complaint.updated_at.isoformat() if hasattr(complaint, 'updated_at') and complaint.updated_at else None,
        'user_id': str(complaint.user.id) if complaint.user and not complaint.is_anonymous else None,  # Hide for anonymous
    }

# Get all complaints (for officers - filtered by department)
@csrf_exempt
def all_complaints(request):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if user.role not in ['officer', 'admin']:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    try:
        if user.role == 'admin':
            complaints = Complaint.objects.all().order_by('-reported_at')
        else:
            if user.department:
                complaints = Complaint.objects.filter(
                    service_type=user.department.name
                ).order_by('-reported_at')
            else:
                complaints = Complaint.objects.none()
        
        complaints_data = []
        for c in complaints:
            complaint_dict = complaint_to_dict(c)
            # If complaint is anonymous, hide user info from officers
            if c.is_anonymous:
                complaint_dict['user_id'] = None
                complaint_dict['user_name'] = 'Anonymous'
            complaints_data.append(complaint_dict)
        
        return JsonResponse(complaints_data, safe=False)
    except Exception as e:
        print(f"Error in all_complaints: {e}")
        return JsonResponse({'error': str(e)}, status=500)

# Get my complaints (for citizens)
@csrf_exempt
def my_complaints(request):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    try:
        complaints = Complaint.objects.filter(user=user).order_by('-reported_at')
        complaints_data = [complaint_to_dict(c) for c in complaints]
        
        print(f"User: {user.username}, Found {len(complaints_data)} complaints")
        
        return JsonResponse(complaints_data, safe=False)
    except Exception as e:
        print(f"Error in my_complaints: {e}")
        return JsonResponse({'error': str(e)}, status=500)

# Admin stats (for officers)
@csrf_exempt
def admin_stats(request):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if user.role not in ['officer', 'admin']:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    try:
        if user.role == 'admin':
            complaints_qs = Complaint.objects.all()
        else:
            if user.department:
                complaints_qs = Complaint.objects.filter(service_type=user.department.name)
            else:
                complaints_qs = Complaint.objects.none()
        
        total_complaints = complaints_qs.count()
        verified_complaints = complaints_qs.filter(status='verified').count()
        pending_complaints = complaints_qs.filter(status='pending').count()
        under_investigation = complaints_qs.filter(status='under_investigation').count()
        resolved_complaints = complaints_qs.filter(status='resolved').count()
        urgent_complaints = complaints_qs.filter(priority='urgent').count()
        high_priority = complaints_qs.filter(priority='high').count()
        medium_priority = complaints_qs.filter(priority='medium').count()
        low_priority = complaints_qs.filter(priority='low').count()
        
        # Calculate corruption hotspots
        hotspots = {}
        for complaint in complaints_qs:
            location = complaint.office_location
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
    except Exception as e:
        print(f"Error in admin_stats: {e}")
        return JsonResponse({'error': str(e)}, status=500)

# Get single complaint details
@csrf_exempt
def complaint_detail(request, complaint_id):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if user.role not in ['officer', 'admin']:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    try:
        complaint = Complaint.objects.get(complaint_id=complaint_id)
        return JsonResponse(complaint_to_dict(complaint))
    except Complaint.DoesNotExist:
        return JsonResponse({'error': 'Complaint not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# Submit new complaint
@csrf_exempt
def complaints_list(request):
    if request.method == 'GET':
        complaints = Complaint.objects.all().order_by('-reported_at')
        complaints_data = [complaint_to_dict(c) for c in complaints]
        return JsonResponse(complaints_data, safe=False)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            user = get_user_from_request(request)
            
            incident_date = datetime.fromisoformat(data.get('incident_date').replace('Z', '+00:00')) if data.get('incident_date') else datetime.now()
            
            # ALWAYS link the user if logged in, regardless of is_anonymous
            complaint = Complaint.objects.create(
                service_type=data.get('service_type'),
                office_location=data.get('office_location'),
                incident_date=incident_date,
                description=data.get('description'),
                amount_requested=data.get('amount_requested') if data.get('amount_requested') else None,
                officer_name=data.get('officer_name', ''),
                evidence_documents=data.get('evidence_documents', []),
                is_anonymous=data.get('is_anonymous', True),  # This only controls display to officers
                priority=data.get('priority', 'medium'),
                status='pending',
                user=user if user else None  # Always link user if logged in
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Complaint submitted successfully',
                'complaint_id': complaint.complaint_id,
                'status': 'received'
            }, status=201)
        except Exception as e:
            print(f"Error creating complaint: {e}")
            return JsonResponse({'error': str(e)}, status=500)

# Update complaint status
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
            complaint = Complaint.objects.get(complaint_id=complaint_id)
            
            old_status = complaint.status
            new_status = data.get('status', complaint.status)
            
            # Update fields
            complaint.status = new_status
            complaint.priority = data.get('priority', complaint.priority)
            complaint.investigation_notes = data.get('investigation_notes', complaint.investigation_notes)
            complaint.action_taken = data.get('action_taken', complaint.action_taken)
            
            feedback = data.get('feedback_to_citizen', '')
            if feedback:
                complaint.feedback_to_citizen = feedback
                
                # Create notification for officer response
                if complaint.user:
                    Notification.objects.create(
                        user=complaint.user,
                        notification_type='officer_response',
                        title='কর্তৃপক্ষের প্রতিক্রিয়া',
                        message=feedback,
                        priority='medium',
                        complaint_id=complaint.complaint_id
                    )
                    print(f"📧 Response notification sent to {complaint.user.username}")
            
            if new_status == 'verified':
                complaint.resolution_date = datetime.now()
            
            complaint.save()
            
            # Create notification for status change
            if old_status != new_status and complaint.user:
                # Define status messages in Bengali
                status_titles = {
                    'under_investigation': 'তদন্ত শুরু হয়েছে',
                    'verified': 'অভিযোগ যাচাই করা হয়েছে',
                    'rejected': 'অভিযোগ প্রমাণিত হয়নি',
                    'resolved': 'অভিযোগ নিষ্পত্তি হয়েছে',
                    'escalated': 'অভিযোগ উর্ধ্বতন কর্তৃপক্ষে প্রেরিত'
                }
                
                status_messages = {
                    'under_investigation': f'আপনার অভিযোগ (ID: {complaint.complaint_id}) এর তদন্ত শুরু হয়েছে।',
                    'verified': f'আপনার অভিযোগ (ID: {complaint.complaint_id}) যাচাই করা হয়েছে এবং সঠিক বলে প্রমাণিত হয়েছে।',
                    'rejected': f'আপনার অভিযোগ (ID: {complaint.complaint_id}) পর্যাপ্ত প্রমাণের অভাবে প্রত্যাখ্যান করা হয়েছে।',
                    'resolved': f'আপনার অভিযোগ (ID: {complaint.complaint_id}) নিষ্পত্তি করা হয়েছে। প্রয়োজনীয় ব্যবস্থা নেওয়া হয়েছে।',
                    'escalated': f'আপনার অভিযোগ (ID: {complaint.complaint_id}) উর্ধ্বতন কর্তৃপক্ষে প্রেরণ করা হয়েছে।'
                }
                
                title = status_titles.get(new_status, 'অভিযোগের অবস্থা পরিবর্তন')
                message = status_messages.get(new_status, f'আপনার অভিযোগ (ID: {complaint.complaint_id}) এর অবস্থা "{new_status}" এ পরিবর্তিত হয়েছে।')
                priority = 'high' if new_status in ['verified', 'resolved'] else 'medium'
                
                Notification.objects.create(
                    user=complaint.user,
                    notification_type='complaint_status',
                    title=title,
                    message=message,
                    priority=priority,
                    complaint_id=complaint.complaint_id
                )
                print(f"📧 Status notification sent to {complaint.user.username}: {old_status} -> {new_status}")
            
            return JsonResponse({
                'success': True,
                'message': 'Complaint updated successfully',
                'complaint_id': complaint_id,
                'updated_fields': data
            })
        except Complaint.DoesNotExist:
            return JsonResponse({'error': 'Complaint not found'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            print(f"Error in update_complaint_status: {e}")
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# Get complaint statistics
@csrf_exempt
def complaint_stats(request):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if user.role not in ['officer', 'admin']:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    try:
        total = Complaint.objects.count()
        pending = Complaint.objects.filter(status='pending').count()
        under_investigation = Complaint.objects.filter(status='under_investigation').count()
        verified = Complaint.objects.filter(status='verified').count()
        resolved = Complaint.objects.filter(status='resolved').count()
        rejected = Complaint.objects.filter(status='rejected').count()
        escalated = Complaint.objects.filter(status='escalated').count()
        dismissed = Complaint.objects.filter(status='dismissed').count()
        
        by_priority = {
            'low': Complaint.objects.filter(priority='low').count(),
            'medium': Complaint.objects.filter(priority='medium').count(),
            'high': Complaint.objects.filter(priority='high').count(),
            'urgent': Complaint.objects.filter(priority='urgent').count()
        }
        
        by_service = {
            'passport': Complaint.objects.filter(service_type='passport').count(),
            'driving_license': Complaint.objects.filter(service_type='driving_license').count(),
            'birth_certificate': Complaint.objects.filter(service_type='birth_certificate').count(),
            'tax_id': Complaint.objects.filter(service_type='tax_id').count()
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
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

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

# URL Patterns
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_home),
    path('api/auth/', include('users.urls')),
    
    # Notification endpoints
    path('api/notifications/', users_views.NotificationListView.as_view(), name='notifications'),
    path('api/notifications/unread-count/', users_views.UnreadNotificationCountView.as_view(), name='unread-count'),
    path('api/notifications/<str:notification_id>/read/', users_views.MarkNotificationReadView.as_view(), name='mark-read'),
    path('api/notifications/mark-all-read/', users_views.MarkAllNotificationsReadView.as_view(), name='mark-all-read'),
    path('api/notifications/<str:notification_id>/delete/', users_views.DeleteNotificationView.as_view(), name='delete'),
    
    # Complaint endpoints
    path('api/complaints/', complaints_list),
    path('api/complaints/all-complaints/', all_complaints),
    path('api/complaints/my-complaints/', my_complaints),
    path('api/complaints/stats/', complaint_stats),
    path('api/complaints/<str:complaint_id>/update-status/', update_complaint_status),
    path('api/complaints/<str:complaint_id>/', complaint_detail),
    
    # Dashboard stats
    path('api/dashboard/admin-stats/', admin_stats),
]