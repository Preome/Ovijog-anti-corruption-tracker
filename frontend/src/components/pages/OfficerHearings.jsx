import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { Calendar, Clock, Video, Phone, MessageCircle, MapPin, FileText, CheckCircle, XCircle, Clock as ClockIcon, Users } from 'lucide-react';
import toast from 'react-hot-toast';

function OfficerHearings() {
  const { user } = useAuth();
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDetails, setShowDetails] = useState({});

  useEffect(() => {
    fetchMyHearings();
  }, []);

  const fetchMyHearings = async () => {
    setLoading(true);
    try {
      const response = await API.get('/hearings/my-hearings/');
      let hearingsData = [];
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        hearingsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        hearingsData = response.data;
      }
      setHearings(hearingsData);
    } catch (error) {
      console.error('Error fetching hearings:', error);
      toast.error('শুনানির তথ্য লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const updateHearingStatus = async (hearingId, newStatus, resolution = '') => {
    try {
      const response = await API.patch(`/hearings/${hearingId}/update-status/`, {
        status: newStatus,
        resolution: resolution
      });
      if (response.data.success) {
        toast.success(`শুনানি ${newStatus === 'completed' ? 'সম্পন্ন' : newStatus === 'ongoing' ? 'চলমান' : 'আপডেট'} করা হয়েছে`);
        fetchMyHearings();
      }
    } catch (error) {
      toast.error('স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে');
    }
  };

  const toggleDetails = (hearingId) => {
    setShowDetails(prev => ({ ...prev, [hearingId]: !prev[hearingId] }));
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      rescheduled: 'bg-yellow-100 text-yellow-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      scheduled: 'নির্ধারিত',
      ongoing: 'চলমান',
      completed: 'সম্পন্ন',
      cancelled: 'বাতিল',
      rescheduled: 'পুনর্নির্ধারিত'
    };
    return texts[status] || status;
  };

  const getMeetingIcon = (type) => {
    switch(type) {
      case 'video': return <Video className="h-5 w-5 text-blue-600" />;
      case 'audio': return <Phone className="h-5 w-5 text-purple-600" />;
      case 'chat': return <MessageCircle className="h-5 w-5 text-green-600" />;
      default: return <Video className="h-5 w-5 text-blue-600" />;
    }
  };

  const getMeetingTypeText = (type) => {
    switch(type) {
      case 'video': return 'ভিডিও কনফারেন্স';
      case 'audio': return 'অডিও কল';
      case 'chat': return 'টেক্সট চ্যাট';
      default: return type;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isHearingExpired = (scheduledTime) => {
    return new Date(scheduledTime) < new Date();
  };

  const filteredHearings = hearings.filter(hearing => {
    if (filterStatus !== 'all' && hearing.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: hearings.length,
    scheduled: hearings.filter(h => h.status === 'scheduled').length,
    ongoing: hearings.filter(h => h.status === 'ongoing').length,
    completed: hearings.filter(h => h.status === 'completed').length
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Calendar className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            আমার নির্ধারিত শুনানি
          </h1>
          <p className="text-gray-600">
            আপনার নির্ধারিত ডিজিটাল শুনানির তথ্য এখানে দেখুন এবং পরিচালনা করুন
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">মোট শুনানি</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">নির্ধারিত</p>
                <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">চলমান</p>
                <p className="text-2xl font-bold text-green-600">{stats.ongoing}</p>
              </div>
              <Video className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">সম্পন্ন</p>
                <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg mb-6 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              সব শুনানি
            </button>
            <button
              onClick={() => setFilterStatus('scheduled')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'scheduled' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              নির্ধারিত
            </button>
            <button
              onClick={() => setFilterStatus('ongoing')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'ongoing' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              চলমান
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'completed' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              সম্পন্ন
            </button>
          </div>
        </div>

        {/* Hearings List */}
        {filteredHearings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">কোনো শুনানি নেই</h3>
            <p className="text-gray-500">আপনার এখনো কোনো শুনানি নির্ধারিত হয়নি</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredHearings.map((hearing) => (
              <div key={hearing.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                {/* Hearing Header */}
                <div className={`px-6 py-4 ${hearing.status === 'scheduled' ? 'bg-blue-50' : hearing.status === 'ongoing' ? 'bg-green-50' : 'bg-gray-50'} border-b`}>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {getMeetingIcon(hearing.meeting_type)}
                      <span className="font-semibold text-gray-800">
                        {getMeetingTypeText(hearing.meeting_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(hearing.status)}`}>
                        {getStatusText(hearing.status)}
                      </span>
                      {hearing.status === 'scheduled' && isHearingExpired(hearing.scheduled_time) && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          সময় অতিবাহিত
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hearing Body */}
                <div className="p-6">
                  {/* Complaint Info */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">অভিযোগ আইডি:</span>
                      <span className="text-sm">{hearing.complaint_id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">অভিযোগকারী:</span>
                      <span className="text-sm">{hearing.citizen_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 mt-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-medium">অফিসের অবস্থান:</span>
                      <span className="text-sm">{hearing.office_location || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-500">তারিখ ও সময়</p>
                        <p className="font-semibold text-gray-800">{formatDate(hearing.scheduled_time)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-500">সময়কাল</p>
                        <p className="font-semibold text-gray-800">{hearing.duration_minutes} মিনিট</p>
                      </div>
                    </div>
                  </div>

                  {/* Meeting Link */}
                  {hearing.meeting_link && (
                    <div className="mb-4">
                      <a
                        href={hearing.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                      >
                        <Video className="h-4 w-4" />
                        শুনানিতে যোগ দিন
                      </a>
                    </div>
                  )}

                  {/* Notes */}
                  {hearing.notes && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">{hearing.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {hearing.status === 'scheduled' && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => updateHearingStatus(hearing.hearing_id, 'ongoing')}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        শুনানি শুরু করুন
                      </button>
                      <button
                        onClick={() => updateHearingStatus(hearing.hearing_id, 'cancelled')}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                      >
                        বাতিল করুন
                      </button>
                    </div>
                  )}

                  {hearing.status === 'ongoing' && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => {
                          const resolution = prompt('শুনানির ফলাফল ও সিদ্ধান্ত লিখুন:');
                          if (resolution) {
                            updateHearingStatus(hearing.hearing_id, 'completed', resolution);
                          }
                        }}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        শুনানি সমাপ্ত করুন
                      </button>
                    </div>
                  )}

                  {/* Resolution */}
                  {hearing.status === 'completed' && hearing.resolution && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-semibold text-green-800 mb-1">শুনানির ফলাফল:</p>
                      <p className="text-sm text-green-700">{hearing.resolution}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OfficerHearings;