import { useState } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';

function ComplaintPage() {
  const [formData, setFormData] = useState({
    service_type: 'passport',
    office_location: '',
    incident_date: '',
    amount_requested: '',
    officer_name: '',
    description: '',
    is_anonymous: true
  });
  const [loading, setLoading] = useState(false);
  const [complaintId, setComplaintId] = useState('');

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await API.post('/complaints/', formData);
      setComplaintId(response.data.complaint_id);
      toast.success('অভিযোগ জমা দেওয়া হয়েছে!');
    } catch (error) {
      toast.error('অভিযোগ জমা দিতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  if (complaintId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-4">অভিযোগ গৃহীত হয়েছে</h2>
            <p className="text-gray-600 mb-4">আপনার অভিযোগ আইডি:</p>
            <p className="text-2xl font-bold text-blue-600 mb-6">{complaintId}</p>
            <p className="text-sm text-gray-500">আপনার পরিচয় গোপন রাখা হবে।</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">ঘুষের অভিযোগ করুন</h1>
        
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-700">
              ⚠️ আপনার পরিচয় সম্পূর্ণ গোপন রাখা হবে। সঠিক তথ্য প্রদান করুন।
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-semibold">সেবার ধরন *</label>
              <select
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="passport">পাসপোর্ট</option>
                <option value="driving_license">ড্রাইভিং লাইসেন্স</option>
                <option value="birth_certificate">জন্ম নিবন্ধন</option>
                <option value="tax_id">ট্যাক্স আইডি</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-semibold">অফিসের অবস্থান *</label>
              <input
                type="text"
                name="office_location"
                required
                value={formData.office_location}
                onChange={handleChange}
                placeholder="জেলা, থানা, অফিসের নাম"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-semibold">ঘটনার তারিখ *</label>
              <input
                type="date"
                name="incident_date"
                required
                value={formData.incident_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-semibold">বিস্তারিত বিবরণ *</label>
              <textarea
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                rows="5"
                placeholder="কি ঘটেছিল? কখন? কোথায়? বিস্তারিত বলুন..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
              ></textarea>
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_anonymous"
                  checked={formData.is_anonymous}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-gray-700">আমার পরিচয় গোপন রাখুন</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-semibold"
            >
              {loading ? 'প্রক্রিয়াধীন...' : 'অভিযোগ জমা দিন'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ComplaintPage;