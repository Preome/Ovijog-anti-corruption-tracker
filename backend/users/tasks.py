from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import User
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_otp_email(user_id, otp):
    """
    Async task to send OTP email
    """
    try:
        user = User.objects.get(id=user_id)
        
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
        logger.info(f"✅ OTP email sent async to {user.email} (OTP: {otp})")
        
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for OTP email")
    except Exception as e:
        logger.error(f"Failed to send OTP email to user {user_id}: {str(e)}")

