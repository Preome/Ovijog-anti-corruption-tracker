import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield } from 'lucide-react';

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    password2: '',
    email: '',
    phone: '',
    nid: '',
    role: 'citizen',
    full_name_bn: '',
    office_name: '',
    designation: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username) {
      toast.error('ইউজারনেম প্রয়োজন');
      return;
    }
    
    if (formData.password !== formData.password2) {
      toast.error('পাসওয়ার্ড দুটি মিলছে না');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে 6 অক্ষরের হতে হবে');
      return;
    }
    
    setLoading(true);
    
    // Prepare data to send (remove password2)
    const submitData = {
      username: formData.username,
      password: formData.password,
      password2: formData.password2,
      email: formData.email || '',
      phone: formData.phone || '',
      nid: formData.nid || '',
      role: formData.role,
      full_name_bn: formData.full_name_bn || '',
      office_name: formData.office_name || '',
      designation: formData.designation || '',
    };
    
    try {
      const result = await register(submitData);
      
      if (result.success) {
        toast.success('রেজিস্ট্রেশন সফল হয়েছে!');
        navigate('/');
      } else {
        // Handle different error formats
        if (result.error) {
          if (typeof result.error === 'object') {
            Object.values(result.error).forEach(err => {
              toast.error(Array.isArray(err) ? err[0] : err);
            });
          } else {
            toast.error(result.error);
          }
        } else {
          toast.error('রেজিস্ট্রেশন ব্যর্থ হয়েছে');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('রেজিস্ট্রেশন ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">রেজিস্ট্রেশন করুন</h1>
            <p className="text-gray-600 mt-2">একটি নতুন অ্যাকাউন্ট তৈরি করুন</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">
                  ইউজারনেম *
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="ইউজারনেম দিন"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                />
                <p className="text-xs text-gray-500 mt-1">ইউনিক ইউজারনেম (যেমন: john_doe)</p>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">
                  পূর্ণ নাম (বাংলা)
                </label>
                <input
                  type="text"
                  name="full_name_bn"
                  value={formData.full_name_bn}
                  onChange={handleChange}
                  placeholder="আপনার বাংলা নাম"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">
                  পাসওয়ার্ড *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="পাসওয়ার্ড দিন"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                />
                <p className="text-xs text-gray-500 mt-1">কমপক্ষে 6 অক্ষর</p>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">
                  পাসওয়ার্ড নিশ্চিত করুন *
                </label>
                <input
                  type="password"
                  name="password2"
                  required
                  value={formData.password2}
                  onChange={handleChange}
                  placeholder="পাসওয়ার্ড আবার দিন"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">
                  ইমেইল
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="youremail@example.com"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">
                  মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                />
                <p className="text-xs text-gray-500 mt-1">বাংলাদেশি নম্বর (01XXXXXXXXX)</p>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">
                  এনআইডি নম্বর
                </label>
                <input
                  type="text"
                  name="nid"
                  value={formData.nid}
                  onChange={handleChange}
                  placeholder="10 বা 17 সংখ্যার এনআইডি"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">
                  ভূমিকা *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                >
                  <option value="citizen">নাগরিক</option>
                  <option value="officer">সরকারি কর্মকর্তা</option>
                </select>
              </div>

              {formData.role === 'officer' && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2 font-semibold">
                      অফিসের নাম *
                    </label>
                    <input
                      type="text"
                      name="office_name"
                      value={formData.office_name}
                      onChange={handleChange}
                      placeholder="আপনার অফিসের নাম"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2 font-semibold">
                      পদবি
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="আপনার পদবি"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold mt-4"
            >
              {loading ? 'প্রক্রিয়াধীন...' : 'রেজিস্ট্রেশন করুন'}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                লগইন করুন
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;