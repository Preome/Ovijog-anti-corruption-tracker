import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

function AdminApprovalPage() {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPendingUsers();
    }
  }, [user]);

  const fetchPendingUsers = async () => {
    try {
      const response = await API.get('/auth/pending-users/');
      setPendingUsers(response.data);
    } catch (error) {
      toast.error('পেন্ডিং ইউজার লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, status, reason = '') => {
    setProcessingId(userId);
    try {
      await API.post(`/auth/approve-user/${userId}/`, { status, rejection_reason: reason });
      toast.success(status === 'approved' ? 'অ্যাকাউন্ট অনুমোদিত হয়েছে' : 'অ্যাকাউন্ট প্রত্যাখ্যান করা হয়েছে');
      fetchPendingUsers();
    } catch (error) {
      toast.error('অপারেশন ব্যর্থ হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="text-center py-20">আপনার এই পেজে অ্যাক্সেস নেই</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              অফিসার অ্যাকাউন্ট অনুমোদন
            </h1>
            <p className="text-gray-600">
              নিচের তালিকায় পেন্ডিং অফিসারদের অ্যাকাউন্ট অনুমোদন বা প্রত্যাখ্যান করুন
            </p>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <UserCheck className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600">কোনো পেন্ডিং অ্যাকাউন্ট নেই</h3>
              <p className="text-gray-500">সব অফিসার অ্যাকাউন্ট অনুমোদিত হয়েছে</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((pendingUser) => (
                <div key={pendingUser.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {pendingUser.full_name_bn || pendingUser.username}
                      </h3>
                      <p className="text-sm text-gray-600">ইউজারনেম: {pendingUser.username}</p>
                      <p className="text-sm text-gray-600">ইমেইল: {pendingUser.email}</p>
                      <p className="text-sm text-gray-600">ফোন: {pendingUser.phone || 'N/A'}</p>
                      <p className="text-sm text-gray-600">অফিস: {pendingUser.office_name}</p>
                      <p className="text-sm text-gray-600">
                        বিভাগ: {pendingUser.department_name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        জয়েন করেছেন: {new Date(pendingUser.created_at).toLocaleDateString('bn-BD')}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(pendingUser.id, 'approved')}
                        disabled={processingId === pendingUser.id}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        <CheckCircle className="h-4 w-4" />
                        অনুমোদন করুন
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('প্রত্যাখ্যানের কারণ লিখুন:');
                          if (reason) {
                            handleApprove(pendingUser.id, 'rejected', reason);
                          }
                        }}
                        disabled={processingId === pendingUser.id}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                      >
                        <XCircle className="h-4 w-4" />
                        প্রত্যাখ্যান করুন
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminApprovalPage;