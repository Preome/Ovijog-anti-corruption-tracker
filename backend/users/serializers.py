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
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
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
        """Convert department ID to Department object"""
        print(f"validate_department received: {value} (type: {type(value)})")
        
        # If no department provided
        if not value:
            return None
        
        try:
            # If it's already a Department object, return it
            if isinstance(value, Department):
                return value
            
            # Convert to integer if it's a string
            if isinstance(value, str):
                dept_id = int(value)
            else:
                dept_id = value
            
            # Get the Department object
            department = Department.objects.get(id=dept_id)
            print(f"Found department: {department.id} - {department.name}")
            return department
            
        except (ValueError, TypeError) as e:
            print(f"Value/Type error: {e}")
            raise serializers.ValidationError(f"Invalid department ID. Must be a number.")
        except Department.DoesNotExist:
            print(f"Department with id={value} not found")
            raise serializers.ValidationError(f"Department with ID {value} does not exist.")
    
    def validate(self, attrs):
        print(f"Validating attrs: {attrs}")
        
        # Check passwords match
        if attrs.get('password') != attrs.get('password2'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Check if username already exists
        if User.objects.filter(username=attrs.get('username')).exists():
            raise serializers.ValidationError({"username": "A user with that username already exists."})
        
        # Check if email already exists
        if User.objects.filter(email=attrs.get('email')).exists():
            raise serializers.ValidationError({"email": "A user with that email already exists."})
        
        # Role-specific validations
        if attrs.get('role') == 'officer':
            if not attrs.get('office_name'):
                raise serializers.ValidationError({"office_name": "Office name is required for officers"})
            if not attrs.get('department'):
                raise serializers.ValidationError({"department": "Please select a department"})
        
        # Validate phone number format if provided
        if attrs.get('phone'):
            import re
            phone_pattern = r'^01[3-9]\d{8}$'
            if not re.match(phone_pattern, attrs['phone']):
                raise serializers.ValidationError({"phone": "Please enter a valid Bangladeshi phone number (e.g., 017XXXXXXXX)"})
        
        # Validate NID format if provided
        if attrs.get('nid'):
            if not (len(attrs['nid']) == 10 or len(attrs['nid']) == 17):
                raise serializers.ValidationError({"nid": "NID must be 10 or 17 digits"})
            if not attrs['nid'].isdigit():
                raise serializers.ValidationError({"nid": "NID must contain only digits"})
        
        return attrs
    
    def create(self, validated_data):
        print(f"Creating user with validated_data: {validated_data}")
        
        # Remove password2
        validated_data.pop('password2')
        password = validated_data.pop('password')
        
        # Get department (it should already be a Department object from validation)
        department = validated_data.pop('department', None)
        
        # Handle empty strings - convert to None
        for field in ['phone', 'nid', 'full_name_bn', 'office_name', 'designation']:
            if field in validated_data and validated_data[field] == '':
                validated_data[field] = None
        
        # Create user
        user = User(**validated_data)
        user.set_password(password)
        
        # Set department
        if department:
            user.department = department
        
        # Set status based on role
        if user.role == 'officer':
            user.status = 'pending'  # Officers need admin approval
        else:
            user.status = 'approved'  # Citizens are auto-approved
        
        user.save()
        
        # Generate email verification token
        user.email_verification_token = str(uuid.uuid4())
        user.save()
        
        # Create user profile
        UserProfile.objects.get_or_create(user=user)
        
        # Send verification email
        try:
            verification_link = f"http://localhost:5173/verify-email?token={user.email_verification_token}"
            send_mail(
                subject='Verify Your Email - Anti-Corruption Tracker',
                message=f"""
                Welcome to Anti-Corruption Tracker, {user.username}!

                Please click the link below to verify your email address:
                
                {verification_link}
                
                {"Your officer account will be activated after admin approval." if user.role == 'officer' else "You can now login to your account."}
                
                If you didn't create an account, please ignore this email.
                
                Best regards,
                Anti-Corruption Tracker Team
                """,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Failed to send verification email: {e}")
        
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)

class ApproveUserSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['approved', 'rejected'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        try:
            user = User.objects.get(email=value, email_verified=False)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("No unverified user found with this email.")

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("No user found with this email.")

class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ('id', 'username', 'email', 'role', 'address', 'district', 'upazila', 
                 'profile_picture', 'last_login_ip')
        read_only_fields = ('id', 'username', 'email', 'role')

class UpdateProfileSerializer(serializers.ModelSerializer):
    full_name_bn = serializers.CharField(source='user.full_name_bn', required=False)
    phone = serializers.CharField(source='user.phone', required=False)
    
    class Meta:
        model = UserProfile
        fields = ('address', 'district', 'upazila', 'full_name_bn', 'phone', 'profile_picture')
    
    def update(self, instance, validated_data):
        # Update user fields
        user_data = validated_data.pop('user', {})
        user = instance.user
        if 'full_name_bn' in user_data:
            user.full_name_bn = user_data['full_name_bn']
        if 'phone' in user_data:
            user.phone = user_data['phone']
        user.save()
        
        # Update profile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance