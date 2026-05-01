import { useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const navigate = useNavigate();

  // Hardcoded departments with correct values
  const departments = [
    { id: 1, name: 'passport', name_bn: 'পাসপোর্ট অধিদপ্তর' },
    { id: 2, name: 'driving_license', name_bn: 'বিআরটিএ - ড্রাইভিং লাইসেন্স' },
    { id: 3, name: 'birth_certificate', name_bn: 'জন্ম নিবন্ধন অধিদপ্তর' },
    { id: 4, name: 'tax_id', name_bn: 'কর অধিদপ্তর - ট্যাক্স আইডি' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name} = ${value}`);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('Current form data:', formData);
    
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
    
    // Prepare submit data - ONLY include fields that the backend expects
    const submitData = {
      username: formData.username.trim(),
      password: formData.password,
      password2: formData.password2,
      email: formData.email.trim(),
      role: formData.role,
    };
    
    // Add optional fields only if they have values
    if (formData.phone && formData.phone.trim()) {
      submitData.phone = formData.phone.trim();
    }
    if (formData.nid && formData.nid.trim()) {
      submitData.nid = formData.nid.trim();
    }
    if (formData.full_name_bn && formData.full_name_bn.trim()) {
      submitData.full_name_bn = formData.full_name_bn.trim();
    }
    
    // Officer specific fields
    if (formData.role === 'officer') {
      if (formData.office_name && formData.office_name.trim()) {
        submitData.office_name = formData.office_name.trim();
      }
      if (formData.designation && formData.designation.trim()) {
        submitData.designation = formData.designation.trim();
      }
      
      // IMPORTANT: Send department as a number (ID)
      if (formData.department) {
        const deptId = parseInt(formData.department, 10);
        if (!isNaN(deptId) && deptId >= 1 && deptId <= 4) {
          submitData.department = deptId;
          console.log('Sending department ID:', deptId);
        } else {
          toast.error('বৈধ বিভাগ নির্বাচন করুন');
          setLoading(false);
          return;
        }
      }
    }
    
    console.log('Final submit data:', JSON.stringify(submitData, null, 2));
    
    try {
      const response = await API.post('/auth/register/', submitData);
      console.log('Registration response:', response.data);
      
      if (response.data.success) {
        setRegisteredEmail(formData.email);
        setVerificationSent(true);
        toast.success('রেজিস্ট্রেশন সফল! আপনার ইমেইল ভেরিফাই করুন');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.data) {
        const errors = error.response.data;
        console.log('Error details:', errors);
        
        // Display specific error messages
        if (errors.department) {
          toast.error(`বিভাগ: ${errors.department[0]}`);
        } else if (errors.office_name) {
          toast.error(`অফিসের নাম: ${errors.office_name[0]}`);
        } else if (errors.username) {
          toast.error(`ইউজারনেম: ${errors.username[0]}`);
        } else if (errors.email) {
          toast.error(`ইমেইল: ${errors.email[0]}`);
        } else if (errors.nid) {
          toast.error(`এনআইডি: ${errors.nid[0]}`);
        } else if (errors.phone) {
          toast.error(`ফোন: ${errors.phone[0]}`);
        } else if (typeof errors === 'object') {
          const firstError = Object.values(errors)[0];
          if (Array.isArray(firstError)) {
            toast.error(firstError[0]);
          } else if (typeof firstError === 'string') {
            toast.error(firstError);
          }
        } else {
          toast.error('রেজিস্ট্রেশন ব্যর্থ হয়েছে');
        }
      } else {
        toast.error('রেজিস্ট্রেশন ব্যর্থ হয়েছে');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-green-500 text-6xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">ইমেইল ভেরিফিকেশন প্রয়োজন</h1>
            <p className="text-gray-600 mb-4">আমরা {registeredEmail} এ একটি ভেরিফিকেশন লিংক পাঠিয়েছি।</p>
            <Link to="/login" className="block w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-center">
              লগইন পেজে যান
            </Link>
          </div>
        </div>
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
                <input 
                  type="text" 
                  name="username" 
                  required 
                  value={formData.username} 
                  onChange={handleChange} 
                  placeholder="ইউজারনেম দিন" 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600" 
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">পূর্ণ নাম (বাংলা)</label>
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
                <label className="block text-gray-700 mb-2 font-semibold">ইমেইল *</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="youremail@example.com" 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600" 
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">মোবাইল নম্বর</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="017XXXXXXXX" 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-600" 
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">এনআইডি নম্বর</label>
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
                <label className="block text-gray-700 mb-2 font-semibold">ভূমিকা *</label>
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

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">পাসওয়ার্ড *</label>
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
                <label className="block text-gray-700 mb-2 font-semibold">পাসওয়ার্ড নিশ্চিত করুন *</label>
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

              {formData.role === 'officer' && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2 font-semibold">অফিসের নাম *</label>
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
                    <label className="block text-gray-700 mb-2 font-semibold">পদবি</label>
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
                    <label className="block text-gray-700 mb-2 font-semibold">বিভাগ *</label>
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
                  </div>
                </>
              )}
            </div>

            {formData.role === 'officer' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 mt-2">
                <p className="text-sm text-yellow-700">
                  কর্মকর্তা অ্যাকাউন্ট সক্রিয় করতে অ্যাডমিন এপ্রুভাল প্রয়োজন।
                </p>
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