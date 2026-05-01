from django.db import models
import uuid

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
    
    # New fields for complaint management
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    assigned_to = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_complaints')
    investigation_notes = models.TextField(blank=True)
    action_taken = models.TextField(blank=True)
    resolution_date = models.DateTimeField(null=True, blank=True)
    feedback_to_citizen = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.complaint_id:
            self.complaint_id = f"CMP-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.complaint_id} - {self.status}"