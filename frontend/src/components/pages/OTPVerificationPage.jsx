import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Key, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import API from '../../services/api';

function OTPVerificationPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get email from localStorage
    const storedEmail = localStorage.getItem('pending_verification_email');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // If no email, redirect to register
      toast.error('No pending verification found');
      navigate('/register');
    }
    
    // Start timer for OTP expiry
    startTimer();
  }, []);

  const startTimer = () => {
    setTimer(600); // 10 minutes in seconds
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('6 ডিজিটের OTP দিন');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/auth/verify-otp/', { email, otp });
      if (response.data.success) {
        setVerified(true);
        toast.success('ইমেইল ভেরিফিকেশন সফল!');
        
        // Clear pending email
        localStorage.removeItem('pending_verification_email');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error(error.response?.data?.message || 'ভুল OTP, আবার চেষ্টা করুন');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) {
      toast.error(`OTP পেতে ${formatTime(timer)} অপেক্ষা করুন`);
      return;
    }

    setResendLoading(true);
    try {
      const response = await API.post('/auth/resend-otp/', { email });
      if (response.data.success) {
        toast.success('নতুন OTP আপনার ইমেইলে পাঠানো হয়েছে');
        startTimer();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP পাঠাতে ব্যর্থ হয়েছে');
    } finally {
      setResendLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">ইমেইল ভেরিফাইড!</h1>
            <p className="text-gray-600 mb-6">আপনার ইমেইল সফলভাবে ভেরিফাই করা হয়েছে।</p>
            <Link
              to="/login"
              className="inline-block w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-center"
            >
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
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">ইমেইল ভেরিফিকেশন</h1>
            <p className="text-gray-600 mt-2">
              আমরা একটি 6-ডিজিটের OTP পাঠিয়েছি
            </p>
            <p className="text-blue-600 font-semibold mt-1 break-all">{email}</p>
          </div>

          <form onSubmit={handleVerify}>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-semibold">
                OTP লিখুন
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="XXXXXX"
                className="w-full px-4 py-3 text-center text-2xl tracking-widest border rounded-lg focus:outline-none focus:border-blue-600"
                maxLength="6"
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-2">
                OTP মেয়াদ শেষ হবে: <span className="font-semibold text-red-600">{formatTime(timer)}</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
            >
              {loading ? 'ভেরিফাই করা হচ্ছে...' : 'ভেরিফাই করুন'}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={handleResendOTP}
              disabled={resendLoading || timer > 0}
              className="text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
            >
              <RefreshCw className={`h-4 w-4 ${resendLoading ? 'animate-spin' : ''}`} />
              {resendLoading ? 'পাঠানো হচ্ছে...' : 'পুনরায় OTP পাঠান'}
            </button>
            {timer > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {formatTime(timer)} পরে নতুন OTP চাইতে পারবেন
              </p>
            )}
          </div>

          <div className="text-center mt-8 pt-6 border-t">
            <Link to="/login" className="text-gray-600 hover:text-blue-600 transition flex items-center gap-1 justify-center">
              <ArrowLeft className="h-4 w-4" />
              লগইন পেজে ফিরুন
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OTPVerificationPage;