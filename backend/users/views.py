from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.db.models import Q
from .models import User, Department, Notification
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer, 
    ChangePasswordSerializer, ApproveUserSerializer, DepartmentSerializer,TrustScoreSerializer
)
import uuid
import random
from datetime import timedelta
from .models import Notification
from .serializers import NotificationSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
    
    def post(self, request, *args, **kwargs):
        print("\n" + "=" * 60)
        print("REGISTRATION ATTEMPT")
        print("=" * 60)
        print(f"Request data: {request.data}")
        print("=" * 60)
        
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            print("✅ Serializer is valid!")
            user = serializer.save()
            print(f"✅ User created: {user.username} (ID: {user.id})")
            
            # Generate OTP
            otp = str(random.randint(100000, 999999))
            user.otp_code = otp
            user.otp_created_at = timezone.now()
            user.save()
            print(f"✅ OTP generated: {otp}")
            
            # Send OTP via email
            try:
                send_mail(
                    subject='Your OTP for Email Verification - Anti-Corruption Tracker',
                    message=f"""
Welcome to Anti-Corruption Tracker!

Your OTP for email verification is: {otp}

This OTP is valid for 10 minutes.

Please enter this OTP in the app to verify your email address.

Best regards,
Anti-Corruption Tracker Team
""",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                print(f"✅ OTP email sent to {user.email}")
            except Exception as e:
                print(f"❌ Failed to send email: {e}")
            
            return Response({
                'success': True,
                'message': 'Registration successful. Please check your email for OTP.',
                'email': user.email,
                'requires_verification': True
            }, status=status.HTTP_201_CREATED)
        else:
            print("\n❌ SERIALER ERRORS:")
            for field, errors in serializer.errors.items():
                print(f"  {field}: {errors}")
            print("=" * 60)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class SendOTPView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            # Generate 6-digit OTP
            otp = str(random.randint(100000, 999999))
            
            # Save OTP to user
            user.otp_code = otp
            user.otp_created_at = timezone.now()
            user.otp_attempts = 0
            user.save()
            
            # Send OTP via email
            try:
                send_mail(
                    subject='Your OTP for Email Verification - Anti-Corruption Tracker',
                    message=f"""
Your OTP for email verification is: {otp}

This OTP is valid for 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
Anti-Corruption Tracker Team
""",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                return Response({
                    'success': True,
                    'message': 'OTP sent successfully',
                    'email': email
                })
            except Exception as e:
                print(f"Failed to send OTP email: {e}")
                return Response({
                    'success': False,
                    'message': 'Failed to send OTP. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'User not found with this email'
            }, status=status.HTTP_404_NOT_FOUND)

class VerifyOTPView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({
                'success': False,
                'message': 'Email and OTP are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            # Check if OTP exists
            if not user.otp_code:
                return Response({
                    'success': False,
                    'message': 'No OTP requested. Please request a new OTP.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if OTP is expired (10 minutes)
            if user.otp_created_at:
                expiry_time = user.otp_created_at + timedelta(minutes=10)
                if timezone.now() > expiry_time:
                    return Response({
                        'success': False,
                        'message': 'OTP has expired. Please request a new OTP.'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check OTP attempts (max 5)
            if user.otp_attempts >= 5:
                return Response({
                    'success': False,
                    'message': 'Too many failed attempts. Please request a new OTP.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify OTP
            if user.otp_code == otp:
                user.email_verified = True
                user.otp_code = None
                user.otp_created_at = None
                user.otp_attempts = 0
                user.save()
                
                return Response({
                    'success': True,
                    'message': 'Email verified successfully!'
                })
            else:
                user.otp_attempts += 1
                user.save()
                remaining_attempts = 5 - user.otp_attempts
                return Response({
                    'success': False,
                    'message': f'Invalid OTP. {remaining_attempts} attempts remaining.'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

class ResendOTPView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            # Check if email already verified
            if user.email_verified:
                return Response({
                    'success': False,
                    'message': 'Email already verified'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate new OTP
            otp = str(random.randint(100000, 999999))
            
            # Save OTP to user
            user.otp_code = otp
            user.otp_created_at = timezone.now()
            user.otp_attempts = 0
            user.save()
            
            # Send OTP via email
            send_mail(
                subject='Your New OTP - Anti-Corruption Tracker',
                message=f"""
Your new OTP for email verification is: {otp}

This OTP is valid for 10 minutes.

Best regards,
Anti-Corruption Tracker Team
""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            return Response({
                'success': True,
                'message': 'New OTP sent successfully'
            })
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

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
                        'message': 'Please verify your email first. Check your email for OTP.'
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
            return User.objects.all().order_by('-created_at')
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

You can now login to the system using your credentials.

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
                    from_email=settings.DEFAULT_FROM_EMAIL,
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
        

class NotificationListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = NotificationSerializer
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')[:50]

class UnreadNotificationCountView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    
    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'count': count})

class MarkNotificationReadView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            notification.mark_as_read()
            return Response({'success': True, 'message': 'Notification marked as read'})
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

class MarkAllNotificationsReadView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        updated = Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True, 
            read_at=timezone.now()
        )
        return Response({'success': True, 'message': f'{updated} notifications marked as read'})

class DeleteNotificationView(generics.DestroyAPIView):
    permission_classes = (IsAuthenticated,)
    
    def delete(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            notification.delete()
            return Response({'success': True, 'message': 'Notification deleted'})
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
        
        
        

class TrustScoreView(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = TrustScoreSerializer
    
    def get_object(self):
        return self.request.user

class TrustScoreLeaderboardView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = TrustScoreSerializer
    
    def get_queryset(self):
        return User.objects.filter(role='citizen', trust_score__gt=0).order_by('-trust_score')[:50]