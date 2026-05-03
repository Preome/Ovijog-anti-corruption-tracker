from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('register/', views.RegisterView.as_view(), name='register'),
    path('send-otp/', views.SendOTPView.as_view(), name='send-otp'),
    path('verify-otp/', views.VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', views.ResendOTPView.as_view(), name='resend-otp'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    
    # Profile
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    
    # User Management
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<str:user_id>/delete/', views.DeleteUserView.as_view(), name='delete-user'),
    
    # Admin Approval
    path('pending-users/', views.PendingUsersView.as_view(), name='pending-users'),
    path('approve-user/<str:user_id>/', views.ApproveUserView.as_view(), name='approve-user'),
    path('bulk-approve/', views.BulkApproveUsersView.as_view(), name='bulk-approve'),
    
    # Departments
    path('departments/', views.DepartmentsView.as_view(), name='departments'),
    path('departments/<int:department_id>/officers/', views.DepartmentOfficersView.as_view(), name='department-officers'),
    
    
    path('trust-score/', views.TrustScoreView.as_view(), name='trust-score'),
    path('leaderboard/', views.TrustScoreLeaderboardView.as_view(), name='leaderboard'),
   
]