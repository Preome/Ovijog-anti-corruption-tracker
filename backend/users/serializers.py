from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.conf import settings
from .models import User, UserProfile, Department, Notification
import uuid
import random

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ('id', 'name', 'name_bn', 'description')

class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name_bn', read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'status', 'nid', 'phone', 
                 'full_name_bn', 'office_name', 'designation', 'department', 
                 'department_name', 'email_verified', 'is_verified', 'created_at')
        read_only_fields = ('id', 'created_at', 'is_verified', 'email_verified', 'status')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'phone', 'nid', 'role', 
                 'full_name_bn', 'office_name', 'designation', 'department')
        extra_kwargs = {
            'phone': {'required': False, 'allow_null': True, 'allow_blank': True},
            'nid': {'required': False, 'allow_null': True, 'allow_blank': True},
            'full_name_bn': {'required': False, 'allow_blank': True},
            'office_name': {'required': False, 'allow_blank': True},
            'designation': {'required': False, 'allow_blank': True},
            'department': {'required': False, 'allow_null': True},
        }
    
    def validate_department(self, value):
        if not value:
            return None
        try:
            if isinstance(value, str):
                dept_id = int(value)
            else:
                dept_id = value
            department = Department.objects.get(id=dept_id)
            return department
        except (ValueError, TypeError, Department.DoesNotExist):
            raise serializers.ValidationError("Invalid department selected")
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        attrs.pop('password2')
        
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "Username already exists."})
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already exists."})
        
        if attrs.get('phone') and User.objects.filter(phone=attrs['phone']).exists():
            raise serializers.ValidationError({"phone": "Phone number already exists."})
        
        if attrs.get('nid') and User.objects.filter(nid=attrs['nid']).exists():
            raise serializers.ValidationError({"nid": "NID already exists."})
        
        if attrs.get('phone'):
            import re
            if not re.match(r'^01[3-9]\d{8}$', attrs['phone']):
                raise serializers.ValidationError({"phone": "Invalid phone number. Use 01XXXXXXXXX"})
        
        if attrs.get('nid'):
            if not (len(attrs['nid']) == 10 or len(attrs['nid']) == 17) or not attrs['nid'].isdigit():
                raise serializers.ValidationError({"nid": "NID must be 10 or 17 digits"})
        
        if attrs.get('role') == 'officer':
            if not attrs.get('office_name'):
                raise serializers.ValidationError({"office_name": "Office name is required"})
            
            dept_value = attrs.get('department')
            if not dept_value:
                raise serializers.ValidationError({"department": "Department is required"})
            
            if isinstance(dept_value, Department):
                attrs['department'] = dept_value
            else:
                try:
                    dept_id = int(dept_value) if isinstance(dept_value, str) else dept_value
                    attrs['department'] = Department.objects.get(id=dept_id)
                except (ValueError, Department.DoesNotExist):
                    raise serializers.ValidationError({"department": "Invalid department"})
        
        for field in ['phone', 'nid', 'full_name_bn', 'office_name', 'designation']:
            if attrs.get(field) == '':
                attrs[field] = None
        
        return attrs
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.status = 'pending' if user.role == 'officer' else 'approved'
        user.save()
        UserProfile.objects.get_or_create(user=user)
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

class ApproveUserSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['approved', 'rejected'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

# Notification Serializer
class NotificationSerializer(serializers.ModelSerializer):
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ('id', 'notification_type', 'title', 'message', 'priority', 
                 'is_read', 'created_at', 'read_at', 'time_ago')
    
    def get_time_ago(self, obj):
        from django.utils import timezone
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"{diff.days} দিন আগে"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} ঘন্টা আগে"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} মিনিট আগে"
        else:
            return "এখনই"