import { useState } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';

function ApplyPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service_type: 'passport'
  });
  const [loading, setLoading] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await API.post('/applications/', formData);
      setTrackingNumber(response.data.tracking_number);
      toast.success('আবেদন সফল হয়েছে!');
    } catch (error) {
      toast.error('আবেদন জমা দিতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  if (trackingNumber) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-4">আবেদন সফল হয়েছে!</h2>
            <p className="text-gray-600 mb-4">আপনার ট্র্যাকিং নম্বর:</p>
            <p className="text-2xl font-bold text-blue-600 mb-6">{trackingNumber}</p>
            <p className="text-sm text-gray-500 mb-6">এই নম্বরটি সংরক্ষণ করুন।</p>
            <div className="space-x-4">
              <a 
                href="/track" 
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                স্ট্যাটাস ট্র্যাক করুন
              </a>
              <button
                onClick={() => {
                  setTrackingNumber('');
                  setFormData({ name: '', phone: '', email: '', service_type: 'passport' });
                }}
                className="inline-block bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                নতুন আবেদন
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">নতুন আবেদন</h1>
        
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-semibold">পূর্ণ নাম *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="আপনার পূর্ণ নাম লিখুন"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-semibold">মোবাইল নম্বর *</label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="01XXXXXXXXX"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">সেবার ধরন *</label>
            <select
              name="service_type"
              value={formData.service_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
            >
              <option value="passport">পাসপোর্ট</option>
              <option value="driving_license">ড্রাইভিং লাইসেন্স</option>
              <option value="birth_certificate">জন্ম নিবন্ধন</option>
              <option value="tax_id">ট্যাক্স আইডি</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
          >
            {loading ? 'প্রক্রিয়াধীন...' : 'আবেদন জমা দিন'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ApplyPage;