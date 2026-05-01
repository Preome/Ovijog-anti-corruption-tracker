from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Department, UserProfile

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'status', 'office_name', 'created_at')
    list_filter = ('role', 'status', 'is_active')
    search_fields = ('username', 'email', 'office_name')
    
    # Add status to the fieldsets - this is what makes it appear
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'status', 'nid', 'phone', 'full_name_bn', 
                      'office_name', 'designation', 'department', 'email_verified')
        }),
    )
    
    # Make status editable
    def get_readonly_fields(self, request, obj=None):
        if obj:
            # Allow editing status
            return []
        return []

admin.site.register(User, CustomUserAdmin)
admin.site.register(Department)
admin.site.register(UserProfile)