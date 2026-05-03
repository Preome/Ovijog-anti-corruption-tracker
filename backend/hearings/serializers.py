from rest_framework import serializers
from .models import Hearing

class HearingSerializer(serializers.ModelSerializer):
    complaint_id = serializers.CharField(source='complaint.complaint_id', read_only=True)
    office_location = serializers.CharField(source='complaint.office_location', read_only=True)
    officer_name = serializers.CharField(source='officer.username', read_only=True)
    citizen_name = serializers.CharField(source='citizen.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Hearing
        fields = ('id', 'hearing_id', 'complaint', 'complaint_id', 'office_location',
                 'officer', 'officer_name', 'citizen', 'citizen_name', 'meeting_type',
                 'scheduled_time', 'duration_minutes', 'meeting_link', 'status', 
                 'status_display', 'notes', 'resolution', 'created_at')
        read_only_fields = ('id', 'hearing_id', 'created_at')