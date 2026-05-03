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
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        departmentsArray = response.data.results;
      } else if (Array.isArray(response.data)) {
        departmentsArray = response.data;
      }
      
      console.log('Departments array:', departmentsArray);
      setDepartments(departmentsArray);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name} = ${value}`);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('Current form data:', formData);
    
    // Validation
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
    
    // Handle department - IMPORTANT: send only the ID as number
    if (formData.role === 'officer' && formData.department) {
      let deptId;
      
      // If department is an object (has id property), extract the id
      if (typeof formData.department === 'object' && formData.department !== null) {
        deptId = formData.department.id;
      } else {
        // If it's a string or number, parse it
        deptId = parseInt(formData.department, 10);
      }
      
      console.log('Department raw value:', formData.department);
      console.log('Extracted department ID:', deptId);
      
      if (!isNaN(deptId) && deptId > 0) {
        submitData.department = deptId;
      } else {
        toast.error('বৈধ বিভাগ নির্বাচন করুন');
        setLoading(false);
        return;
      }
    }
    
    console.log('Final submit data:', submitData);
    
    try {
      const response = await API.post('/auth/register/', submitData);
      console.log('Registration response:', response.data);
      
      if (response.data.success) {
        localStorage.setItem('pending_verification_email', formData.email);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
                <label className="block text-gray-700 mb-2 font-semibold">ইউজারনেম *</label>
                <input type="text" name="username" required value={formData.username} onChange={handleChange} placeholder="ইউজারনেম দিন" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600" />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">পূর্ণ নাম (বাংলা)</label>
                <input type="text" name="full_name_bn" value={formData.full_name_bn} onChange={handleChange} placeholder="আপনার বাংলা নাম" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600" />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">ইমেইল *</label>
                <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="youremail@example.com" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600" />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">মোবাইল নম্বর</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="017XXXXXXXX" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600" />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">এনআইডি নম্বর</label>
                <input type="text" name="nid" value={formData.nid} onChange={handleChange} placeholder="10 বা 17 সংখ্যার এনআইডি" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600" />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">ভূমিকা *</label>
                <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600">
                  <option value="citizen">নাগরিক</option>
                  <option value="officer">সরকারি কর্মকর্তা</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">পাসওয়ার্ড *</label>
                <input type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="পাসওয়ার্ড দিন" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600" />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">পাসওয়ার্ড নিশ্চিত করুন *</label>
                <input type="password" name="password2" required value={formData.password2} onChange={handleChange} placeholder="পাসওয়ার্ড আবার দিন" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600" />
              </div>

              {formData.role === 'officer' && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2 font-semibold">অফিসের নাম *</label>
                    <input type="text" name="office_name" value={formData.office_name} onChange={handleChange} placeholder="আপনার অফিসের নাম" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600" />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2 font-semibold">পদবি</label>
                    <input type="text" name="designation" value={formData.designation} onChange={handleChange} placeholder="আপনার পদবি" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600" />
                  </div>

                  <div className="mb-4 col-span-2">
                    <label className="block text-gray-700 mb-2 font-semibold">বিভাগ *</label>
                    {departmentsLoading ? (
                      <div className="text-gray-500">বিভাগ লোড হচ্ছে...</div>
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
                  </div>
                </>
              )}
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold">
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