import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

function VerifyEmailPage() {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    console.log('Verification token from URL:', token);

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyEmail(token);
  }, []);

  const verifyEmail = async (token) => {
    try {
      console.log('Sending verification request with token:', token);
      
      const response = await API.post('/auth/verify-email/', { token });
      console.log('Verification response:', response.data);
      
      if (response.data.success) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        toast.success('Email verified! You can now login.');
        
        // Store verification status
        localStorage.setItem('email_verified', 'true');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else if (error.response?.data?.error) {
        setMessage(error.response.data.error);
      } else {
        setMessage('Verification failed. Please try again or contact support.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          {status === 'verifying' && (
            <>
              <Loader className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Verifying your email...
              </h1>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Email Verified!
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="inline-block w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-center"
                >
                  Go to Login
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Verification Failed
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="inline-block w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-center"
                >
                  Go to Login
                </Link>
                <Link
                  to="/register"
                  className="inline-block w-full bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition text-center"
                >
                  Register Again
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;