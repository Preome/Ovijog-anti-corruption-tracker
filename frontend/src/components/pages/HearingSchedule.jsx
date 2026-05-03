import { useState } from 'react';
import API from '../../services/api';
import { Calendar, Video, X } from 'lucide-react';
import toast from 'react-hot-toast';

function HearingSchedule({ complaint, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    meeting_type: 'video',
    scheduled_time: '',
    duration_minutes: 30,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await API.post(`/hearings/create/${complaint.complaint_id}/`, formData);
      if (response.data.success) {
        toast.success('শুনানি সফলভাবে নির্ধারিত হয়েছে!');
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'শুনানি নির্ধারণ করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">ডিজিটাল শুনানি নির্ধারণ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-semibold">শুনানির ধরন</label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, meeting_type: 'video' })}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${formData.meeting_type === 'video' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
              >
                <Video className="h-5 w-5" />
                <span className="text-xs">ভিডিও কনফারেন্স</span>
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-semibold">তারিখ ও সময়</label>
            <input
              type="datetime-local"
              name="scheduled_time"
              required
              min={getMinDateTime()}
              value={formData.scheduled_time}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-semibold">সময়কাল (মিনিটে)</label>
            <select
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
            >
              <option value="15">১৫ মিনিট</option>
              <option value="30">৩০ মিনিট</option>
              <option value="45">৪৫ মিনিট</option>
              <option value="60">৬০ মিনিট</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">ভিডিও লিংক ও নোট</label>
            <textarea
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              placeholder="শুনানির বিষয়ে গুরুত্বপূর্ণ তথ্য..."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
            ></textarea>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'নির্ধারণ করা হচ্ছে...' : 'শুনানি নির্ধারণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HearingSchedule;