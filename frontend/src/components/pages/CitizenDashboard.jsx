import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, AlertCircle, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function CitizenDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const fetchMyApplications = async () => {
    try {
      const response = await API.get('/applications/my-applications/');
      setApplications(response.data);
      
      // Calculate stats
      const total = response.data.length;
      const pending = response.data.filter(app => app.status === 'submitted' || app.status === 'processing').length;
      const approved = response.data.filter(app => app.status === 'approved').length;
      const rejected = response.data.filter(app => app.status === 'rejected').length;
      
      setStats({ total, pending, approved, rejected });
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('আবেদন লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      submitted: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      delayed: 'bg-orange-100 text-orange-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      submitted: 'জমা দেওয়া হয়েছে',
      processing: 'প্রক্রিয়াধীন',
      approved: 'অনুমোদিত',
      rejected: 'বাতিল',
      delayed: 'বিলম্বিত'
    };
    return texts[status] || status;
  };

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 mb-8 text-white">
          <h1 className="text-2xl font-bold mb-2">
            স্বাগতম, {user?.full_name_bn || user?.username}!
          </h1>
          <p className="text-blue-100">আপনার আবেদন ট্র্যাক করুন এবং নতুন আবেদন জমা দিন</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">মোট আবেদন</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">প্রক্রিয়াধীন</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">অনুমোদিত</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">বাতিল</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* New Application Button */}
        <div className="mb-8">
          <Link
            to="/apply"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <PlusCircle className="h-5 w-5" />
            নতুন আবেদন করুন
          </Link>
        </div>

        {/* My Applications List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">আমার আবেদনসমূহ</h2>
          </div>
          
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">কোনো আবেদন নেই</p>
              <Link to="/apply" className="text-blue-600 hover:underline mt-2 inline-block">
                প্রথম আবেদন করুন
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {applications.map((app) => (
                <div key={app.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {app.service_type === 'passport' ? 'পাসপোর্ট' :
                         app.service_type === 'driving_license' ? 'ড্রাইভিং লাইসেন্স' :
                         app.service_type === 'birth_certificate' ? 'জন্ম নিবন্ধন' : 'ট্যাক্স আইডি'}
                      </h3>
                      <p className="text-sm text-gray-500">ট্র্যাকিং নম্বর: {app.tracking_number}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(app.status)}`}>
                      {getStatusText(app.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>জমা দেওয়ার তারিখ: {new Date(app.submitted_at).toLocaleDateString('bn-BD')}</p>
                    {app.expected_completion_date && (
                      <p>প্রত্যাশিত সম্পন্ন তারিখ: {new Date(app.expected_completion_date).toLocaleDateString('bn-BD')}</p>
                    )}
                  </div>
                  <Link 
                    to={`/track/${app.tracking_number}`}
                    className="text-blue-600 text-sm hover:underline mt-2 inline-block"
                  >
                    বিস্তারিত দেখুন →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CitizenDashboard;