import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Shield } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ApplyPage from './components/pages/ApplyPage';
import TrackPage from './components/pages/TrackPage';
import ComplaintPage from './components/pages/ComplaintPage';
import Dashboard from './components/pages/Dashboard';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import ProfilePage from './components/pages/ProfilePage';

// Navigation Component with Auth
function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  
  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-800">
              সততা ট্র্যাকার
            </span>
          </Link>
          
          <div className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition">হোম</Link>
            <Link to="/apply" className="text-gray-700 hover:text-blue-600 transition">আবেদন</Link>
            <Link to="/track" className="text-gray-700 hover:text-blue-600 transition">ট্র্যাক</Link>
            <Link to="/complaint" className="text-gray-700 hover:text-blue-600 transition">অভিযোগ</Link>
            <Link to="/dashboard" className="text-gray-700 hover:text-purple-600 transition">ড্যাশবোর্ড</Link>
            
            {isAuthenticated ? (
              <div className="flex space-x-4">
                <Link to="/profile" className="text-gray-700 hover:text-blue-600 transition">
                  প্রোফাইল
                </Link>
                <button onClick={logout} className="text-red-600 hover:text-red-700 transition">
                  লগআউট
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-blue-600 transition">
                  লগইন
                </Link>
                <Link to="/register" className="text-gray-700 hover:text-blue-600 transition">
                  রেজিস্ট্রেশন
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Home Page Component
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
            </div>
          )}
          
          <div className="space-x-4">
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
            <Link 
              to="/dashboard" 
              className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 transition"
            >
              ড্যাশবোর্ড
            </Link>
          </div>

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

// Main App Component
function AppContent() {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/complaint" element={<ComplaintPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
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