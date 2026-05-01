import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, AlertCircle, PlusCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

function CitizenDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('applications');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, complaintsRes] = await Promise.all([
        API.get('/applications/my-applications/'),
        API.get('/complaints/my-complaints/')
      ]);
      
      setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
      setComplaints(Array.isArray(complaintsRes.data) ? complaintsRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('ডেটা লোড করতে ব্যর্থ হয়েছে');
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
      pending: 'bg-yellow-100 text-yellow-800',
      under_investigation: 'bg-blue-100 text-blue-800',
      verified: 'bg-green-100 text-green-800',
      resolved: 'bg-green-100 text-green-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      submitted: 'জমা দেওয়া হয়েছে',
      processing: 'প্রক্রিয়াধীন',
      approved: 'অনুমোদিত',
      rejected: 'বাতিল',
      pending: 'বিবেচনাধীন',
      under_investigation: 'তদন্তাধীন',
      verified: 'যাচাইকৃত',
      resolved: 'নিষ্পত্তি হয়েছে'
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
          <p className="text-blue-100">আপনার আবেদন ও অভিযোগ ট্র্যাক করুন</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('applications')}
                className={`px-6 py-3 font-semibold transition flex items-center gap-2 ${
                  activeTab === 'applications'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <FileText className="h-4 w-4" />
                আমার আবেদন ({applications.length})
              </button>
              <button
                onClick={() => setActiveTab('complaints')}
                className={`px-6 py-3 font-semibold transition flex items-center gap-2 ${
                  activeTab === 'complaints'
                    ? 'border-b-2 border-red-600 text-red-600'
                    : 'text-gray-600 hover:text-red-600'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                আমার অভিযোগ ({complaints.length})
              </button>
            </div>
          </div>

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="divide-y">
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">কোনো আবেদন নেই</p>
                  <Link to="/apply" className="text-blue-600 hover:underline mt-2 inline-block">
                    প্রথম আবেদন করুন
                  </Link>
                </div>
              ) : (
                applications.map((app) => (
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
                  </div>
                ))
              )}
            </div>
          )}

          {/* Complaints Tab */}
          {activeTab === 'complaints' && (
            <div className="divide-y">
              {complaints.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">কোনো অভিযোগ নেই</p>
                  <Link to="/complaint" className="text-red-600 hover:underline mt-2 inline-block">
                    নতুন অভিযোগ করুন
                  </Link>
                </div>
              ) : (
                complaints.map((complaint) => (
                  <div key={complaint.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {complaint.office_location}
                        </h3>
                        <p className="text-sm text-gray-500">অভিযোগ আইডি: {complaint.complaint_id}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(complaint.status)}`}>
                        {getStatusText(complaint.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <p>{complaint.description.substring(0, 100)}...</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>অভিযোগের তারিখ: {new Date(complaint.reported_at).toLocaleDateString('bn-BD')}</p>
                    </div>
                    <Link 
                      to={`/my-complaints`} 
                      className="text-red-600 text-sm hover:underline mt-2 inline-block"
                    >
                      বিস্তারিত দেখুন →
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-8 right-8 flex gap-3">
          <Link
            to="/apply"
            className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
          >
            <PlusCircle className="h-6 w-6" />
          </Link>
          <Link
            to="/complaint"
            className="bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition"
          >
            <AlertTriangle className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CitizenDashboard;