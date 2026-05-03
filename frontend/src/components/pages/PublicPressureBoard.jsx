import { useState, useEffect } from 'react';
import API from '../../services/api';
import { AlertTriangle, ThumbsUp, Clock, MapPin, Flag, Star, Shield, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

function PublicPressureBoard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState({});
  const [showTrustDetails, setShowTrustDetails] = useState({});

  useEffect(() => {
    fetchPublicComplaints();
  }, []);

  const fetchPublicComplaints = async () => {
    try {
      const response = await API.get('/public-complaints/');
      setComplaints(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching public complaints:', error);
      toast.error('পাবলিক অভিযোগ লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (complaintId) => {
    setUpvoting(prev => ({ ...prev, [complaintId]: true }));
    try {
      const response = await API.post(`/public-complaints/${complaintId}/upvote/`);
      if (response.data.success) {
        setComplaints(prev => prev.map(c => 
          c.complaint_id === complaintId 
            ? { ...c, upvotes: response.data.upvotes }
            : c
        ));
        toast.success('সমর্থন জানানোর জন্য ধন্যবাদ!');
      }
    } catch (error) {
      toast.error('আবার চেষ্টা করুন');
    } finally {
      setUpvoting(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  const toggleTrustDetails = (complaintId) => {
    setShowTrustDetails(prev => ({ ...prev, [complaintId]: !prev[complaintId] }));
  };

  const getTrustScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrustLevelBadge = (level) => {
    const badges = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800',
      anonymous: 'bg-gray-100 text-gray-600'
    };
    return badges[level] || 'bg-gray-100 text-gray-800';
  };

  const getTrustLevelText = (level) => {
    const texts = {
      high: 'বিশ্বস্ত নাগরিক',
      medium: 'মধ্যম বিশ্বস্ত',
      low: 'নিম্ন বিশ্বস্ত',
      anonymous: 'বেনামী অভিযোগ'
    };
    return texts[level] || 'অজানা';
  };

  const getBackgroundColor = (complaint) => {
    if (complaint.is_anonymous) return 'bg-gray-50';
    if (complaint.reporter_trust_level === 'high') return 'bg-green-50';
    if (complaint.reporter_trust_level === 'medium') return 'bg-yellow-50';
    return 'bg-red-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Flag className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            জনতার কণ্ঠ বোর্ড
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            এই বোর্ডে প্রদর্শিত অভিযোগগুলি নির্দিষ্ট সময়ের মধ্যে নিষ্পত্তি না হওয়ায় 
            ভুক্তভোগীদের দ্বারা পাবলিক করা হয়েছে। আপনার সমর্থন দ্রুত সমাধানে সহায়তা করে।
          </p>
        </div>

        {complaints.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">কোনো পাবলিক অভিযোগ নেই</h3>
            <p className="text-gray-500">বর্তমানে কোনো পাবলিক অভিযোগ নেই।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {complaints.map((complaint) => (
              <div key={complaint.complaint_id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                {/* Header */}
                <div className="bg-red-600 text-white px-4 py-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    <span className="text-sm font-semibold">জনতার কণ্ঠ</span>
                  </div>
                  <span className="text-xs bg-red-500 px-2 py-1 rounded">
                    {complaint.days_overdue} দিন বিলম্বিত
                  </span>
                </div>
                
                <div className="p-6">
                  {/* Reporter Trust Score Section - Enhanced */}
                  <div className={`mb-3 p-3 rounded-lg ${getBackgroundColor(complaint)} transition-all duration-300`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {complaint.is_anonymous ? (
                          <EyeOff className="h-5 w-5 text-gray-500" />
                        ) : (
                          <Shield className={`h-5 w-5 ${
                            complaint.reporter_trust_level === 'high' ? 'text-green-600' :
                            complaint.reporter_trust_level === 'medium' ? 'text-yellow-600' : 'text-red-600'
                          }`} />
                        )}
                        <span className="text-sm font-medium">
                          {complaint.is_anonymous ? 'বেনামী অভিযোগ' : 'অভিযোগকারীর বিশ্বস্ততা'}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleTrustDetails(complaint.complaint_id)}
                        className="text-gray-400 hover:text-gray-600 transition"
                      >
                        {showTrustDetails[complaint.complaint_id] ? 'সংক্ষেপে দেখুন' : 'বিস্তারিত দেখুন'}
                      </button>
                    </div>

                    {!showTrustDetails[complaint.complaint_id] ? (
                      // Simplified view
                      <div className="mt-2">
                        {!complaint.is_anonymous && complaint.reporter_trust_score ? (
                          <div className="flex items-center gap-2">
                            <Star className={`h-4 w-4 ${getTrustScoreColor(complaint.reporter_trust_score)}`} />
                            <span className={`font-semibold ${getTrustScoreColor(complaint.reporter_trust_score)}`}>
                              {complaint.reporter_trust_score}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getTrustLevelBadge(complaint.reporter_trust_level)}`}>
                              {getTrustLevelText(complaint.reporter_trust_level)}
                            </span>
                          </div>
                        ) : complaint.is_anonymous ? (
                          <p className="text-sm text-gray-500 mt-1">
                            এই অভিযোগটি বেনামীভাবে জমা দেওয়া হয়েছে
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1">
                            বিশ্বস্ততার তথ্য উপলব্ধ নয়
                          </p>
                        )}
                      </div>
                    ) : (
                      // Detailed view
                      <div className="mt-3 space-y-2">
                        {!complaint.is_anonymous && complaint.reporter_trust_score ? (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">ট্রাস্ট স্কোর</span>
                              <div className="flex items-center gap-2">
                                <Star className={`h-4 w-4 ${getTrustScoreColor(complaint.reporter_trust_score)}`} />
                                <span className={`font-bold ${getTrustScoreColor(complaint.reporter_trust_score)}`}>
                                  {complaint.reporter_trust_score}/১০০
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">বিশ্বস্ততার স্তর</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getTrustLevelBadge(complaint.reporter_trust_level)}`}>
                                {getTrustLevelText(complaint.reporter_trust_level)}
                              </span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-500">
                                {complaint.reporter_trust_level === 'high' ? 
                                  'এই নাগরিকের অভিযোগ অত্যন্ত বিশ্বাসযোগ্য' :
                                  complaint.reporter_trust_level === 'medium' ? 
                                  'এই নাগরিকের অভিযোগ মধ্যম মানের' : 
                                  'সতর্কতার সাথে বিবেচনা করুন'}
                              </p>
                            </div>
                          </>
                        ) : complaint.is_anonymous ? (
                          <div className="text-center py-2">
                            <EyeOff className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">
                              এই অভিযোগটি বেনামীভাবে জমা দেওয়া হয়েছে
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              পরিচয় গোপন রাখা হয়েছে
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-2">
                            বিশ্বস্ততার তথ্য উপলব্ধ নয়
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Office Location */}
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{complaint.office_location}</span>
                  </div>
                  
                  {/* Service Type */}
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {complaint.service_type === 'passport' ? 'পাসপোর্ট' :
                     complaint.service_type === 'driving_license' ? 'ড্রাইভিং লাইসেন্স' :
                     complaint.service_type === 'birth_certificate' ? 'জন্ম নিবন্ধন' : 'ট্যাক্স আইডি'}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-700 mb-4">{complaint.description}</p>
                  
                  {/* Footer */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <button
                      onClick={() => handleUpvote(complaint.complaint_id)}
                      disabled={upvoting[complaint.complaint_id]}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {upvoting[complaint.complaint_id] ? 'পাঠানো হচ্ছে...' : `সমর্থন (${complaint.upvotes || 0})`}
                    </button>
                    
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      complaint.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {complaint.status === 'resolved' ? 'নিষ্পত্তি হয়েছে' : 'প্রক্রিয়াধীন'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicPressureBoard;