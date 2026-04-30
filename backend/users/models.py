from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
import uuid

class User(AbstractUser):
    ROLE_CHOICES = [
        ('citizen', 'নাগরিক'),
        ('officer', 'সরকারি কর্মকর্তা'),
        ('admin', 'প্রশাসক'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='citizen')
    
    # NID (National ID) - 10 or 17 digits
    nid = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        validators=[RegexValidator(r'^\d{10}$|^\d{17}$', 'NID must be 10 or 17 digits')]
    )
    
    # Phone number
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
    
    # Additional fields
    full_name_bn = models.CharField(max_length=200, blank=True, verbose_name='পূর্ণ নাম (বাংলা)')
    office_name = models.CharField(max_length=255, blank=True, verbose_name='অফিসের নাম')
    designation = models.CharField(max_length=255, blank=True, verbose_name='পদবি')
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