import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Shield, LayoutDashboard, FileText, Search, AlertTriangle, LogOut, User } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ApplyPage from './components/pages/ApplyPage';
import TrackPage from './components/pages/TrackPage';
import ComplaintPage from './components/pages/ComplaintPage';
import Dashboard from './components/pages/Dashboard';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import ProfilePage from './components/pages/ProfilePage';

// Role-Based Navigation Component
function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  
  // Citizen Navigation Items
  const citizenNavItems = [
    { path: '/', label: 'হোম', icon: <Shield className="h-4 w-4" /> },
    { path: '/apply', label: 'আবেদন', icon: <FileText className="h-4 w-4" /> },
    { path: '/track', label: 'ট্র্যাক', icon: <Search className="h-4 w-4" /> },
    { path: '/complaint', label: 'অভিযোগ', icon: <AlertTriangle className="h-4 w-4" /> },
    { path: '/dashboard', label: 'ড্যাশবোর্ড', icon: <LayoutDashboard className="h-4 w-4" /> },
  ];
  
  // Officer Navigation Items (No apply, track, complaint)
  const officerNavItems = [
    { path: '/', label: 'হোম', icon: <Shield className="h-4 w-4" /> },
    { path: '/dashboard', label: 'ড্যাশবোর্ড', icon: <LayoutDashboard className="h-4 w-4" /> },
  ];
  
  // Get navigation based on role
  const getNavItems = () => {
    if (!isAuthenticated) {
      return citizenNavItems; // Show limited for non-authenticated
    }
    
    if (user?.role === 'officer' || user?.role === 'admin') {
      return officerNavItems;
    }
    
    return citizenNavItems;
  };
  
  const navItems = getNavItems();
  
  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-800 hidden sm:inline">
              সততা ট্র্যাকার
            </span>
            <span className="text-sm font-bold text-gray-800 sm:hidden">
              ST
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition font-medium"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4 ml-4 border-l pl-4">
                <Link to="/profile" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition">
                  <User className="h-4 w-4" />
                  প্রোফাইল
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 transition font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  লগআউট
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4 ml-4 border-l pl-4">
                <Link to="/login" className="text-gray-700 hover:text-blue-600 transition">
                  লগইন
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  রেজিস্ট্রেশন
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile Menu */}
          <div className="md:hidden">
            <details className="dropdown">
              <summary className="btn btn-ghost btn-circle">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </summary>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <>
                    <hr className="my-2" />
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100">
                      <User className="h-4 w-4" />
                      প্রোফাইল
                    </Link>
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4" />
                      লগআউট
                    </button>
                  </>
                ) : (
                  <>
                    <hr className="my-2" />
                    <Link to="/login" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100">
                      লগইন
                    </Link>
                    <Link to="/register" className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-gray-100">
                      রেজিস্ট্রেশন
                    </Link>
                  </>
                )}
              </div>
            </details>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Home Page Component - Role-Based Content
function HomePage() {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <Shield className="h-20 w-20 text-blue-600 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Anti-Corruption Digital Service Tracker
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            দুর্নীতিমুক্ত সেবা নিশ্চিতে ডিজিটাল ট্র্যাকার
          </p>
          
          {isAuthenticated && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg inline-block mb-8">
              স্বাগতম, {user?.full_name_bn || user?.username}!
              {user?.role === 'officer' && (
                <span className="ml-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                  কর্মকর্তা
                </span>
              )}
              {user?.role === 'citizen' && (
                <span className="ml-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                  নাগরিক
                </span>
              )}
            </div>
          )}
          
          {/* Role-Based Buttons */}
          <div className="space-x-4">
            {(!isAuthenticated || user?.role === 'citizen') && (
              <>
                <Link 
                  to="/apply" 
                  className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
                >
                  আবেদন করুন
                </Link>
                <Link 
                  to="/track" 
                  className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition"
                >
                  ট্র্যাক করুন
                </Link>
                <Link 
                  to="/complaint" 
                  className="inline-block bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-red-700 transition"
                >
                  অভিযোগ করুন
                </Link>
              </>
            )}
            
            <Link 
              to="/dashboard" 
              className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 transition"
            >
              {user?.role === 'officer' ? 'কর্মকর্তা ড্যাশবোর্ড' : 'আমার ড্যাশবোর্ড'}
            </Link>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-16">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-blue-600 text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">সার্ভিস ট্র্যাকিং</h3>
              <p className="text-gray-600">রিয়েল টাইমে সেবার অবস্থান জানুন</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-red-600 text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-2">ঘুষের অভিযোগ</h3>
              <p className="text-gray-600">নাম না জানিয়ে অভিযোগ করুন</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-green-600 text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">স্বচ্ছতা ড্যাশবোর্ড</h3>
              <p className="text-gray-600">দুর্নীতির প্রবণতা দেখুন</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-purple-600 text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">এআই পর্যবেক্ষণ</h3>
              <p className="text-gray-600">স্বয়ংক্রিয় অসঙ্গতি সনাক্তকরণ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// Main App Component
function AppContent() {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Citizen Only Routes */}
          <Route path="/apply" element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <ApplyPage />
            </ProtectedRoute>
          } />
          <Route path="/track" element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <TrackPage />
            </ProtectedRoute>
          } />
          <Route path="/complaint" element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <ComplaintPage />
            </ProtectedRoute>
          } />
          
          {/* Both Citizen and Officer Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['citizen', 'officer', 'admin']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['citizen', 'officer', 'admin']}>
              <ProfilePage />
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;