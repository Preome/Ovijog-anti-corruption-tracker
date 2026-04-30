import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield } from 'lucide-react';

function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      toast.success('লগইন সফল হয়েছে!');
      navigate('/');
    } else {
      toast.error(result.error || 'লগইন ব্যর্থ হয়েছে');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">লগইন করুন</h1>
            <p className="text-gray-600 mt-2">আপনার অ্যাকাউন্টে লগইন করুন</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-semibold">
                ইউজারনেম / ফোন / এনআইডি
              </label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="ইউজারনেম, ফোন বা এনআইডি দিন"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-semibold">
                পাসওয়ার্ড
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
            >
              {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              অ্যাকাউন্ট নেই?{' '}
              <Link to="/register" className="text-blue-600 hover:underline">
                রেজিস্ট্রেশন করুন
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;