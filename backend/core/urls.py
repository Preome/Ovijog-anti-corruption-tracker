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
from django.utils import timezone
from hearings import urls as hearings_urls


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
        'user_id': str(complaint.user.id) if complaint.user else None,
        'days_overdue': complaint.days_overdue(),
        'can_be_public': complaint.can_be_public(),
        'is_public': complaint.is_public,
        'legal_deadline': complaint.legal_deadline.isoformat() if complaint.legal_deadline else None,
        'upvotes_count': complaint.upvotes_count,
        'days_remaining': complaint.days_remaining(),
    }


# Root health check endpoint
def health_check(request):
    return JsonResponse({
        'status': 'ok',
        'message': 'Anti-Corruption Digital Service Tracker API is running',
        'version': '1.0.0',
        'environment': 'production',
        'endpoints': {
            'api_root': '/api/',
            'admin_panel': '/admin/',
            'auth': '/api/auth/',
            'complaints': '/api/complaints/',
            'hearings': '/api/hearings/',
            'public_pressure': '/api/public-complaints/',
            'notifications': '/api/notifications/',
        },
        'deployed_on': 'Render.com',
        'documentation': 'https://github.com/Preome/Ovijog-anti-corruption-tracker'
    })


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
            
            complaint = Complaint.objects.create(
                service_type=data.get('service_type'),
                office_location=data.get('office_location'),
                incident_date=incident_date,
                description=data.get('description'),
                amount_requested=data.get('amount_requested') if data.get('amount_requested') else None,
                officer_name=data.get('officer_name', ''),
                evidence_documents=data.get('evidence_documents', []),
                is_anonymous=data.get('is_anonymous', True),
                priority=data.get('priority', 'medium'),
                status='pending',
                user=user if user else None
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
            
            # UPDATE TRUST SCORE based on complaint resolution
            if complaint.user and not complaint.is_anonymous:
                complaint.user.total_complaints = Complaint.objects.filter(user=complaint.user).count()
                
                points_changed = 0
                old_points = complaint.user.trust_score
                
                if new_status == 'verified' and old_status != 'verified':
                    complaint.user.verified_complaints += 1
                    points_changed = 5
                    print(f"✅ +5 points for verified complaint")
                    
                elif new_status == 'rejected' and old_status != 'rejected':
                    complaint.user.rejected_complaints += 1
                    points_changed = -10
                    print(f"⚠️ -10 points for rejected complaint")
                    
                elif new_status == 'dismissed' and old_status != 'dismissed':
                    complaint.user.rejected_complaints += 1
                    points_changed = -15
                    print(f"❌ -15 points for fake complaint")
                
                if points_changed != 0:
                    complaint.user.calculate_trust_score()
                    print(f"Trust score changed: {old_points} → {complaint.user.trust_score}")
                    
                    if points_changed > 0:
                        Notification.objects.create(
                            user=complaint.user,
                            notification_type='system',
                            title='ট্রাস্ট স্কোর বেড়েছে! 🎉',
                            message=f'আপনার অভিযোগ (ID: {complaint.complaint_id}) যাচাইকৃত হয়েছে। ট্রাস্ট স্কোর +{points_changed} পয়েন্ট বেড়েছে।',
                            priority='medium',
                            complaint_id=complaint.complaint_id
                        )
                    else:
                        Notification.objects.create(
                            user=complaint.user,
                            notification_type='system',
                            title='ট্রাস্ট স্কোর কমেছে ⚠️',
                            message=f'আপনার অভিযোগ (ID: {complaint.complaint_id}) প্রত্যাখ্যাত হয়েছে। ট্রাস্ট স্কোর {points_changed} পয়েন্ট কমেছে। সতর্ক থাকুন।',
                            priority='high',
                            complaint_id=complaint.complaint_id
                        )
                
                complaint.user.save()
            
            feedback = data.get('feedback_to_citizen', '')
            if feedback:
                complaint.feedback_to_citizen = feedback
                
                if complaint.user and not complaint.is_anonymous:
                    Notification.objects.create(
                        user=complaint.user,
                        notification_type='officer_response',
                        title='কর্তৃপক্ষের প্রতিক্রিয়া',
                        message=feedback,
                        priority='medium',
                        complaint_id=complaint.complaint_id
                    )
            
            if new_status == 'verified':
                complaint.resolution_date = datetime.now()
            
            complaint.save()
            
            # Create notification for status change
            if old_status != new_status and complaint.user and not complaint.is_anonymous:
                status_titles = {
                    'under_investigation': 'তদন্ত শুরু হয়েছে',
                    'verified': 'অভিযোগ যাচাই করা হয়েছে',
                    'rejected': 'অভিযোগ প্রমাণিত হয়নি',
                    'resolved': 'অভিযোগ নিষ্পত্তি হয়েছে',
                    'escalated': 'অভিযোগ উর্ধ্বতন কর্তৃপক্ষে প্রেরিত'
                }
                
                title = status_titles.get(new_status, 'অভিযোগের অবস্থা পরিবর্তন')
                message = f'আপনার অভিযোগ (ID: {complaint.complaint_id}) এর অবস্থা "{new_status}" এ পরিবর্তিত হয়েছে।'
                
                Notification.objects.create(
                    user=complaint.user,
                    notification_type='complaint_status',
                    title=title,
                    message=message,
                    priority='medium' if new_status not in ['verified', 'resolved'] else 'high',
                    complaint_id=complaint.complaint_id
                )
            
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


# Make complaint public
@csrf_exempt
def make_complaint_public(request, complaint_id):
    user = get_user_from_request(request)
    
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    try:
        complaint = Complaint.objects.get(complaint_id=complaint_id)
        
        # Verify user owns the complaint
        if complaint.user != user:
            return JsonResponse({'error': 'Unauthorized'}, status=403)
        
        # Check if eligible for public mode
        if not complaint.can_be_public():
            remaining_days = complaint.days_remaining()
            return JsonResponse({
                'error': f'Complaint not eligible for public mode. {remaining_days} days remaining until deadline.',
                'remaining_days': remaining_days
            }, status=400)
        
        complaint.is_public = True
        complaint.public_activated_at = timezone.now()
        complaint.save()
        
        # Create notification for officers
        officers = User.objects.filter(role='officer')
        for officer in officers:
            Notification.objects.create(
                user=officer,
                notification_type='system',
                title='জনতার চাপ - অভিযোগ পাবলিক হয়েছে',
                message=f'অভিযোগ {complaint.complaint_id} পাবলিক করা হয়েছে। দয়া করে দ্রুত ব্যবস্থা নিন।',
                priority='high',
                complaint_id=complaint.complaint_id
            )
        
        return JsonResponse({
            'success': True,
            'message': 'Complaint is now public',
            'public_url': f'/public-pressure/{complaint.complaint_id}'
        })
    except Complaint.DoesNotExist:
        return JsonResponse({'error': 'Complaint not found'}, status=404)
    except Exception as e:
        print(f"Error in make_complaint_public: {e}")
        return JsonResponse({'error': str(e)}, status=500)


# Get public complaints (Public Pressure Board)
@csrf_exempt
def public_complaints(request):
    complaints = Complaint.objects.filter(is_public=True).order_by('-public_activated_at')
    complaints_data = []
    for c in complaints:
        if c.is_anonymous:
            reporter_trust_score = None
            reporter_trust_level = None
            reported_by = 'বেনামী (পরিচয় গোপন)'
            trust_badge = 'anonymous'
        else:
            if c.user:
                reporter_trust_score = getattr(c.user, 'trust_score', 50)
                reporter_trust_level = getattr(c.user, 'trust_level', 'medium')
                reported_by = c.user.full_name_bn or c.user.username
                trust_badge = reporter_trust_level
            else:
                reporter_trust_score = None
                reporter_trust_level = None
                reported_by = 'অজানা'
                trust_badge = 'unknown'
        
        complaints_data.append({
            'complaint_id': c.complaint_id,
            'office_location': c.office_location,
            'service_type': c.service_type,
            'description': c.description[:200],
            'days_overdue': c.days_overdue(),
            'status': c.status,
            'public_activated_at': c.public_activated_at.isoformat() if c.public_activated_at else None,
            'upvotes': getattr(c, 'upvotes_count', 0),
            'reporter_trust_score': reporter_trust_score,
            'reporter_trust_level': reporter_trust_level,
            'is_anonymous': c.is_anonymous,
            'reported_by': reported_by,
            'trust_badge': trust_badge
        })
    return JsonResponse(complaints_data, safe=False)


# Upvote public complaint (public pressure)
@csrf_exempt
def upvote_public_complaint(request, complaint_id):
    try:
        complaint = Complaint.objects.get(complaint_id=complaint_id)
        
        if not hasattr(complaint, 'upvotes_count'):
            complaint.upvotes_count = 0
        complaint.upvotes_count += 1
        complaint.save()
        
        return JsonResponse({
            'success': True,
            'upvotes': complaint.upvotes_count
        })
    except Complaint.DoesNotExist:
        return JsonResponse({'error': 'Complaint not found'}, status=404)


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
    # Root endpoint - Health check
    path('', health_check, name='health_check'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # API
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
    path('api/complaints/<str:complaint_id>/make-public/', make_complaint_public),
    
    # Public complaints (Pressure Board)
    path('api/public-complaints/', public_complaints),
    path('api/public-complaints/<str:complaint_id>/upvote/', upvote_public_complaint),
    
    # Dashboard stats
    path('api/dashboard/admin-stats/', admin_stats),
    
    # Hearings
    path('api/hearings/', include(hearings_urls)),
]