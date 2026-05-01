from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.db.models import Q
from .models import User, Department
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer, 
    ChangePasswordSerializer, EmailVerificationSerializer, 
    ApproveUserSerializer, DepartmentSerializer
)
import uuid

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Send email verification
            verification_link = f"http://localhost:5173/verify-email?token={user.email_verification_token}"
            
            try:
                send_mail(
                    subject='Verify Your Email - Anti-Corruption Tracker',
                    message=f'Please click the link to verify your email: {verification_link}',
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                print(f"Verification email sent to {user.email}")
            except Exception as e:
                print(f"Email sending failed: {e}")
            
            refresh = RefreshToken.for_user(user)
            return Response({
                'success': True,
                'message': 'Registration successful. Please verify your email.',
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'requires_verification': True
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = EmailVerificationSerializer
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            print(f"Verifying token: {token}")
            
            try:
                user = User.objects.get(email_verification_token=token)
                print(f"Found user: {user.email}")
                
                user.email_verified = True
                user.email_verification_token = None
                user.save()
                
                return Response({
                    'success': True,
                    'message': 'Email verified successfully'
                })
            except User.DoesNotExist:
                print(f"No user found with token: {token}")
                return Response({
                    'success': False,
                    'message': 'Invalid or expired verification token'
                }, status=status.HTTP_400_BAD_REQUEST)
        print(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class LoginView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = LoginSerializer
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            user = authenticate(username=username, password=password)
            
            if user:
                # Check if email is verified
                if not user.email_verified:
                    return Response({
                        'success': False,
                        'message': 'Please verify your email first. Check your inbox for verification link.'
                    }, status=status.HTTP_401_UNAUTHORIZED)
                
                # Check if officer account is approved
                if user.role == 'officer' and user.status != 'approved':
                    status_messages = {
                        'pending': 'Your account is pending admin approval. Please wait.',
                        'rejected': f'Your account was rejected. Reason: {user.rejection_reason}',
                        'suspended': 'Your account has been suspended. Contact admin.'
                    }
                    return Response({
                        'success': False,
                        'message': status_messages.get(user.status, f'Your account status is {user.status}')
                    }, status=status.HTTP_401_UNAUTHORIZED)
                
                refresh = RefreshToken.for_user(user)
                return Response({
                    'success': True,
                    'message': 'Login successful',
                    'user': UserSerializer(user).data,
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                })
            else:
                return Response({
                    'success': False,
                    'message': 'Invalid username or password'
                }, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'success': True, 'message': 'Logout successful'})
        except Exception as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user

class ChangePasswordView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ChangePasswordSerializer
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if user.check_password(serializer.validated_data['old_password']):
                user.set_password(serializer.validated_data['new_password'])
                user.save()
                return Response({'success': True, 'message': 'Password changed successfully'})
            return Response({'success': False, 'message': 'Wrong password'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return User.objects.all()
        elif user.role == 'officer':
            return User.objects.filter(department=user.department)
        return User.objects.filter(id=user.id)

class PendingUsersView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return User.objects.filter(role='officer', status='pending').order_by('-created_at')
        return User.objects.none()

class ApproveUserView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ApproveUserSerializer
    
    def post(self, request, user_id):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized. Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=user_id, role='officer')
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user.status = serializer.validated_data['status']
            user.approved_by = request.user
            user.approved_at = timezone.now()
            if serializer.validated_data['status'] == 'rejected':
                user.rejection_reason = serializer.validated_data.get('rejection_reason', '')
            user.save()
            
            # Send approval/rejection email
            if user.status == 'approved':
                subject = 'Account Approved - Anti-Corruption Tracker'
                message = f"""
                Dear {user.full_name_bn or user.username},

                Congratulations! Your officer account has been approved by admin.
                
                You can now login to the system using your credentials:
                Login URL: http://localhost:5173/login
                Username: {user.username}
                
                Please login and start managing complaints for your department.
                
                Best regards,
                Anti-Corruption Tracker Team
                """
            else:
                subject = 'Account Rejected - Anti-Corruption Tracker'
                message = f"""
                Dear {user.full_name_bn or user.username},

                We regret to inform you that your officer account application has been rejected.
                
                Reason: {user.rejection_reason}
                
                If you have any questions, please contact the administrator.
                
                Best regards,
                Anti-Corruption Tracker Team
                """
            
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                print(f"Approval email sent to {user.email}")
            except Exception as e:
                print(f"Email sending failed: {e}")
            
            return Response({
                'success': True,
                'message': f'User {user.status} successfully',
                'user_status': user.status
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DepartmentsView(generics.ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = DepartmentSerializer
    queryset = Department.objects.all()
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        # Return as array
        return Response(serializer.data)

class DepartmentOfficersView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer
    
    def get_queryset(self):
        department_id = self.kwargs.get('department_id')
        return User.objects.filter(
            role='officer', 
            department_id=department_id,
            status='approved'
        )

class ResendVerificationEmailView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email, email_verified=False)
            
            # Generate new token
            user.email_verification_token = str(uuid.uuid4())
            user.save()
            
            # Send new verification email
            verification_link = f"http://localhost:5173/verify-email?token={user.email_verification_token}"
            
            send_mail(
                subject='Verify Your Email - Anti-Corruption Tracker',
                message=f'Please click the link to verify your email: {verification_link}',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            return Response({
                'success': True,
                'message': 'Verification email resent successfully'
            })
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'User not found or email already verified'
            }, status=status.HTTP_404_NOT_FOUND)

class BulkApproveUsersView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        user_ids = request.data.get('user_ids', [])
        status_to_set = request.data.get('status', 'approved')
        
        if not user_ids:
            return Response({'error': 'No users selected'}, status=status.HTTP_400_BAD_REQUEST)
        
        users = User.objects.filter(id__in=user_ids, role='officer', status='pending')
        count = users.update(status=status_to_set, approved_by=request.user, approved_at=timezone.now())
        
        return Response({
            'success': True,
            'message': f'{count} users have been {status_to_set}'
        })

class DeleteUserView(generics.DestroyAPIView):
    permission_classes = (IsAuthenticated,)
    
    def delete(self, request, user_id):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=user_id)
            user.delete()
            return Response({
                'success': True,
                'message': 'User deleted successfully'
            })
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)