import { Link } from 'react-router-dom';
import { Shield, FileText, AlertTriangle, TrendingUp } from 'lucide-react';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <Shield className="h-20 w-20 text-primary mx-auto mb-6" />
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Anti-Corruption Digital Service Tracker
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            দুর্নীতিমুক্ত সেবা নিশ্চিতে ডিজিটাল ট্র্যাকার
          </p>
          
          <div className="space-x-4">
            <Link 
              to="/apply" 
              className="inline-block bg-primary text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-secondary transition"
            >
              আবেদন করুন
            </Link>
            <Link 
              to="/track" 
              className="inline-block bg-white text-primary border-2 border-primary px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition"
            >
              ট্র্যাক করুন
            </Link>
            <Link 
              to="/complaint" 
              className="inline-block bg-danger text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-red-700 transition"
            >
              অভিযোগ করুন
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">সার্ভিস ট্র্যাকিং</h3>
              <p className="text-gray-600">রিয়েল টাইমে সেবার অবস্থান জানুন</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <AlertTriangle className="h-12 w-12 text-danger mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">ঘুষের অভিযোগ</h3>
              <p className="text-gray-600">নাম না জানিয়ে অভিযোগ করুন</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <TrendingUp className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">স্বচ্ছতা ড্যাশবোর্ড</h3>
              <p className="text-gray-600">দুর্নীতির প্রবণতা দেখুন</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;