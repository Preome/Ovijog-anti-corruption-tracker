import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Shield, LayoutDashboard, FileText, Search, AlertTriangle, LogOut, User, ListChecks } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ApplyPage from './components/pages/ApplyPage';
import TrackPage from './components/pages/TrackPage';
import ComplaintPage from './components/pages/ComplaintPage';
import Dashboard from './components/pages/Dashboard';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import ProfilePage from './components/pages/ProfilePage';
import CitizenComplaintTracker from './components/pages/CitizenComplaintTracker';

// Role-Based Navigation Component
function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  
  // Citizen Navigation Items
  const citizenNavItems = [
    { path: '/', label: 'হোম', icon: <Shield className="h-4 w-4" /> },
    { path: '/apply', label: 'আবেদন', icon: <FileText className="h-4 w-4" /> },
    { path: '/track', label: 'ট্র্যাক', icon: <Search className="h-4 w-4" /> },
    { path: '/complaint', label: 'অভিযোগ', icon: <AlertTriangle className="h-4 w-4" /> },
    { path: '/my-complaints', label: 'আমার অভিযোগ', icon: <ListChecks className="h-4 w-4" /> },
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
      return citizenNavItems.slice(0, 1); // Only show Home for non-authenticated
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

// Main Homepage (For Non-Authenticated / General Public)
function MainHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <Shield className="h-24 w-24 text-blue-600 mx-auto mb-6 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            সততা ট্র্যাকার
          </h1>
          <p className="text-2xl text-blue-600 font-semibold mb-4">
            দুর্নীতিমুক্ত সেবা, স্বচ্ছ ভবিষ্যত
          </p>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            ডিজিটাল প্রযুক্তির মাধ্যমে সরকারি সেবায় দুর্নীতি প্রতিরোধ ও স্বচ্ছতা নিশ্চিতকরণে আমাদের অঙ্গীকার
          </p>
          
          <div className="space-x-4 mb-16">
            <Link 
              to="/register" 
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition transform hover:scale-105"
            >
              এখনই রেজিস্ট্রেশন করুন
            </Link>
            <Link 
              to="/login" 
              className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition transform hover:scale-105"
            >
              লগইন করুন
            </Link>
          </div>
        </div>

        {/* Services Section */}
        <div className="max-w-6xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            আমাদের সেবাসমূহ
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105">
              <div className="text-blue-600 text-5xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">অনলাইন আবেদন</h3>
              <p className="text-gray-600">পাসপোর্ট, ড্রাইভিং লাইসেন্স, জন্ম নিবন্ধন ও ট্যাক্স আইডি সহ সকল সরকারি সেবার জন্য অনলাইনে আবেদন করুন।</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105">
              <div className="text-green-600 text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">রিয়েল-টাইম ট্র্যাকিং</h3>
              <p className="text-gray-600">আপনার আবেদনের বর্তমান অবস্থান জানুন রিয়েল টাইমে। কোথায়, কতদূর এগিয়েছে আপনার আবেদন।</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105">
              <div className="text-red-600 text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">গোপন অভিযোগ</h3>
              <p className="text-gray-600">নাম না জানিয়ে দুর্নীতির অভিযোগ জানান। আপনার পরিচয় সম্পূর্ণ গোপন থাকবে।</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-blue-900 text-white rounded-2xl mt-16 p-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold mb-2">১০,০০০+</div>
              <div className="text-blue-200">সফল আবেদন</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">৯৮%</div>
              <div className="text-blue-200">সেবা স্বচ্ছতা</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">২৪/৭</div>
              <div className="text-blue-200">সহায়তা সেবা</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Citizen Homepage (After Login)
function CitizenHomePage() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <Shield className="h-20 w-20 text-blue-600 mx-auto mb-6" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            স্বাগতম, {user?.full_name_bn || user?.username}!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            আপনার সেবা গ্রহণ সহজ করতে আমরা এখানে আছি
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <Link 
              to="/apply" 
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105"
            >
              <div className="text-blue-600 text-4xl mb-3">📝</div>
              <h3 className="text-lg font-bold mb-1">নতুন আবেদন</h3>
              <p className="text-sm text-gray-600">সরকারি সেবার জন্য আবেদন করুন</p>
            </Link>
            
            <Link 
              to="/track" 
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105"
            >
              <div className="text-green-600 text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-bold mb-1">আবেদন ট্র্যাক</h3>
              <p className="text-sm text-gray-600">আপনার আবেদনের অবস্থান জানুন</p>
            </Link>
            
            <Link 
              to="/complaint" 
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105"
            >
              <div className="text-red-600 text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold mb-1">নতুন অভিযোগ</h3>
              <p className="text-sm text-gray-600">দুর্নীতির অভিযোগ জানান</p>
            </Link>

            <Link 
              to="/my-complaints" 
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105"
            >
              <div className="text-purple-600 text-4xl mb-3">📋</div>
              <h3 className="text-lg font-bold mb-1">আমার অভিযোগ</h3>
              <p className="text-sm text-gray-600">আপনার অভিযোগের অবস্থা দেখুন</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Officer Homepage (After Login)
function OfficerHomePage() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <Shield className="h-20 w-20 text-purple-600 mx-auto mb-6" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            স্বাগতম, {user?.full_name_bn || user?.username}!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {user?.office_name && `অফিস: ${user.office_name}`} | {user?.designation && `পদবি: ${user.designation}`}
          </p>
          
          <Link 
            to="/dashboard" 
            className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 transition transform hover:scale-105"
          >
            কর্মকর্তা ড্যাশবোর্ডে যান
          </Link>
        </div>
      </div>
    </div>
  );
}

// Main Homepage Router (Decides which homepage to show)
function HomePageRouter() {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <MainHomePage />;
  }
  
  if (user?.role === 'officer' || user?.role === 'admin') {
    return <OfficerHomePage />;
  }
  
  return <CitizenHomePage />;
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
    return <Navigate to="/" replace />;
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
          {/* Homepage - Different based on role */}
          <Route path="/" element={<HomePageRouter />} />
          
          {/* Auth Routes */}
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
          <Route path="/my-complaints" element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <CitizenComplaintTracker />
            </ProtectedRoute>
          } />
          
          {/* Officer Only Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['officer', 'admin']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Shared Routes */}
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