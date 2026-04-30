import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Shield } from 'lucide-react';
import ApplyPage from './components/pages/ApplyPage';
import TrackPage from './components/pages/TrackPage';
import ComplaintPage from './components/pages/ComplaintPage';

// Home Page Component (keep this inline or move to separate file)
function HomePage() {
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
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
          </div>
        </div>
      </div>
    </div>
  );
}

// Navigation Component
function Navbar() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-800">
              অভিযোগ
            </span>
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition">হোম</Link>
            <Link to="/apply" className="text-gray-700 hover:text-blue-600 transition">আবেদন</Link>
            <Link to="/track" className="text-gray-700 hover:text-blue-600 transition">ট্র্যাক</Link>
            <Link to="/complaint" className="text-gray-700 hover:text-blue-600 transition">অভিযোগ</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Main App
function App() {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/complaint" element={<ComplaintPage />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;