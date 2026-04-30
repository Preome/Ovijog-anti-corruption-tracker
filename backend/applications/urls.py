from django.urls import path
from . import views

urlpatterns = [
    path('', views.ApplicationListCreateView.as_view()),
    path('<str:tracking_number>/', views.ApplicationDetailView.as_view()),
]