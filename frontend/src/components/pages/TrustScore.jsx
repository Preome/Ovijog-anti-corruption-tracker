import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { Shield, Star, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function TrustScore() {
  const { user } = useAuth();
  const [trustData, setTrustData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrustScore();
  }, []);

  const fetchTrustScore = async () => {
    try {
      const response = await API.get('/auth/trust-score/');
      setTrustData(response.data);
    } catch (error) {
      console.error('Error fetching trust score:', error);
      toast.error('ট্রাস্ট স্কোর লোড করতে ব্যর্থ হয়েছে');
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
      default: return '';
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
            <p >
              
            </p>
          </div>
        </div>

        {/* Benefits of High Trust Score */}
        
      </div>
    </div>
  );
}

export default TrustScore;