from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.conf import settings
from .models import User, UserProfile, Department
import uuid

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
        
        # Handle department for officers
        if attrs.get('role') == 'officer':
            if not attrs.get('office_name'):
                raise serializers.ValidationError({"office_name": "Office name is required for officers"})
            
            dept_value = attrs.get('department')
            if not dept_value:
                raise serializers.ValidationError({"department": "Department is required for officers"})
            
            print(f"Department value received: {dept_value} (type: {type(dept_value)})")
            
            # Check if department is already a Department object
            if isinstance(dept_value, Department):
                # It's already a Department object, just keep it
                print(f"Department already an object: {dept_value.name}")
                attrs['department'] = dept_value
            else:
                # It's an ID, look it up
                try:
                    if isinstance(dept_value, str):
                        dept_id = int(dept_value)
                    else:
                        dept_id = dept_value
                    department = Department.objects.get(id=dept_id)
                    attrs['department'] = department
                    print(f"Department found: {department.name} (ID: {department.id})")
                except (ValueError, Department.DoesNotExist) as e:
                    print(f"Department error: {e}")
                    raise serializers.ValidationError({"department": f"Invalid department. Available IDs: 1,2,3,4"})
        
        # Convert empty strings to None for optional fields
        for field in ['phone', 'nid', 'full_name_bn', 'office_name', 'designation']:
            if field in attrs and attrs[field] == '':
                attrs[field] = None
        
        print(f"Validated attrs: {attrs}")
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
        print(f"User saved: {user.username} (ID: {user.id})")
        
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