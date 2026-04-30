import { useState } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';

function TrackPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trackingNumber) {
      toast.error('ট্র্যাকিং নম্বর দিন');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await API.get(`/applications/${trackingNumber}/`);
      setApplication(response.data);
      toast.success('আবেদন পাওয়া গেছে');
    } catch (error) {
      toast.error('আবেদন পাওয়া যায়নি');
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-blue-500',
      processing: 'bg-yellow-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
      delayed: 'bg-orange-500'
    };
    return colors[status] || 'bg-gray-500';
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">আবেদন ট্র্যাক করুন</h1>
        
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ট্র্যাকিং নম্বর দিন (যেমন: TRK-XXXXXXXX)"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'অনুসন্ধান...' : 'ট্র্যাক করুন'}
            </button>
          </div>
        </form>

        {application && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">আবেদনের তথ্য</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="font-semibold">ট্র্যাকিং নম্বর:</span>
                <span>{application.tracking_number}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="font-semibold">সেবার ধরন:</span>
                <span>{application.service_type || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b items-center">
                <span className="font-semibold">স্ট্যাটাস:</span>
                <span className={`inline-block px-3 py-1 rounded-full text-white text-sm ${getStatusColor(application.status)}`}>
                  {getStatusText(application.status)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackPage;