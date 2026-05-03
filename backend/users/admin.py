from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Department, UserProfile

class CustomUserAdmin(UserAdmin):
    # Remove 'trust_level' and any other problematic fields from list_display
    list_display = ('username', 'email', 'role', 'status', 'office_name', 'created_at')
    list_filter = ('role', 'status', 'is_active', 'created_at')
    search_fields = ('username', 'email', 'office_name', 'phone', 'nid')
    
    # Define fieldsets without trust_level
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email', 'full_name_bn')}),
        ('Contact Info', {'fields': ('phone', 'nid')}),
        ('Office Info', {'fields': ('office_name', 'designation', 'department')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
        ('Additional Info', {
            'fields': ('role', 'status', 'email_verified', 'approved_by', 'approved_at', 'rejection_reason'),
            'classes': ('wide',),
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'status'),
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:
            # Make these fields read-only when editing existing users
            return ['approved_at', 'created_at', 'updated_at']
        return []
    
    # Custom actions for bulk operations
    actions = ['approve_selected_officers', 'reject_selected_officers']
    
    def approve_selected_officers(self, request, queryset):
        updated = queryset.filter(role='officer', status='pending').update(status='approved')
        self.message_user(request, f'{updated} officer(s) approved successfully.')
    approve_selected_officers.short_description = 'Approve selected officers'
    
    def reject_selected_officers(self, request, queryset):
        updated = queryset.filter(role='officer', status='pending').update(status='rejected')
        self.message_user(request, f'{updated} officer(s) rejected.')
    reject_selected_officers.short_description = 'Reject selected officers'

# Register the models
admin.site.register(User, CustomUserAdmin)
admin.site.register(Department)
admin.site.register(UserProfile)