import { useState, useEffect } from 'react';
import API from '../../services/api';
import { AlertTriangle, ThumbsUp, Clock, MapPin, Flag, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

function PublicPressureBoard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState({});

  useEffect(() => {
    fetchPublicComplaints();
  }, []);

  const fetchPublicComplaints = async () => {
    try {
      const response = await API.get('/public-complaints/');
      setComplaints(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching public complaints:', error);
      toast.error('পাবলিক অভিযোগ লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (complaintId) => {
    setUpvoting(prev => ({ ...prev, [complaintId]: true }));
    try {
      const response = await API.post(`/public-complaints/${complaintId}/upvote/`);
      if (response.data.success) {
        setComplaints(prev => prev.map(c => 
          c.complaint_id === complaintId 
            ? { ...c, upvotes: response.data.upvotes }
            : c
        ));
        toast.success('সমর্থন জানানোর জন্য ধন্যবাদ!');
      }
    } catch (error) {
      toast.error('আবার চেষ্টা করুন');
    } finally {
      setUpvoting(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Flag className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            পাবলিক প্রেশার বোর্ড
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            এই বোর্ডে প্রদর্শিত অভিযোগগুলি নির্দিষ্ট সময়ের মধ্যে নিষ্পত্তি না হওয়ায় 
            ভুক্তভোগীদের দ্বারা পাবলিক করা হয়েছে। আপনার সমর্থন দ্রুত সমাধানে সহায়তা করে।
          </p>
        </div>

        {complaints.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">কোনো পাবলিক অভিযোগ নেই</h3>
            <p className="text-gray-500">বর্তমানে কোনো পাবলিক অভিযোগ নেই।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {complaints.map((complaint) => (
              <div key={complaint.complaint_id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className="bg-red-600 text-white px-4 py-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    <span className="text-sm font-semibold">পাবলিক প্রেশার</span>
                  </div>
                  <span className="text-xs bg-red-500 px-2 py-1 rounded">
                    {complaint.days_overdue} দিন বিলম্বিত
                  </span>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{complaint.office_location}</span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {complaint.service_type === 'passport' ? 'পাসপোর্ট' :
                     complaint.service_type === 'driving_license' ? 'ড্রাইভিং লাইসেন্স' :
                     complaint.service_type === 'birth_certificate' ? 'জন্ম নিবন্ধন' : 'ট্যাক্স আইডি'}
                  </h3>
                  
                  <p className="text-gray-700 mb-4">{complaint.description}</p>
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <button
                      onClick={() => handleUpvote(complaint.complaint_id)}
                      disabled={upvoting[complaint.complaint_id]}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {upvoting[complaint.complaint_id] ? 'পাঠানো হচ্ছে...' : `সমর্থন (${complaint.upvotes || 0})`}
                    </button>
                    
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      complaint.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {complaint.status === 'resolved' ? 'নিষ্পত্তি হয়েছে' : 'প্রক্রিয়াধীন'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicPressureBoard;