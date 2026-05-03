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
        """Validate department field - convert ID to Department object"""
        print(f"validate_department called with: {value} (type: {type(value)})")
        
        if value is None or value == '':
            return None
        
        # If it's already a Department object, return it
        if isinstance(value, Department):
            print(f"Already a Department object: {value.name_bn}")
            return value
        
        # Try to convert to integer and get Department
        try:
            dept_id = int(value)
            department = Department.objects.get(id=dept_id)
            print(f"Converted to Department: {department.name_bn}")
            return department
        except (ValueError, TypeError):
            raise serializers.ValidationError(f"Department ID must be a number, got {value}")
        except Department.DoesNotExist:
            raise serializers.ValidationError(f"Department with ID {value} does not exist")
    
    def validate(self, attrs):
        print("=" * 50)
        print(f"Validating attrs: {attrs}")
        
        # Check passwords match
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Remove password2
        attrs.pop('password2')
        
        # Check if username exists
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "Username already exists."})
        
        # Check if email exists
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already exists."})
        
        # Check if phone exists (if provided)
        if attrs.get('phone'):
            if User.objects.filter(phone=attrs['phone']).exists():
                raise serializers.ValidationError({"phone": "Phone number already exists."})
        
        # Check if NID exists (if provided)
        if attrs.get('nid'):
            if User.objects.filter(nid=attrs['nid']).exists():
                raise serializers.ValidationError({"nid": "NID already exists."})
        
        # Validate phone format if provided
        if attrs.get('phone'):
            import re
            phone_pattern = r'^01[3-9]\d{8}$'
            if not re.match(phone_pattern, attrs['phone']):
                raise serializers.ValidationError({"phone": "Invalid phone number format. Use 01XXXXXXXXX"})
        
        # Validate NID format if provided
        if attrs.get('nid'):
            if not (len(attrs['nid']) == 10 or len(attrs['nid']) == 17):
                raise serializers.ValidationError({"nid": "NID must be 10 or 17 digits"})
            if not attrs['nid'].isdigit():
                raise serializers.ValidationError({"nid": "NID must contain only digits"})
        
        # Validate officer-specific fields
        if attrs.get('role') == 'officer':
            if not attrs.get('office_name'):
                raise serializers.ValidationError({"office_name": "Office name is required for officers"})
            
            # Department validation
            dept_value = attrs.get('department')
            if not dept_value:
                raise serializers.ValidationError({"department": "Department is required for officers"})
            
            # If department is not already a Department object, convert it
            if not isinstance(dept_value, Department):
                try:
                    dept_id = int(dept_value)
                    attrs['department'] = Department.objects.get(id=dept_id)
                    print(f"Converted department ID {dept_id} to Department object")
                except (ValueError, TypeError, Department.DoesNotExist) as e:
                    print(f"Department conversion error: {e}")
                    raise serializers.ValidationError({"department": f"Invalid department ID: {dept_value}"})
        
        # Convert empty strings to None for optional fields
        for field in ['phone', 'nid', 'full_name_bn', 'office_name', 'designation']:
            if field in attrs and attrs[field] == '':
                attrs[field] = None
        
        print(f"Final validated attrs: {attrs}")
        return attrs
    
    def create(self, validated_data):
        print(f"Creating user with: {validated_data}")
        
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        
        if user.role == 'officer':
            user.status = 'pending'
        else:
            user.status = 'approved'
        
        user.save()
        print(f"User saved: {user.username}")
        
        # Create user profile
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
        
        
        
class TrustScoreSerializer(serializers.ModelSerializer):
    trust_level = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'trust_score', 'trust_level']

    def get_trust_level(self, obj):
        if obj.trust_score > 80:
            return "High"
        elif obj.trust_score > 50:
            return "Medium"
        return "Low"