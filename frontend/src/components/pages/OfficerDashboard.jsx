import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { 
  FileText, AlertTriangle, Clock, CheckCircle, Eye, 
  Filter, Download, TrendingUp, Flag, Image, File,
  Search, X, ChevronDown, Shield, Building, Calendar, Video
} from 'lucide-react';
import toast from 'react-hot-toast';
import ComplaintManagement from './ComplaintManagement';
import HearingSchedule from './HearingSchedule';

function OfficerDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showHearingSchedule, setShowHearingSchedule] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total_complaints: 0,
    verified_complaints: 0,
    pending_complaints: 0,
    under_investigation: 0,
    resolved_complaints: 0,
    urgent_complaints: 0,
    high_priority: 0,
    medium_priority: 0,
    low_priority: 0,
    avg_resolution_time: 0,
    corruption_hotspots: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const complaintsRes = await API.get('/complaints/all-complaints/');
      
      const complaintsData = Array.isArray(complaintsRes.data) ? complaintsRes.data : [];
      
      setComplaints(complaintsData);
      
      // Calculate stats from complaints data
      const total = complaintsData.length;
      const pending = complaintsData.filter(c => c.status === 'pending').length;
      const underInvestigation = complaintsData.filter(c => c.status === 'under_investigation').length;
      const verified = complaintsData.filter(c => c.status === 'verified').length;
      const resolved = complaintsData.filter(c => c.status === 'resolved').length;
      const urgent = complaintsData.filter(c => c.priority === 'urgent').length;
      const high = complaintsData.filter(c => c.priority === 'high').length;
      const medium = complaintsData.filter(c => c.priority === 'medium').length;
      const low = complaintsData.filter(c => c.priority === 'low').length;
      
      // Calculate hotspots
      const hotspots = {};
      complaintsData.forEach(complaint => {
        const location = complaint.office_location;
        if (location) {
          hotspots[location] = (hotspots[location] || 0) + 1;
        }
      });
      const hotspotsList = Object.entries(hotspots).map(([location, count]) => ({ location, count })).slice(0, 5);
      
      setStats({
        total_complaints: total,
        verified_complaints: verified,
        pending_complaints: pending,
        under_investigation: underInvestigation,
        resolved_complaints: resolved,
        urgent_complaints: urgent,
        high_priority: high,
        medium_priority: medium,
        low_priority: low,
        avg_resolution_time: 7.5,
        corruption_hotspots: hotspotsList
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('ডেটা লোড করতে ব্যর্থ হয়েছে');
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleComplaintClick = (complaint) => {
    setSelectedComplaint(complaint);
  };

  const getComplaintStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_investigation: 'bg-blue-100 text-blue-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      escalated: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getComplaintStatusText = (status) => {
    const texts = {
      pending: 'বিবেচনাধীন',
      under_investigation: 'তদন্তাধীন',
      verified: 'যাচাইকৃত',
      rejected: 'প্রমাণহীন',
      escalated: 'উর্ধ্বতন কর্তৃপক্ষে প্রেরিত',
      resolved: 'নিষ্পত্তি হয়েছে',
      dismissed: 'মিথ্যা অভিযোগ'
    };
    return texts[status] || status;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return badges[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityText = (priority) => {
    const texts = {
      low: 'নিম্ন',
      medium: 'মধ্যম',
      high: 'উচ্চ',
      urgent: 'জরুরি'
    };
    return texts[priority] || priority;
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'urgent':
        return <Flag className="h-4 w-4 text-red-600" />;
      case 'high':
        return <Flag className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Flag className="h-4 w-4 text-blue-600" />;
      default:
        return <Flag className="h-4 w-4 text-gray-500" />;
    }
  };

  const viewEvidence = (evidenceUrl) => {
    if (evidenceUrl) {
      window.open(evidenceUrl, '_blank');
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (filterStatus !== 'all' && complaint.status !== filterStatus) return false;
    if (filterPriority !== 'all' && complaint.priority !== filterPriority) return false;
    if (searchTerm && !complaint.complaint_id?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !complaint.office_location?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Get department display name
  const getDepartmentDisplay = () => {
    if (!user?.department) return 'নির্ধারিত নয়';
    const deptMap = {
      'passport': 'পাসপোর্ট অধিদপ্তর',
      'driving_license': 'বিআরটিএ - ড্রাইভিং লাইসেন্স',
      'birth_certificate': 'জন্ম নিবন্ধন অধিদপ্তর',
      'tax_id': 'কর অধিদপ্তর - ট্যাক্স আইডি'
    };
    return deptMap[user.department.name] || user.department.name_bn || user.department.name;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                স্বাগতম, {user?.full_name_bn || user?.username}!
              </h1>
              <p className="text-purple-100">
                {user?.office_name && `অফিস: ${user.office_name}`} | {user?.designation && `পদবি: ${user.designation}`}
              </p>
              <div className="flex items-center gap-2 mt-2 bg-purple-700 rounded-lg px-3 py-1 inline-flex">
                <Building className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm">
                  
                </span>
              </div>
              <p className="text-purple-100 mt-2 text-sm">
                আপনি শুধুমাত্র আপনার বিভাগের সাথে সম্পর্কিত অভিযোগ দেখতে পাবেন
              </p>
            </div>
            <button
              onClick={() => setShowStats(!showStats)}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <TrendingUp className="h-5 w-5" />
              {showStats ? 'স্ট্যাটস লুকান' : 'বিস্তারিত স্ট্যাটস দেখুন'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">মোট অভিযোগ</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total_complaints}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">বিবেচনাধীন</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_complaints}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">যাচাইকৃত</p>
                <p className="text-2xl font-bold text-green-600">{stats.verified_complaints}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">জরুরি অভিযোগ</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgent_complaints}</p>
              </div>
              <Flag className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Detailed Stats Section */}
        {showStats && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">বিস্তারিত পরিসংখ্যান</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-gray-700">অভিযোগের অবস্থা</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>বিবেচনাধীন</span>
                    <span className="font-semibold">{stats.pending_complaints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>তদন্তাধীন</span>
                    <span className="font-semibold">{stats.under_investigation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>নিষ্পত্তি হয়েছে</span>
                    <span className="font-semibold">{stats.resolved_complaints}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-gray-700">প্রায়োরিটি ভিত্তিক</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>জরুরি</span>
                    <span className="font-semibold text-red-600">{stats.urgent_complaints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>উচ্চ</span>
                    <span className="font-semibold text-orange-600">{stats.high_priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>মধ্যম</span>
                    <span className="font-semibold text-blue-600">{stats.medium_priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>নিম্ন</span>
                    <span className="font-semibold text-gray-600">{stats.low_priority}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-gray-700">দুর্নীতির হটস্পট</h3>
                <div className="space-y-2">
                  {stats.corruption_hotspots?.map((spot, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="truncate max-w-[150px]">{spot.location}</span>
                      <span className="font-semibold text-red-600">{spot.count} টি</span>
                    </div>
                  ))}
                  {stats.corruption_hotspots?.length === 0 && (
                    <p className="text-gray-500 text-sm">কোনো ডেটা নেই</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complaints Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                অভিযোগ সমূহ ({complaints.length})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition text-sm"
                >
                  <Filter className="h-4 w-4" />
                  ফিল্টার
                </button>
                <button 
                  onClick={fetchData}
                  className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition text-sm"
                >
                  <Download className="h-4 w-4" />
                  রিফ্রেশ
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex flex-wrap gap-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1 border rounded-lg text-sm"
                >
                  <option value="all">সব অবস্থা</option>
                  <option value="pending">বিবেচনাধীন</option>
                  <option value="under_investigation">তদন্তাধীন</option>
                  <option value="verified">যাচাইকৃত</option>
                  <option value="escalated">উর্ধ্বতন কর্তৃপক্ষে প্রেরিত</option>
                  <option value="resolved">নিষ্পত্তি হয়েছে</option>
                </select>
                
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-1 border rounded-lg text-sm"
                >
                  <option value="all">সব প্রায়োরিটি</option>
                  <option value="urgent">জরুরি</option>
                  <option value="high">উচ্চ</option>
                  <option value="medium">মধ্যম</option>
                  <option value="low">নিম্ন</option>
                </select>
                
                <div className="relative flex-1 max-w-xs">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="অভিযোগ আইডি বা অফিস অনুসন্ধান..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Complaints List */}
          <div className="divide-y">
            {filteredComplaints.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">কোনো অভিযোগ নেই</p>
                <p className="text-sm text-gray-400 mt-2">
                  আপনার বিভাগে এখনও কোনো অভিযোগ জমা পড়েনি
                </p>
              </div>
            ) : (
              filteredComplaints.map((complaint) => (
                <div key={complaint.complaint_id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-semibold text-gray-800">
                          {complaint.office_location}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getComplaintStatusBadge(complaint.status)}`}>
                          {getComplaintStatusText(complaint.status)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getPriorityBadge(complaint.priority)}`}>
                          {getPriorityIcon(complaint.priority)}
                          {getPriorityText(complaint.priority)}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{complaint.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                        <span>অভিযোগ আইডি: {complaint.complaint_id}</span>
                        <span>তারিখ: {new Date(complaint.incident_date).toLocaleDateString('bn-BD')}</span>
                        {complaint.amount_requested && (
                          <span className="text-red-600">দাবিকৃত অর্থ: {complaint.amount_requested} টাকা</span>
                        )}
                        {complaint.officer_name && (
                          <span>অভিযুক্ত কর্মকর্তা: {complaint.officer_name}</span>
                        )}
                      </div>
                      
                      {/* Evidence Section */}
                      {complaint.evidence_documents && complaint.evidence_documents.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-gray-700 mb-2">প্রমাণ দলিল ({complaint.evidence_documents.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {complaint.evidence_documents.map((evidence, idx) => (
                              <button
                                key={idx}
                                onClick={() => viewEvidence(evidence.url)}
                                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-sm transition"
                              >
                                {evidence.format === 'pdf' ? (
                                  <File className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Image className="h-4 w-4 text-blue-500" />
                                )}
                                <span className="text-gray-700">{evidence.name || `ফাইল ${idx + 1}`}</span>
                                <Eye className="h-3 w-3 text-gray-500" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {/* Schedule Hearing Button - Only for escalated complaints */}
                      {complaint.status === 'escalated' && (
                        <button
                          onClick={() => setShowHearingSchedule(complaint)}
                          className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition text-sm"
                        >
                          <Calendar className="h-4 w-4" />
                          শুনানি নির্ধারণ করুন
                        </button>
                      )}
                      <button
                        onClick={() => handleComplaintClick(complaint)}
                        className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        বিস্তারিত
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Complaint Management Modal */}
      {selectedComplaint && (
        <ComplaintManagement
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onUpdate={fetchData}
        />
      )}

      {/* Hearing Schedule Modal */}
      {showHearingSchedule && (
        <HearingSchedule
          complaint={showHearingSchedule}
          onClose={() => setShowHearingSchedule(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}

export default OfficerDashboard;