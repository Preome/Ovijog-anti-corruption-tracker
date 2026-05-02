from django.contrib import admin
from .models import Complaint

@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ('complaint_id', 'service_type', 'office_location', 'status', 'priority', 'is_public', 'reported_at', 'user')
    list_filter = ('status', 'priority', 'is_public', 'service_type')
    search_fields = ('complaint_id', 'office_location', 'description', 'user__username')
    readonly_fields = ('complaint_id', 'reported_at', 'updated_at', 'legal_deadline')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('complaint_id', 'service_type', 'office_location', 'incident_date', 'description')
        }),
        ('Financial', {
            'fields': ('amount_requested',),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('status', 'priority', 'is_anonymous', 'is_public')
        }),
        ('Public Pressure Mode', {
            'fields': ('legal_deadline', 'public_activated_at', 'upvotes_count', 'escalation_count'),
            'classes': ('collapse',)
        }),
        ('Investigation', {
            'fields': ('investigation_notes', 'action_taken', 'feedback_to_citizen'),
            'classes': ('collapse',)
        }),
        ('User Info', {
            'fields': ('user', 'officer_name'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('reported_at', 'updated_at', 'resolution_date'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')