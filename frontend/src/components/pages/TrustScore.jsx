import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { Shield, Star, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function TrustScore() {
  const { user } = useAuth();
  const [trustData, setTrustData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrustScore();
    fetchLeaderboard();
  }, []);

  const fetchTrustScore = async () => {
    try {
      const response = await API.get('/auth/trust-score/');
      setTrustData(response.data);
    } catch (error) {
      console.error('Error fetching trust score:', error);
      toast.error('ট্রাস্ট স্কোর লোড করতে ব্যর্থ হয়েছে');
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await API.get('/auth/leaderboard/');
      console.log('Leaderboard response:', response.data);
      
      // Handle paginated response (with results array)
      let leaderboardData = [];
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        leaderboardData = response.data.results;
      } else if (Array.isArray(response.data)) {
        leaderboardData = response.data;
      }
      
      console.log('Processed leaderboard:', leaderboardData);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getLevelEmoji = (level) => {
    switch(level) {
      case 'high': return '🌟';
      case 'medium': return '⭐';
      default: return '⚠️';
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
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            নাগরিক ট্রাস্ট স্কোর
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            আপনার বিশ্বস্ততা স্কোর আপনার অভিযোগ ও আবেদনের ইতিহাসের ভিত্তিতে গণনা করা হয়।
            উচ্চ স্কোর দ্রুত সেবা ও অগ্রাধিকার পেতে সহায়তা করে।
          </p>
        </div>

        {/* Trust Score Card */}
        {trustData && (
          <div className="max-w-md mx-auto mb-12">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="relative inline-block">
                <div className={`w-32 h-32 rounded-full ${getScoreBgColor(trustData.trust_score)} flex items-center justify-center mx-auto mb-4`}>
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(trustData.trust_score)}`}>
                      {trustData.trust_score}
                    </div>
                    <div className="text-xs text-gray-500">সর্বোচ্চ ১০০</div>
                  </div>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">
                {getLevelEmoji(trustData.trust_level)} {trustData.trust_level_display}
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{trustData.total_complaints || 0}</div>
                  <div className="text-sm text-gray-600">মোট অভিযোগ</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{trustData.verified_complaints || 0}</div>
                  <div className="text-sm text-gray-600">যাচাইকৃত</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{trustData.rejected_complaints || 0}</div>
                  <div className="text-sm text-gray-600">প্রত্যাখ্যাত</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{trustData.successful_applications || 0}</div>
                  <div className="text-sm text-gray-600">সফল সেবা</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How Score is Calculated */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            স্কোর কীভাবে গণনা করা হয়?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold">যাচাইকৃত অভিযোগ</p>
                <p className="text-sm text-gray-600">প্রতি যাচাইকৃত অভিযোগে +৫ পয়েন্ট</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-semibold">সফল আবেদন</p>
                <p className="text-sm text-gray-600">প্রতি সফল আবেদনে +৩ পয়েন্ট</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold">প্রত্যাখ্যাত অভিযোগ</p>
                <p className="text-sm text-gray-600">প্রতি প্রত্যাখ্যাত অভিযোগে -১০ পয়েন্ট</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-semibold">মিথ্যা অভিযোগ</p>
                <p className="text-sm text-gray-600">প্রতি মিথ্যা অভিযোগে -১৫ পয়েন্ট</p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 উচ্চ স্কোর থাকলে আপনার অভিযোগ অগ্রাধিকার পাবে এবং দ্রুত নিষ্পত্তি হবে।
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Star className="h-5 w-5" />
              শীর্ষ বিশ্বস্ত নাগরিক
            </h2>
          </div>
          
          <div className="divide-y">
            {!leaderboard || leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">কোনো তথ্য নেই</p>
              </div>
            ) : (
              leaderboard.map((citizen, index) => (
                <div key={citizen.id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{citizen.username}</p>
                      <p className="text-sm text-gray-500">{citizen.trust_level_display}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{citizen.trust_score}</div>
                    <div className="text-xs text-gray-500">ট্রাস্ট স্কোর</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Benefits of High Trust Score */}
        <div className="mt-8 bg-green-50 rounded-lg p-6">
          <h3 className="font-semibold text-green-800 mb-3">উচ্চ ট্রাস্ট স্কোরের সুবিধা:</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
            <li>✓ অগ্রাধিকার ভিত্তিতে অভিযোগ নিষ্পত্তি</li>
            <li>✓ দ্রুত সেবা প্রদান</li>
            <li>✓ বেশি গুরুত্ব সহকারে বিবেচনা</li>
            <li>✓ বিশেষ সেবা সুবিধা</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TrustScore;