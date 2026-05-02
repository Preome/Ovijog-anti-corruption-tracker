from django.db import models
import uuid
from users.models import User
from datetime import timedelta
from django.utils import timezone

class Complaint(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('under_investigation', 'Under Investigation'),
        ('verified', 'Verified - Action Taken'),
        ('rejected', 'Rejected - Insufficient Evidence'),
        ('escalated', 'Escalated to Higher Authority'),
        ('resolved', 'Resolved - Action Completed'),
        ('dismissed', 'Dismissed - False Report'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint_id = models.CharField(max_length=50, unique=True, blank=True)
    service_type = models.CharField(max_length=50)
    office_location = models.CharField(max_length=200)
    incident_date = models.DateTimeField()
    amount_requested = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    officer_name = models.CharField(max_length=200, blank=True)
    description = models.TextField()
    evidence_documents = models.JSONField(default=list)
    reported_at = models.DateTimeField(auto_now_add=True)
    is_anonymous = models.BooleanField(default=True)
    
    # ForeignKey to User
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='complaints')
    
    # Complaint management fields
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_complaints')
    investigation_notes = models.TextField(blank=True)
    action_taken = models.TextField(blank=True)
    resolution_date = models.DateTimeField(null=True, blank=True)
    feedback_to_citizen = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Public Pressure Mode fields
    is_public = models.BooleanField(default=False)
    public_activated_at = models.DateTimeField(null=True, blank=True)
    legal_deadline = models.DateTimeField(null=True, blank=True)
    escalation_count = models.IntegerField(default=0)
    last_escalation_at = models.DateTimeField(null=True, blank=True)
    upvotes_count = models.IntegerField(default=0)
    
    def save(self, *args, **kwargs):
        if not self.complaint_id:
            self.complaint_id = f"CMP-{uuid.uuid4().hex[:8].upper()}"
        
        # Set legal deadline (e.g., 15 days from reported date)
        if not self.legal_deadline and self.reported_at:
            self.legal_deadline = self.reported_at + timedelta(days=1)
        
        super().save(*args, **kwargs)
    
    def can_be_public(self):
        """Check if complaint is eligible for public mode"""
        if self.is_public:
            return False
        if self.legal_deadline and timezone.now() > self.legal_deadline:
            return True
        return False
    
    def days_overdue(self):
        """Calculate how many days overdue the complaint is"""
        if self.legal_deadline and timezone.now() > self.legal_deadline:
            delta = timezone.now() - self.legal_deadline
            return delta.days
        return 0
    
    def days_remaining(self):
        """Calculate how many days remaining until deadline"""
        if self.legal_deadline and timezone.now() < self.legal_deadline:
            delta = self.legal_deadline - timezone.now()
            return delta.days
        return 0
    
    def escalate(self):
        """Escalate the complaint to higher authority"""
        self.escalation_count += 1
        self.last_escalation_at = timezone.now()
        if self.escalation_count >= 3:
            self.status = 'escalated'
        self.save()
    
    def __str__(self):
        status_display = dict(self.STATUS_CHOICES).get(self.status, self.status)
        return f"{self.complaint_id} - {status_display}"