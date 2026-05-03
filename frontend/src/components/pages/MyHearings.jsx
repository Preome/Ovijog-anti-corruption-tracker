import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { Calendar, Clock, Video, Phone, MessageCircle, ExternalLink, MapPin, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

function MyHearings() {
  const { user } = useAuth();
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyHearings();
  }, []);

  const fetchMyHearings = async () => {
    setLoading(true);
    try {
      const response = await API.get('/hearings/my-hearings/');
      console.log('API Response:', response.data);
      
      let hearingsData = [];
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        hearingsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        hearingsData = response.data;
      }
      
      console.log('Processed hearings:', hearingsData);
      setHearings(hearingsData);
    } catch (error) {
      console.error('Error fetching hearings:', error);
      toast.error('শুনানির তথ্য লোড করতে ব্যর্থ হয়েছে');
      setHearings([]);
    } finally {
      setLoading(false);
    }
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
            আমার শুনানি সমূহ
          </h1>
          <p className="text-gray-600">
            আপনার নির্ধারিত ডিজিটাল শুনানির তথ্য এখানে দেখুন
          </p>
        </div>

        {hearings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">কোনো শুনানি নেই</h3>
            <p className="text-gray-500">আপনার এখনো কোনো শুনানি নির্ধারিত হয়নি</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hearings.map((hearing) => (
              <div key={hearing.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                {/* Hearing Header */}
                <div className={`px-6 py-4 ${hearing.status === 'scheduled' ? 'bg-blue-50' : 'bg-gray-50'} border-b`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {getMeetingIcon(hearing.meeting_type)}
                      <span className="font-semibold text-gray-800">
                        {getMeetingTypeText(hearing.meeting_type)}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(hearing.status)}`}>
                      {getStatusText(hearing.status)}
                    </span>
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

                  {/* Notes */}
                  {hearing.notes && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">{hearing.notes}</p>
                    </div>
                  )}

                  {/* Status Message Only - No Join Button */}
                  {hearing.status === 'scheduled' && (
                    <div className="text-center text-blue-600 text-sm">
                      শুনানি নির্ধারিত রয়েছে
                    </div>
                  )}

                  {hearing.status === 'ongoing' && (
                    <div className="text-center text-green-600 text-sm animate-pulse">
                      শুনানি চলমান
                    </div>
                  )}

                  {hearing.status === 'completed' && (
                    <div className="text-center text-gray-500 text-sm">
                      এই শুনানি সম্পন্ন হয়েছে
                    </div>
                  )}

                  {hearing.status === 'cancelled' && (
                    <div className="text-center text-red-500 text-sm">
                      এই শুনানি বাতিল করা হয়েছে
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

export default MyHearings;