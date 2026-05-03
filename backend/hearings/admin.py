from django.contrib import admin
from .models import Hearing

@admin.register(Hearing)
class HearingAdmin(admin.ModelAdmin):
    list_display = ('hearing_id', 'complaint', 'officer', 'citizen', 'scheduled_time', 'status')
    list_filter = ('status', 'meeting_type')
    search_fields = ('hearing_id', 'complaint__complaint_id')
    readonly_fields = ('hearing_id', 'created_at', 'updated_at')