from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'phone', 'is_verified', 'created_at')
    list_filter = ('role', 'is_verified', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'nid', 'full_name_bn', 'office_name', 'designation', 'is_verified')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'nid', 'full_name_bn')}),
    )

admin.site.register(User, CustomUserAdmin)