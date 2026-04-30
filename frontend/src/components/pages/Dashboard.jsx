import { useAuth } from '../../context/AuthContext';
import CitizenDashboard from './CitizenDashboard';
import OfficerDashboard from './OfficerDashboard';
import { Navigate } from 'react-router-dom';

function Dashboard() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show different dashboard based on user role
  console.log('User role:', user?.role); // Debug: Check what role is being passed
  
  if (user?.role === 'officer') {
    return <OfficerDashboard />;
  } else if (user?.role === 'admin') {
    return <OfficerDashboard />; // Admin can use officer dashboard
  } else {
    return <CitizenDashboard />;
  }
}

export default Dashboard;