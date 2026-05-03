from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
import uuid

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    name_bn = models.CharField(max_length=100, verbose_name='নাম (বাংলা)')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class User(AbstractUser):
    ROLE_CHOICES = [
        ('citizen', 'নাগরিক'),
        ('officer', 'সরকারি কর্মকর্তা'),
        ('admin', 'প্রশাসক'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='citizen')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    trust_score = models.FloatField(default=0)
    trust_level = models.CharField(max_length=20, default='medium')
    
    nid = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        validators=[RegexValidator(r'^\d{10}$|^\d{17}$', 'NID must be 10 or 17 digits')]
    )
    
    phone_regex = RegexValidator(
        regex=r'^01[3-9]\d{8}$',
        message='Phone number must be valid Bangladeshi number (e.g., 017XXXXXXXX)'
    )
    phone = models.CharField(
        validators=[phone_regex],
        max_length=15,
        unique=True,
        null=True,
        blank=True
    )
    
    full_name_bn = models.CharField(max_length=200, blank=True, verbose_name='পূর্ণ নাম (বাংলা)')
    office_name = models.CharField(max_length=255, blank=True, verbose_name='অফিসের নাম')
    designation = models.CharField(max_length=255, blank=True, verbose_name='পদবি')
    
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='officers')
    
    email_verified = models.BooleanField(default=False)
    
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)
    otp_attempts = models.IntegerField(default=0)
    
    approved_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_users')
    approved_at = models.DateTimeField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True)
    
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.username} - {self.get_role_display()}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    address = models.TextField(blank=True)
    district = models.CharField(max_length=100, blank=True)
    upazila = models.CharField(max_length=100, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username}'s profile"

# Notification Model
class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('complaint_status', 'Complaint Status Change'),
        ('complaint_verified', 'Complaint Verified'),
        ('complaint_resolved', 'Complaint Resolved'),
        ('complaint_rejected', 'Complaint Rejected'),
        ('officer_response', 'Officer Response'),
        ('system', 'System Notification'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    complaint_id = models.CharField(max_length=50, blank=True, null=True)
    
    is_read = models.BooleanField(default=False)
    is_email_sent = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
    
    def mark_as_read(self):
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save()
        
        
        
        
# Add these fields to the User model
trust_score = models.IntegerField(default=50)
trust_level = models.CharField(max_length=20, default='medium') 
total_complaints = models.IntegerField(default=0)
verified_complaints = models.IntegerField(default=0)
rejected_complaints = models.IntegerField(default=0)
successful_applications = models.IntegerField(default=0)
trust_level = models.CharField(max_length=20, default='medium')

# Add method to calculate trust level
def update_trust_level(self):
    if self.trust_score >= 80:
        self.trust_level = 'high'
    elif self.trust_score >= 50:
        self.trust_level = 'medium'
    else:
        self.trust_level = 'low'
    self.save()

def calculate_trust_score(self):
    """Recalculate trust score based on history"""
    score = 50  # Base score
    
    # Add points for verified complaints (max +30)
    score += min(self.verified_complaints * 5, 30)
    
    # Add points for successful applications (max +20)
    score += min(self.successful_applications * 3, 20)
    
    # Subtract for rejected/fake complaints
    score -= self.rejected_complaints * 10
    
    # Ensure score stays between 0 and 100
    self.trust_score = max(0, min(100, score))
    self.update_trust_level()
    self.save()