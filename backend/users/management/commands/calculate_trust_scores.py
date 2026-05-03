from django.core.management.base import BaseCommand
from django.db.models import Count, Q
from users.models import User
from complaints.models import Complaint

class Command(BaseCommand):
    help = 'Calculate trust scores for all citizens based on their complaint history'
    
    def handle(self, *args, **options):
        citizens = User.objects.filter(role='citizen')
        
        for citizen in citizens:
            # Get complaint stats
            total_complaints = Complaint.objects.filter(user=citizen).count()
            verified_complaints = Complaint.objects.filter(user=citizen, status='verified').count()
            rejected_complaints = Complaint.objects.filter(user=citizen, status='rejected').count()
            dismissed_complaints = Complaint.objects.filter(user=citizen, status='dismissed').count()
            
            # Calculate score
            score = 50  # Base score
            score += min(verified_complaints * 5, 30)  # Max +30 from verified complaints
            score -= rejected_complaints * 10
            score -= dismissed_complaints * 15
            score = max(0, min(100, score))  # Clamp between 0 and 100
            
            # Update user
            citizen.total_complaints = total_complaints
            citizen.verified_complaints = verified_complaints
            citizen.rejected_complaints = rejected_complaints + dismissed_complaints
            citizen.trust_score = score
            
            if score >= 80:
                citizen.trust_level = 'high'
            elif score >= 50:
                citizen.trust_level = 'medium'
            else:
                citizen.trust_level = 'low'
            
            citizen.save()
            
            self.stdout.write(f"{citizen.username}: {score} ({citizen.trust_level})")
        
        self.stdout.write(self.style.SUCCESS(f"✅ Trust scores calculated for {citizens.count()} citizens"))