from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import Hearing
from .serializers import HearingSerializer
from complaints.models import Complaint
from users.models import Notification
import uuid

class CreateHearingView(generics.CreateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = HearingSerializer
    
    def post(self, request, complaint_id):
        try:
            complaint = Complaint.objects.get(complaint_id=complaint_id)
            
            # Check if user is officer or admin
            if request.user.role not in ['officer', 'admin']:
                return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
            # Check if complaint is escalated
            if complaint.status != 'escalated':
                return Response({'error': 'Hearing can only be scheduled for escalated complaints'}, status=400)
            
            # Get datetime from request
            scheduled_time = request.data.get('scheduled_time')
            if scheduled_time:
                # Convert to timezone-aware datetime
                from datetime import datetime
                scheduled_time = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
            
            # Create hearing - use 'complaint' (the ForeignKey field), not 'complaint_id'
            hearing = Hearing.objects.create(
                complaint=complaint,  # This is the correct field name
                officer=request.user,
                citizen=complaint.user,
                meeting_type=request.data.get('meeting_type', 'video'),
                scheduled_time=scheduled_time or timezone.now() + timezone.timedelta(days=1),
                duration_minutes=int(request.data.get('duration_minutes', 30)),
                notes=request.data.get('notes', ''),
                meeting_link=f"https://meet.jit.si/AntiCorruption_{complaint.complaint_id}_{uuid.uuid4().hex[:4]}"
            )
            
            # Send notification to citizen
            if complaint.user:
                Notification.objects.create(
                    user=complaint.user,
                    notification_type='system',
                    title='ডিজিটাল শুনানি নির্ধারিত',
                    message=f'আপনার অভিযোগ (ID: {complaint.complaint_id}) এর জন্য একটি ডিজিটাল শুনানি নির্ধারিত হয়েছে। সময়: {hearing.scheduled_time}',
                    priority='high',
                    complaint_id=complaint.complaint_id
                )
            
            return Response({
                'success': True,
                'message': 'Hearing scheduled successfully',
                'hearing': HearingSerializer(hearing).data
            }, status=status.HTTP_201_CREATED)
            
        except Complaint.DoesNotExist:
            return Response({'error': 'Complaint not found'}, status=404)
        except Exception as e:
            print(f"Error creating hearing: {e}")
            return Response({'error': str(e)}, status=500)

class MyHearingsView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = HearingSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'officer':
            return Hearing.objects.filter(officer=user).order_by('-scheduled_time')
        elif user.role == 'citizen':
            return Hearing.objects.filter(citizen=user).order_by('-scheduled_time')
        else:
            return Hearing.objects.all()

class HearingDetailView(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = HearingSerializer
    
    def get_object(self):
        return Hearing.objects.get(hearing_id=self.kwargs['hearing_id'])

class UpdateHearingStatusView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    
    def patch(self, request, hearing_id):
        try:
            hearing = Hearing.objects.get(hearing_id=hearing_id)
            
            if request.user != hearing.officer and request.user.role != 'admin':
                return Response({'error': 'Unauthorized'}, status=403)
            
            new_status = request.data.get('status')
            if new_status:
                hearing.status = new_status
                if new_status == 'ongoing':
                    hearing.started_at = timezone.now()
                elif new_status == 'completed':
                    hearing.ended_at = timezone.now()
                    hearing.resolution = request.data.get('resolution', '')
                    
                    # Update complaint status
                    hearing.complaint.status = 'under_investigation'
                    hearing.complaint.save()
                    
                    # Notify citizen
                    if hearing.citizen:
                        Notification.objects.create(
                            user=hearing.citizen,
                            notification_type='system',
                            title='শুনানি সম্পন্ন',
                            message=f'আপনার অভিযোগ (ID: {hearing.complaint.complaint_id}) এর শুনানি সম্পন্ন হয়েছে।',
                            priority='medium',
                            complaint_id=hearing.complaint.complaint_id
                        )
            
            hearing.save()
            
            return Response({
                'success': True,
                'message': f'Hearing status updated to {new_status}',
                'status': hearing.status
            })
        except Hearing.DoesNotExist:
            return Response({'error': 'Hearing not found'}, status=404)