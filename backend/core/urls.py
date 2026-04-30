from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_home(request):
    return JsonResponse({
        'message': 'Anti-Corruption Digital Service Tracker API',
        'status': 'active',
        'version': '1.0.0'
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_home),
    # Comment these out until we create the files
    # path('api/applications/', include('applications.urls')),
    # path('api/complaints/', include('complaints.urls')),
]