import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import API from '../../services/api';
import { 
  AlertTriangle, Eye, Clock, CheckCircle, XCircle, 
  Search, FileText, MapPin, Calendar, DollarSign,
  Image, File, ExternalLink, Flag, Filter, ListChecks,
  ChevronDown, ChevronUp, Globe, ThumbsUp, Star, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

function CitizenComplaintTracker() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [makingPublic, setMakingPublic] = useState({});
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const complaintRefs = useRef({});

  const complaintIdFromUrl = searchParams.get('complaint');

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  useEffect(() => {
    if (complaintIdFromUrl && complaints.length > 0) {
      setTimeout(() => {
        const element = complaintRefs.current[complaintIdFromUrl];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-yellow-50', 'border-l-4', 'border-yellow-500', 'shadow-lg');
          setTimeout(() => {
            element.classList.remove('bg-yellow-50', 'border-l-4', 'border-yellow-500', 'shadow-lg');
          }, 3000);
        }
      }, 500);
    }
  }, [complaints, complaintIdFromUrl]);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const response = await API.get('/complaints/my-complaints/');
      const complaintsData = Array.isArray(response.data) ? response.data : [];
      setComplaints(complaintsData);
      
      if (complaintsData.length > 0) {
        try {
          await API.post('/notifications/mark-all-read/');
        } catch (error) {
          console.error('Error marking notifications as read:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('আপনার অভিযোগ লোড করতে ব্যর্থ হয়েছে');
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const makeComplaintPublic = async (complaintId) => {
    setMakingPublic(prev => ({ ...prev, [complaintId]: true }));
    try {
      const response = await API.post(`/complaints/${complaintId}/make-public/`);
      if (response.data.success) {
        toast.success('অভিযোগ পাবলিক করা হয়েছে!');
        fetchMyComplaints();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'পাবলিক করতে ব্যর্থ হয়েছে');
    } finally {
      setMakingPublic(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  const toggleComplaintDetails = (complaintId) => {
    if (selectedComplaint === complaintId) {
      setSelectedComplaint(null);
    } else {
      setSelectedComplaint(complaintId);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_investigation: 'bg-blue-100 text-blue-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      escalated: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'বিবেচনাধীন',
      under_investigation: 'তদন্তাধীন',
      verified: 'যাচাইকৃত',
      rejected: 'প্রমাণহীন',
      escalated: 'উর্ধ্বতন কর্তৃপক্ষে প্রেরিত',
      resolved: 'নিষ্পত্তি হয়েছে',
      dismissed: 'মিথ্যা অভিযোগ'
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'resolved':
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
      case 'dismissed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'escalated':
        return <AlertTriangle className="h-5 w-5 text-purple-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return badges[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityText = (priority) => {
    const texts = {
      low: 'নিম্ন',
      medium: 'মধ্যম',
      high: 'উচ্চ',
      urgent: 'জরুরি'
    };
    return texts[priority] || priority;
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'urgent':
        return <Flag className="h-4 w-4 text-red-600" />;
      case 'high':
        return <Flag className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Flag className="h-4 w-4 text-blue-600" />;
      default:
        return <Flag className="h-4 w-4 text-gray-500" />;
    }
  };

  const viewEvidence = (evidenceUrl) => {
    if (evidenceUrl) {
      window.open(evidenceUrl, '_blank');
    }
  };

  const getTrustScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (filterStatus !== 'all' && complaint.status !== filterStatus) return false;
    if (filterPriority !== 'all' && complaint.priority !== filterPriority) return false;
    if (searchTerm && !complaint.complaint_id?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !complaint.office_location?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending' || c.status === 'under_investigation').length,
    resolved: complaints.filter(c => c.status === 'resolved' || c.status === 'verified').length,
    rejected: complaints.filter(c => c.status === 'rejected' || c.status === 'dismissed').length,
    urgent: complaints.filter(c => c.priority === 'urgent').length,
    high: complaints.filter(c => c.priority === 'high').length,
    medium: complaints.filter(c => c.priority === 'medium').length,
    low: complaints.filter(c => c.priority === 'low').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">আপনার অভিযোগ লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            আমার অভিযোগ সমূহ
          </h1>
          <p className="text-gray-600">
            আপনি যেসব অভিযোগ করেছেন সেগুলোর অবস্থা দেখুন
          </p>
        </div>

        {/* Trust Score Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-5 mb-8 border border-blue-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">আপনার ট্রাস্ট স্কোর</p>
                <div className="flex items-center gap-2">
                  <Star className={`h-5 w-5 ${getTrustScoreColor(user?.trust_score || 50)}`} />
                  <span className={`text-2xl font-bold ${getTrustScoreColor(user?.trust_score || 50)}`}>
                    {user?.trust_score || 50}
                  </span>
                  <span className="text-sm text-gray-500">/ ১০০</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-3 md:gap-6">
              <div className="text-center">
                <p className="text-xs text-gray-500">যাচাইকৃত অভিযোগ</p>
                <p className="text-lg font-semibold text-green-600">+৫ পয়েন্ট</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">প্রত্যাখ্যাত অভিযোগ</p>
                <p className="text-lg font-semibold text-red-600">-১০ পয়েন্ট</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">মিথ্যা অভিযোগ</p>
                <p className="text-lg font-semibold text-red-600">-১৫ পয়েন্ট</p>
              </div>
            </div>
            
            <Link 
              to="/trust-score" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm whitespace-nowrap"
            >
              বিস্তারিত দেখুন →
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">মোট অভিযোগ</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">বিবেচনাধীন</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">নিষ্পত্তি হয়েছে</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">প্রত্যাখ্যাত</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
          </div>
        </div>

        {/* Priority Stats Row */}
        {stats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <Flag className="h-4 w-4 text-red-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">জরুরি</p>
              <p className="text-xl font-bold text-red-600">{stats.urgent}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <Flag className="h-4 w-4 text-orange-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">উচ্চ</p>
              <p className="text-xl font-bold text-orange-600">{stats.high}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <Flag className="h-4 w-4 text-blue-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">মধ্যম</p>
              <p className="text-xl font-bold text-blue-600">{stats.medium}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Flag className="h-4 w-4 text-gray-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">নিম্ন</p>
              <p className="text-xl font-bold text-gray-600">{stats.low}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg mb-8 p-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition mb-3"
          >
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">ফিল্টার করুন</span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {showFilters && (
            <div className="flex flex-wrap gap-4 items-center justify-between pt-3 border-t">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    filterStatus === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  সব অবস্থা
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    filterStatus === 'pending' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  বিবেচনাধীন
                </button>
                <button
                  onClick={() => setFilterStatus('under_investigation')}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    filterStatus === 'under_investigation' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  তদন্তাধীন
                </button>
                <button
                  onClick={() => setFilterStatus('resolved')}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    filterStatus === 'resolved' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  নিষ্পত্তি হয়েছে
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterPriority('all')}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    filterPriority === 'all' 
                      ? 'bg-gray-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  সব প্রায়োরিটি
                </button>
                <button
                  onClick={() => setFilterPriority('urgent')}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    filterPriority === 'urgent' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  জরুরি
                </button>
                <button
                  onClick={() => setFilterPriority('high')}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    filterPriority === 'high' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  উচ্চ
                </button>
                <button
                  onClick={() => setFilterPriority('medium')}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    filterPriority === 'medium' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  মধ্যম
                </button>
              </div>
              
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="অভিযোগ আইডি বা অফিস অনুসন্ধান..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:border-blue-600 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Complaints List */}
        {filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">কোনো অভিযোগ নেই</h3>
            <p className="text-gray-500 mb-4">আপনি এখনও কোনো অভিযোগ করেননি</p>
            <a 
              href="/complaint" 
              className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
            >
              নতুন অভিযোগ করুন
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => (
              <div 
                key={complaint.id} 
                ref={el => complaintRefs.current[complaint.complaint_id] = el}
                id={`complaint-${complaint.complaint_id}`}
                className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 ${complaint.is_public ? 'border-2 border-red-500' : ''}`}
              >
                {/* Complaint Header */}
                <div 
                  className={`px-6 py-4 border-b flex justify-between items-center flex-wrap gap-2 cursor-pointer transition ${
                    complaint.is_public ? 'bg-red-50 hover:bg-red-100' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => toggleComplaintDetails(complaint.id)}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    {getStatusIcon(complaint.status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(complaint.status)}`}>
                      {getStatusText(complaint.status)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getPriorityBadge(complaint.priority)}`}>
                      {getPriorityIcon(complaint.priority)}
                      {getPriorityText(complaint.priority)}
                    </span>
                    {complaint.is_public && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        পাবলিক
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                      অভিযোগ আইডি: {complaint.complaint_id}
                    </div>
                    {selectedComplaint === complaint.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Complaint Body */}
                {selectedComplaint === complaint.id && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">অফিসের অবস্থান</p>
                          <p className="font-medium">{complaint.office_location}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">ঘটনার তারিখ</p>
                          <p className="font-medium">
                            {complaint.incident_date ? new Date(complaint.incident_date).toLocaleDateString('bn-BD') : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {complaint.amount_requested && (
                        <div className="flex items-start gap-2">
                          <DollarSign className="h-4 w-4 text-red-500 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">দাবিকৃত অর্থ</p>
                            <p className="font-medium text-red-600">{complaint.amount_requested} টাকা</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">অভিযোগের তারিখ</p>
                          <p className="font-medium">
                            {complaint.reported_at ? new Date(complaint.reported_at).toLocaleDateString('bn-BD') : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">বিবরণ</p>
                      <p className="text-gray-700">{complaint.description}</p>
                    </div>

                    {/* Public Pressure Warning */}
                    {!complaint.is_public && complaint.days_remaining !== undefined && complaint.days_remaining <= 3 && (
                      <div className="mb-4 bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
                        <p className="text-sm text-orange-700">
                          ⚠️ এই অভিযোগের নিষ্পত্তির সময়সীমা {complaint.days_remaining} দিন বাকি। সময়সীমা অতিক্রম করলে আপনি অভিযোগটি পাবলিক করতে পারবেন।
                        </p>
                      </div>
                    )}

                    {!complaint.is_public && complaint.days_overdue > 0 && (
                      <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded">
                        <p className="text-sm text-red-700 font-semibold mb-2">
                          ⚠️ এই অভিযোগটি {complaint.days_overdue} দিন বিলম্বিত হয়েছে!
                        </p>
                        <button
                          onClick={() => makeComplaintPublic(complaint.complaint_id)}
                          disabled={makingPublic[complaint.complaint_id]}
                          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                        >
                          <Globe className="h-4 w-4" />
                          {makingPublic[complaint.complaint_id] ? 'পাবলিক করা হচ্ছে...' : 'এখনই পাবলিক করুন'}
                        </button>
                      </div>
                    )}

                    {complaint.is_public && (
                      <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-3 rounded">
                        <p className="text-sm text-green-700 flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          এই অভিযোগটি পাবলিক করা হয়েছে। সাধারণ মানুষ এটিতে সমর্থন জানাতে পারবেন, যা দ্রুত নিষ্পত্তিতে সহায়তা করবে।
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">{complaint.upvotes_count || 0} জন সমর্থন দিয়েছেন</span>
                        </div>
                      </div>
                    )}

                    {/* Evidence Section */}
                    {complaint.evidence_documents && complaint.evidence_documents.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-2">প্রমাণ দলিল ({complaint.evidence_documents.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {complaint.evidence_documents.map((evidence, idx) => (
                            <button
                              key={idx}
                              onClick={() => viewEvidence(evidence.url)}
                              className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg text-sm transition"
                            >
                              {evidence.format === 'pdf' ? (
                                <File className="h-4 w-4 text-red-500" />
                              ) : (
                                <Image className="h-4 w-4 text-blue-500" />
                              )}
                              <span>{evidence.name || `প্রমাণ ${idx + 1}`}</span>
                              <ExternalLink className="h-3 w-3 text-gray-500" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Investigation Notes */}
                    {complaint.investigation_notes && (
                      <div className="mt-4 bg-blue-50 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-800 mb-1">তদন্ত নোট:</p>
                        <p className="text-sm text-blue-700">{complaint.investigation_notes}</p>
                      </div>
                    )}

                    {/* Feedback */}
                    {complaint.feedback_to_citizen && (
                      <div className="mt-3 bg-green-50 rounded-lg p-4">
                        <p className="text-sm font-semibold text-green-800 mb-1">কর্তৃপক্ষের বার্তা:</p>
                        <p className="text-sm text-green-700">{complaint.feedback_to_citizen}</p>
                      </div>
                    )}

                    {/* Action Taken */}
                    {complaint.action_taken && (
                      <div className="mt-3 bg-purple-50 rounded-lg p-4">
                        <p className="text-sm font-semibold text-purple-800 mb-1">গৃহীত ব্যবস্থা:</p>
                        <p className="text-sm text-purple-700">{complaint.action_taken}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New Complaint Button */}
        <div className="fixed bottom-8 right-8">
          <a
            href="/complaint"
            className="bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition flex items-center gap-2"
          >
            <AlertTriangle className="h-6 w-6" />
            <span className="font-semibold hidden md:inline">নতুন অভিযোগ</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default CitizenComplaintTracker;