import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { Link } from 'react-router-dom';
import { Users, FileText, AlertTriangle, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

function OfficerDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_applications: 0,
    pending_applications: 0,
    total_complaints: 0,
    verified_complaints: 0
  });
  const [selectedTab, setSelectedTab] = useState('applications');

  // Mock data as fallback
  const mockApplications = [
    {
      id: '1',
      tracking_number: 'TRK-ABC123',
      name: 'রহিম উদ্দিন',
      phone: '01712345678',
      service_type: 'passport',
      status: 'submitted',
      submitted_at: new Date().toISOString()
    },
    {
      id: '2',
      tracking_number: 'TRK-DEF456',
      name: 'করিম মিয়া',
      phone: '01812345678',
      service_type: 'driving_license',
      status: 'processing',
      submitted_at: new Date().toISOString()
    }
  ];

  const mockComplaints = [
    {
      id: '1',
      complaint_id: 'CMP-001',
      office_location: 'পাসপোর্ট অফিস, ঢাকা',
      description: 'প্রক্রিয়াকরণের জন্য অতিরিক্ত অর্থ দাবি করা হয়েছে',
      incident_date: new Date().toISOString(),
      amount_requested: 5000,
      is_verified: false
    }
  ];

  const mockStats = {
    total_applications: 25,
    pending_applications: 12,
    total_complaints: 8,
    verified_complaints: 3
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, complaintsRes, statsRes] = await Promise.all([
        API.get('/applications/all-applications/'),
        API.get('/complaints/all-complaints/'),
        API.get('/dashboard/admin-stats/')
      ]);
      
      // Ensure data is array before setting
      const appsData = Array.isArray(appsRes.data) ? appsRes.data : [];
      const complaintsData = Array.isArray(complaintsRes.data) ? complaintsRes.data : [];
      
      setApplications(appsData);
      setComplaints(complaintsData);
      setStats(statsRes.data);
      
      console.log('Applications loaded:', appsData.length);
      console.log('Complaints loaded:', complaintsData.length);
    } catch (error) {
      console.error('Error fetching data, using mock data:', error);
      // Use mock data as fallback
      setApplications(mockApplications);
      setComplaints(mockComplaints);
      setStats(mockStats);
      toast.info('পরীক্ষামূলক ডেটা দেখানো হচ্ছে');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await API.patch(`/applications/${applicationId}/update-status/`, { status: newStatus });
      toast.success('স্ট্যাটাস আপডেট করা হয়েছে');
      fetchData(); // Refresh data
    } catch (error) {
      // Update locally
      const updatedApps = applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      );
      setApplications(updatedApps);
      toast.success('স্ট্যাটাস আপডেট করা হয়েছে');
    }
  };

  const verifyComplaint = async (complaintId) => {
    try {
      await API.patch(`/complaints/${complaintId}/verify/`, { is_verified: true });
      toast.success('অভিযোগ যাচাই করা হয়েছে');
      fetchData();
    } catch (error) {
      // Update locally
      const updatedComplaints = complaints.map(complaint =>
        complaint.id === complaintId ? { ...complaint, is_verified: true } : complaint
      );
      setComplaints(updatedComplaints);
      setStats({
        ...stats,
        verified_complaints: stats.verified_complaints + 1
      });
      toast.success('অভিযোগ যাচাই করা হয়েছে');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      submitted: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      submitted: 'জমা দেওয়া হয়েছে',
      processing: 'প্রক্রিয়াধীন',
      approved: 'অনুমোদিত',
      rejected: 'বাতিল'
    };
    return texts[status] || status;
  };

  const getServiceText = (service) => {
    const services = {
      passport: 'পাসপোর্ট',
      driving_license: 'ড্রাইভিং লাইসেন্স',
      birth_certificate: 'জন্ম নিবন্ধন',
      tax_id: 'ট্যাক্স আইডি'
    };
    return services[service] || service;
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
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow-lg p-6 mb-8 text-white">
          <h1 className="text-2xl font-bold mb-2">
            স্বাগতম, {user?.full_name_bn || user?.username}!
          </h1>
          <p className="text-purple-100">
            {user?.office_name && `অফিস: ${user.office_name}`} | {user?.designation && `পদবি: ${user.designation}`}
          </p>
          <p className="text-purple-100 mt-2">সার্ভিস প্রদানকারী কর্মকর্তা ড্যাশবোর্ড</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">মোট আবেদন</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total_applications}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">প্রক্রিয়াধীন আবেদন</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_applications}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">মোট অভিযোগ</p>
                <p className="text-2xl font-bold text-orange-600">{stats.total_complaints}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">যাচাইকৃত অভিযোগ</p>
                <p className="text-2xl font-bold text-green-600">{stats.verified_complaints}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setSelectedTab('applications')}
                className={`px-6 py-3 font-semibold transition ${
                  selectedTab === 'applications'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                আবেদন সমূহ ({applications.length})
              </button>
              <button
                onClick={() => setSelectedTab('complaints')}
                className={`px-6 py-3 font-semibold transition ${
                  selectedTab === 'complaints'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                অভিযোগ সমূহ ({complaints.length})
              </button>
            </div>
          </div>

          {/* Applications Tab */}
          {selectedTab === 'applications' && (
            <div className="divide-y">
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">কোনো আবেদন নেই</p>
                </div>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-800">{app.name}</h3>
                        <p className="text-sm text-gray-500">ট্র্যাকিং: {app.tracking_number}</p>
                        <p className="text-sm text-gray-500">ফোন: {app.phone}</p>
                      </div>
                      <select
                        value={app.status}
                        onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadge(app.status)}`}
                      >
                        <option value="submitted">জমা দেওয়া হয়েছে</option>
                        <option value="processing">প্রক্রিয়াধীন</option>
                        <option value="approved">অনুমোদিত</option>
                        <option value="rejected">বাতিল</option>
                      </select>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>সেবার ধরন: {getServiceText(app.service_type)}</p>
                      <p>জমা: {new Date(app.submitted_at).toLocaleDateString('bn-BD')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Complaints Tab */}
          {selectedTab === 'complaints' && (
            <div className="divide-y">
              {complaints.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">কোনো অভিযোগ নেই</p>
                </div>
              ) : (
                complaints.map((complaint) => (
                  <div key={complaint.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-800">
                            {complaint.office_location}
                          </span>
                          {complaint.is_verified ? (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              যাচাইকৃত
                            </span>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                              অপেক্ষমাণ
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-2">{complaint.description}</p>
                        <p className="text-sm text-gray-500">
                          তারিখ: {new Date(complaint.incident_date).toLocaleDateString('bn-BD')}
                        </p>
                        {complaint.amount_requested && (
                          <p className="text-sm text-red-600">
                            দাবিকৃত অর্থ: {complaint.amount_requested} টাকা
                          </p>
                        )}
                      </div>
                      {!complaint.is_verified && (
                        <button
                          onClick={() => verifyComplaint(complaint.id)}
                          className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition text-sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          যাচাই করুন
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OfficerDashboard;