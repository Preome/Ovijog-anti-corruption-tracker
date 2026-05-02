import { useState, useEffect } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Eye, CheckCircle, XCircle, AlertTriangle, 
  Clock, FileText, User, Calendar, MapPin,
  DollarSign, MessageSquare, Flag, Upload,
  Download, Send, ArrowLeft, Image, File
} from 'lucide-react';

function ComplaintManagement({ complaint, onClose, onUpdate }) {
  const [complaintData, setComplaintData] = useState(complaint);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    status: complaint?.status || 'pending',
    priority: complaint?.priority || 'medium',
    investigation_notes: complaint?.investigation_notes || '',
    action_taken: complaint?.action_taken || '',
    feedback_to_citizen: complaint?.feedback_to_citizen || ''
  });

  useEffect(() => {
    fetchComplaintDetails();
  }, [complaint?.complaint_id]);

  const fetchComplaintDetails = async () => {
    if (!complaint?.complaint_id) return;
    
    setLoading(true);
    try {
      const response = await API.get(`/complaints/${complaint.complaint_id}/`);
      setComplaintData(response.data);
      setFormData({
        status: response.data.status || 'pending',
        priority: response.data.priority || 'medium',
        investigation_notes: response.data.investigation_notes || '',
        action_taken: response.data.action_taken || '',
        feedback_to_citizen: response.data.feedback_to_citizen || ''
      });
    } catch (error) {
      console.error('Error fetching complaint details:', error);
      toast.error('অভিযোগের তথ্য লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      const response = await API.patch(`/complaints/${complaint.complaint_id}/update-status/`, formData);
      if (response.data.success) {
        toast.success('অভিযোগের অবস্থা আপডেট করা হয়েছে');
        onUpdate?.();
        onClose();
      } else {
        toast.error('আপডেট করতে ব্যর্থ হয়েছে');
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
      toast.error('আপডেট করতে ব্যর্থ হয়েছে');
    } finally {
      setUpdating(false);
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
      verified: 'যাচাইকৃত - ব্যবস্থা নেওয়া হয়েছে',
      rejected: 'প্রমাণহীন - বাতিল',
      escalated: 'উর্ধ্বতন কর্তৃপক্ষে প্রেরিত',
      resolved: 'নিষ্পত্তি হয়েছে',
      dismissed: 'মিথ্যা অভিযোগ'
    };
    return texts[status] || status;
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

  const viewEvidence = (url) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              অভিযোগের বিস্তারিত
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(complaintData?.status)}`}>
              {getStatusText(complaintData?.status)}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Complaint Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">অভিযোগ আইডি:</span>
                <span>{complaintData?.complaint_id}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-4 w-4" />
                <span className="font-semibold">সেবার ধরন:</span>
                <span>{complaintData?.service_type}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="font-semibold">অফিসের অবস্থান:</span>
                <span>{complaintData?.office_location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-4 w-4" />
                <span className="font-semibold">অভিযুক্ত কর্মকর্তা:</span>
                <span>{complaintData?.officer_name || 'অজানা'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="font-semibold">ঘটনার তারিখ:</span>
                <span>{complaintData?.incident_date ? new Date(complaintData.incident_date).toLocaleDateString('bn-BD') : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="font-semibold">অভিযোগের তারিখ:</span>
                <span>{complaintData?.reported_at ? new Date(complaintData.reported_at).toLocaleDateString('bn-BD') : 'N/A'}</span>
              </div>
              {complaintData?.amount_requested && (
                <div className="flex items-center gap-2 text-red-600">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold">দাবিকৃত অর্থ:</span>
                  <span>{complaintData.amount_requested} টাকা</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                <span className="font-semibold">প্রায়োরিটি:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(complaintData?.priority)}`}>
                  {complaintData?.priority === 'urgent' ? 'জরুরি' : 
                   complaintData?.priority === 'high' ? 'উচ্চ' :
                   complaintData?.priority === 'medium' ? 'মধ্যম' : 'নিম্ন'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">বিস্তারিত বিবরণ</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">{complaintData?.description}</p>
            </div>
          </div>

          {/* Evidence Documents */}
          {complaintData?.evidence_documents && complaintData.evidence_documents.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">প্রমাণ দলিল ({complaintData.evidence_documents.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {complaintData.evidence_documents.map((evidence, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition" onClick={() => viewEvidence(evidence.url)}>
                    {evidence.format === 'pdf' ? (
                      <div className="text-center">
                        <File className="h-12 w-12 text-red-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-700 truncate">{evidence.name || 'PDF ফাইল'}</p>
                        <button className="mt-2 text-blue-600 text-xs hover:underline">দেখুন</button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <img 
                          src={evidence.url} 
                          alt={`Evidence ${index + 1}`}
                          className="h-24 w-full object-cover rounded-lg"
                        />
                        <p className="text-xs text-gray-500 mt-1 truncate">{evidence.name || 'ছবি'}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Update Form */}
          <form onSubmit={handleSubmit}>
            <h3 className="text-lg font-semibold mb-4">অভিযোগের অবস্থা পরিবর্তন করুন</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 mb-2 font-semibold">স্ট্যাটাস</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                >
                  <option value="pending">বিবেচনাধীন</option>
                  <option value="under_investigation">তদন্তাধীন</option>
                  <option value="verified">যাচাইকৃত - ব্যবস্থা নেওয়া হয়েছে</option>
                  <option value="rejected">প্রমাণহীন - বাতিল</option>
                  <option value="escalated">উর্ধ্বতন কর্তৃপক্ষে প্রেরিত</option>
                  <option value="resolved">নিষ্পত্তি হয়েছে</option>
                  <option value="dismissed">মিথ্যা অভিযোগ</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-semibold">প্রায়োরিটি লেভেল</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                >
                  <option value="low">নিম্ন</option>
                  <option value="medium">মধ্যম</option>
                  <option value="high">উচ্চ</option>
                  <option value="urgent">জরুরি</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-semibold">তদন্ত নোট / পর্যবেক্ষণ</label>
              <textarea
                name="investigation_notes"
                value={formData.investigation_notes}
                onChange={handleChange}
                rows="3"
                placeholder="তদন্তের বিবরণ ও পর্যবেক্ষণ লিখুন..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
              ></textarea>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-semibold">গৃহীত ব্যবস্থা</label>
              <textarea
                name="action_taken"
                value={formData.action_taken}
                onChange={handleChange}
                rows="2"
                placeholder="কি ব্যবস্থা নেওয়া হয়েছে..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
              ></textarea>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-semibold">অভিযোগকারীর জন্য বার্তা</label>
              <textarea
                name="feedback_to_citizen"
                value={formData.feedback_to_citizen}
                onChange={handleChange}
                rows="2"
                placeholder="অভিযোগকারীকে জানানোর বার্তা লিখুন..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {updating ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ComplaintManagement;