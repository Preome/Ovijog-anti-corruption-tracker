from django.urls import path
from . import views

urlpatterns = [
    path('create/<str:complaint_id>/', views.CreateHearingView.as_view(), name='create-hearing'),
    path('my-hearings/', views.MyHearingsView.as_view(), name='my-hearings'),
    path('<str:hearing_id>/', views.HearingDetailView.as_view(), name='hearing-detail'),
    path('<str:hearing_id>/update-status/', views.UpdateHearingStatusView.as_view(), name='update-status'),
]