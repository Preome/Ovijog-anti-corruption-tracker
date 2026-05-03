from django.db import models
import uuid
from users.models import User
from complaints.models import Complaint

class Hearing(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rescheduled', 'Rescheduled'),
    ]
    
    MEETING_TYPE_CHOICES = [
        ('video', 'Video Conference'),
        ('audio', 'Audio Call'),
        ('chat', 'Text Chat'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hearing_id = models.CharField(max_length=50, unique=True, blank=True)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='hearings')
    
    # Participants
    officer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='officer_hearings')
    citizen = models.ForeignKey(User, on_delete=models.CASCADE, related_name='citizen_hearings')
    
    # Meeting Details
    meeting_type = models.CharField(max_length=20, choices=MEETING_TYPE_CHOICES, default='video')
    scheduled_time = models.DateTimeField()
    duration_minutes = models.IntegerField(default=30)
    meeting_link = models.URLField(max_length=500, blank=True, null=True)
    meeting_id = models.CharField(max_length=100, blank=True, null=True)
    meeting_password = models.CharField(max_length=50, blank=True, null=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    notes = models.TextField(blank=True)
    resolution = models.TextField(blank=True)
    
    # Recording
    is_recorded = models.BooleanField(default=False)
    recording_url = models.URLField(max_length=500, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.hearing_id:
            self.hearing_id = f"HRG-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.hearing_id} - {self.complaint.complaint_id}"
    
    class Meta:
        ordering = ['-scheduled_time']