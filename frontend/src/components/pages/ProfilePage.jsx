import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Mail, Phone, Briefcase, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

function ProfilePage() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    toast.success('লগআউট সফল হয়েছে');
    navigate('/');
  };

  const getRoleBadge = (role) => {
    const roles = {
      citizen: { label: 'নাগরিক', color: 'bg-green-500' },
      officer: { label: 'সরকারি কর্মকর্তা', color: 'bg-blue-500' },
      admin: { label: 'প্রশাসক', color: 'bg-purple-500' },
    };
    const roleData = roles[role] || { label: role, color: 'bg-gray-500' };
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-white text-sm ${roleData.color}`}>
        {roleData.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-4">
                  <Shield className="h-12 w-12 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-800">
                    {user?.full_name_bn || user?.username}
                  </h1>
                  <div className="mt-1">{getRoleBadge(user?.role)}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                <LogOut className="h-4 w-4" />
                লগআউট
              </button>
            </div>

            {/* User Info */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold mb-4">ব্যক্তিগত তথ্য</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <span className="font-semibold">ইউজারনেম:</span>
                  <span>{user?.username}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <span className="font-semibold">ইমেইল:</span>
                  <span>{user?.email || 'প্রদান করা হয়নি'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <span className="font-semibold">মোবাইল:</span>
                  <span>{user?.phone || 'প্রদান করা হয়নি'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-gray-500" />
                  <span className="font-semibold">এনআইডি:</span>
                  <span>{user?.nid || 'প্রদান করা হয়নি'}</span>
                </div>
              </div>
            </div>

            {user?.role === 'officer' && (
              <div className="border-t pt-6 mt-4">
                <h2 className="text-xl font-bold mb-4">অফিসের তথ্য</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">অফিসের নাম:</span>
                    <span>{user?.office_name || 'প্রদান করা হয়নি'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">পদবি:</span>
                    <span>{user?.designation || 'প্রদান করা হয়নি'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats for different roles */}
          {user?.role === 'citizen' && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-xl font-bold mb-4">আপনার আবেদনসমূহ</h2>
              <p className="text-gray-600 text-center py-8">
                আপনার কোনো আবেদন নেই। নতুন আবেদন করতে <a href="/apply" className="text-blue-600">এখানে ক্লিক করুন</a>
              </p>
            </div>
          )}

          {user?.role === 'officer' && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-xl font-bold mb-4">পেন্ডিং আবেদন</h2>
              <p className="text-gray-600 text-center py-8">
                কোনো পেন্ডিং আবেদন নেই।
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;