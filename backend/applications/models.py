from django.db import models
import uuid

class Application(models.Model):
    SERVICE_TYPES = [
        ('passport', 'Passport'),
        ('driving_license', 'Driving License'),
        ('birth_certificate', 'Birth Certificate'),
        ('tax_id', 'Tax ID'),
    ]
    
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('document_verification', 'Document Verification'),
        ('processing', 'Processing'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('delayed', 'Delayed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tracking_number = models.CharField(max_length=20, unique=True)
    service_type = models.CharField(max_length=50, choices=SERVICE_TYPES)
    applicant_name_bn = models.CharField(max_length=200)  # Bengali name
    applicant_name_en = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='submitted')
    current_officer = models.CharField(max_length=100)
    office_location = models.CharField(max_length=200)
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expected_completion_date = models.DateTimeField()
    actual_completion_date = models.DateTimeField(null=True, blank=True)
    qr_code = models.ImageField(upload_to='qr_codes/', null=True)
    blockchain_hash = models.CharField(max_length=255, null=True, blank=True)
    risk_score = models.FloatField(default=0.0)  # AI-calculated
    
    def __str__(self):
        return f"{self.tracking_number} - {self.service_type}"

class ApplicationTimeline(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='timeline')
    status = models.CharField(max_length=50)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class BriberyReport(models.Model):
    complaint_id = models.CharField(max_length=50, unique=True)
    service_type = models.CharField(max_length=50)
    office_location = models.CharField(max_length=200)
    incident_date = models.DateTimeField()
    amount_requested = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    officer_name = models.CharField(max_length=200, blank=True)
    description = models.TextField()
    evidence_documents = models.JSONField(default=list)  # Store file paths
    reported_at = models.DateTimeField(auto_now_add=True)
    is_anonymous = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        if not self.complaint_id:
            self.complaint_id = f"BR-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)