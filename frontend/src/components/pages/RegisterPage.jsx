import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, AlertCircle } from 'lucide-react';
import API from '../../services/api';

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
    department: ''
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setDepartmentsLoading(true);
    try {
      const response = await API.get('/auth/departments/');
      console.log('Departments response:', response.data);
      
      let departmentsArray = [];
      
      // Handle paginated response (with results array)
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        departmentsArray = response.data.results;
      } 
      // Handle direct array response
      else if (Array.isArray(response.data)) {
        departmentsArray = response.data;
      }
      // Handle object response
      else if (response.data && typeof response.data === 'object') {
        departmentsArray = Object.values(response.data).filter(item => item && typeof item === 'object' && item.id);
      }
      
      console.log('Processed departments:', departmentsArray);
      setDepartments(departmentsArray);
      
      if (departmentsArray.length === 0) {
        console.warn('No departments found');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('বিভাগের তালিকা লোড করতে ব্যর্থ হয়েছে');
      // Fallback departments
      setDepartments([
        { id: 1, name_bn: 'পাসপোর্ট অধিদপ্তর' },
        { id: 2, name_bn: 'বিআরটিএ - ড্রাইভিং লাইসেন্স' },
        { id: 3, name_bn: 'জন্ম নিবন্ধন অধিদপ্তর' },
        { id: 4, name_bn: 'কর অধিদপ্তর - ট্যাক্স আইডি' }
      ]);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Basic validation
    if (!formData.username.trim()) {
      toast.error('ইউজারনেম প্রয়োজন');
      setLoading(false);
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('ইমেইল প্রয়োজন');
      setLoading(false);
      return;
    }
    
    if (!formData.password) {
      toast.error('পাসওয়ার্ড প্রয়োজন');
      setLoading(false);
      return;
    }
    
    if (formData.password !== formData.password2) {
      toast.error('পাসওয়ার্ড দুটি মিলছে না');
      setLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে 6 অক্ষরের হতে হবে');
      setLoading(false);
      return;
    }
    
    // Officer-specific validation
    if (formData.role === 'officer') {
      if (!formData.office_name.trim()) {
        toast.error('অফিসের নাম প্রয়োজন');
        setLoading(false);
        return;
      }
      if (!formData.department) {
        toast.error('বিভাগ নির্বাচন করুন');
        setLoading(false);
        return;
      }
    }
    
    // Prepare submit data
    const submitData = {
      username: formData.username.trim(),
      password: formData.password,
      password2: formData.password2,
      email: formData.email.trim(),
      role: formData.role,
    };
    
    // Add optional fields
    if (formData.phone) submitData.phone = formData.phone;
    if (formData.nid) submitData.nid = formData.nid;
    if (formData.full_name_bn) submitData.full_name_bn = formData.full_name_bn;
    if (formData.office_name) submitData.office_name = formData.office_name;
    if (formData.designation) submitData.designation = formData.designation;
    
    // Convert department to number for officer role
    if (formData.role === 'officer' && formData.department) {
      const deptId = parseInt(formData.department, 10);
      if (!isNaN(deptId) && deptId > 0) {
        submitData.department = deptId;
      }
    }
    
    console.log('Final submit data:', submitData);
    
    try {
      const response = await API.post('/auth/register/', submitData);
      console.log('Registration response:', response.data);
      
      if (response.data.success) {
        // Store email for OTP verification
        localStorage.setItem('pending_verification_email', formData.email);
        // Redirect to OTP verification page
        navigate('/verify-otp');
        toast.success('রেজিস্ট্রেশন সফল! আপনার ইমেইলে OTP পাঠানো হয়েছে');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.data) {
        const errors = error.response.data;
        
        if (typeof errors === 'object') {
          Object.entries(errors).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              toast.error(`${key}: ${value[0]}`);
            } else if (typeof value === 'string') {
              toast.error(value);
            }
          });
        } else {
          toast.error(errors);
        }
      } else {
        toast.error('রেজিস্ট্রেশন ব্যর্থ হয়েছে');
      }
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
              {/* Username */}
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

              {/* Full Name Bengali */}
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

              {/* Email */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">
                  ইমেইল *
                </label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="youremail@example.com" 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600" 
                />
                <p className="text-xs text-gray-500 mt-1">ভেরিফিকেশন OTP এই ইমেইলে পাঠানো হবে</p>
              </div>

              {/* Phone */}
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

              {/* NID */}
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

              {/* Role */}
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
                <p className="text-xs text-gray-500 mt-1">
                  {formData.role === 'officer' 
                    ? 'কর্মকর্তা অ্যাকাউন্ট অ্যাডমিন এপ্রুভাল প্রয়োজন' 
                    : 'নাগরিক অ্যাকাউন্ট ইমেইল ভেরিফিকেশনের পর সক্রিয় হবে'}
                </p>
              </div>

              {/* Password */}
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

              {/* Confirm Password */}
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

              {/* Officer-specific fields */}
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

                  <div className="mb-4 col-span-2">
                    <label className="block text-gray-700 mb-2 font-semibold">
                      বিভাগ *
                    </label>
                    {departmentsLoading ? (
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>বিভাগ লোড হচ্ছে...</span>
                      </div>
                    ) : (
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                      >
                        <option value="">বিভাগ নির্বাচন করুন</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name_bn}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {!departmentsLoading && departments.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        কোনো বিভাগ পাওয়া যায়নি। দয়া করে অ্যাডমিনের সাথে যোগাযোগ করুন।
                      </p>
                    )}
                    
                    {!departmentsLoading && departments.length > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ {departments.length} টি বিভাগ উপলব্ধ
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Info Box for Officers */}
            {formData.role === 'officer' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 mt-2">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                  <div>
                    <p className="text-sm text-yellow-700 font-semibold">গুরুত্বপূর্ণ তথ্য:</p>
                    <p className="text-sm text-yellow-700">
                      কর্মকর্তা অ্যাকাউন্ট সক্রিয় করতে অ্যাডমিন এপ্রুভাল প্রয়োজন। 
                      ইমেইল ভেরিফিকেশনের পর আপনার অ্যাকাউন্ট অ্যাপ্রুভালের জন্য অপেক্ষা করুন।
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box for Citizens */}
            {formData.role === 'citizen' && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 mt-2">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-400 mr-2" />
                  <div>
                    <p className="text-sm text-blue-700 font-semibold">গুরুত্বপূর্ণ তথ্য:</p>
                    <p className="text-sm text-blue-700">
                      রেজিস্ট্রেশনের পর আপনার ইমেইলে একটি OTP পাঠানো হবে। 
                      ইমেইল ভেরিফিকেশনের পর আপনি লগইন করতে পারবেন।
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
            >
              {loading ? 'প্রক্রিয়াধীন...' : 'রেজিস্ট্রেশন করুন'}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">লগইন করুন</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;