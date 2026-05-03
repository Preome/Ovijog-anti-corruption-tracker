import { useState, useRef } from 'react';
import API from '../../services/api';
import { uploadToCloudinary, getFileTypeInfo } from '../../services/cloudinary';
import toast from 'react-hot-toast';
import { 
  Shield, Upload, X, FileText, Image, Video, Mic, 
  AlertCircle, Loader, Play, Volume2, Flag 
} from 'lucide-react';

function ComplaintPage() {
  const [formData, setFormData] = useState({
    service_type: 'passport',
    office_location: '',
    incident_date: '',
    amount_requested: '',
    officer_name: '',
    description: '',
    priority: 'medium',
    is_anonymous: true
  });
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [complaintId, setComplaintId] = useState('');
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      const isValidType = file.type.startsWith('image/') || 
                          file.type === 'application/pdf' ||
                          file.type.startsWith('video/') ||
                          file.type.startsWith('audio/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB for videos/audio
      
      if (!isValidType) {
        toast.error(`${file.name} - শুধুমাত্র ছবি, PDF, ভিডিও বা অডিও ফাইল সমর্থিত`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name} - ফাইলের সাইজ 50MB এর কম হতে হবে`);
        return false;
      }
      return true;
    });
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return [];
    
    setUploading(true);
    const uploadedFiles = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(prev => ({ ...prev, [i]: 0 }));
      
      const result = await uploadToCloudinary(file, (progress) => {
        setUploadProgress(prev => ({ ...prev, [i]: progress }));
      });
      
      if (result.success) {
        uploadedFiles.push({
          url: result.url,
          public_id: result.public_id,
          format: result.format,
          size: result.size,
          name: file.name,
          resource_type: result.resource_type,
          file_type: file.type,
          duration: result.duration
        });
      } else {
        toast.error(`${file.name} আপলোড ব্যর্থ হয়েছে`);
      }
    }
    
    setUploading(false);
    return uploadedFiles;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const uploadedFiles = await uploadFiles();
    
    const submitData = {
      ...formData,
      evidence_documents: uploadedFiles,
    };
    
    try {
      const response = await API.post('/complaints/', submitData);
      setComplaintId(response.data.complaint_id);
      toast.success('অভিযোগ জমা দেওয়া হয়েছে!');
    } catch (error) {
      toast.error('অভিযোগ জমা দিতে ব্যর্থ হয়েছে');
      console.error('Submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
    if (file.type === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
    if (file.type.startsWith('video/')) return <Video className="h-5 w-5 text-purple-500" />;
    if (file.type.startsWith('audio/')) return <Mic className="h-5 w-5 text-green-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const getFileTypeLabel = (file) => {
    if (file.type.startsWith('image/')) return 'ছবি';
    if (file.type === 'application/pdf') return 'PDF';
    if (file.type.startsWith('video/')) return 'ভিডিও';
    if (file.type.startsWith('audio/')) return 'অডিও';
    return 'ফাইল';
  };

  if (complaintId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-4">অভিযোগ গৃহীত হয়েছে</h2>
            <p className="text-gray-600 mb-4">আপনার অভিযোগ আইডি:</p>
            <p className="text-2xl font-bold text-blue-600 mb-6">{complaintId}</p>
            <p className="text-sm text-gray-500 mb-6">
              আপনার পরিচয় গোপন রাখা হবে। এই আইডি দিয়ে আপনার অভিযোগের অবস্থা জানতে পারবেন।
            </p>
            <div className="space-x-4">
              <button
                onClick={() => {
                  setComplaintId('');
                  setFiles([]);
                  setFormData({
                    service_type: 'passport',
                    office_location: '',
                    incident_date: '',
                    amount_requested: '',
                    officer_name: '',
                    description: '',
                    priority: 'medium',
                    is_anonymous: true
                  });
                }}
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                নতুন অভিযোগ
              </button>
              <a
                href="/my-complaints"
                className="inline-block bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                আমার অভিযোগ দেখুন
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">ঘুষের অভিযোগ করুন</h1>
            <p className="text-gray-600">নাম না জানিয়ে দুর্নীতির অভিযোগ জানান</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Warning Banner */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                <div>
                  <p className="text-sm text-yellow-700 font-semibold">গুরুত্বপূর্ণ তথ্য:</p>
                  <p className="text-sm text-yellow-700">
                    আপনার পরিচয় সম্পূর্ণ গোপন রাখা হবে। সঠিক তথ্য প্রদান করুন। মিথ্যা অভিযোগ দন্ডনীয় অপরাধ।
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Service Type */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">
                  সেবার ধরন *
                </label>
                <select
                  name="service_type"
                  value={formData.service_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-red-500"
                >
                  <option value="passport">পাসপোর্ট</option>
                  <option value="driving_license">ড্রাইভিং লাইসেন্স</option>
                  <option value="birth_certificate">জন্ম নিবন্ধন</option>
                  <option value="tax_id">ট্যাক্স আইডি</option>
                </select>
              </div>

              {/* Office Location */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">
                  অফিসের অবস্থান *
                </label>
                <input
                  type="text"
                  name="office_location"
                  required
                  value={formData.office_location}
                  onChange={handleChange}
                  placeholder="যেমন: পাসপোর্ট অফিস, ঢাকা"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Incident Date */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">
                  ঘটনার তারিখ *
                </label>
                <input
                  type="date"
                  name="incident_date"
                  required
                  value={formData.incident_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Priority Selection */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">
                  অভিযোগের জরুরিতা *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: 'low' })}
                    className={`p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                      formData.priority === 'low'
                        ? 'border-gray-500 bg-gray-100'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Flag className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">নিম্ন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: 'medium' })}
                    className={`p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                      formData.priority === 'medium'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <Flag className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">মধ্যম</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: 'high' })}
                    className={`p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                      formData.priority === 'high'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <Flag className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-orange-700">উচ্চ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: 'urgent' })}
                    className={`p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                      formData.priority === 'urgent'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <Flag className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">জরুরি</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  জরুরি ভিত্তিতে অভিযোগ দ্রুত নিষ্পত্তি করা হবে
                </p>
              </div>

              {/* Amount Requested */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">
                  দাবিকৃত অর্থের পরিমাণ (ঐচ্ছিক)
                </label>
                <input
                  type="number"
                  name="amount_requested"
                  value={formData.amount_requested}
                  onChange={handleChange}
                  placeholder="টাকায়"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Officer Name */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">
                  অভিযুক্ত কর্মকর্তার নাম (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  name="officer_name"
                  value={formData.officer_name}
                  onChange={handleChange}
                  placeholder="যদি জানা থাকে"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">
                  বিস্তারিত বিবরণ *
                </label>
                <textarea
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  rows="5"
                  placeholder="কি ঘটেছিল? কখন? কোথায়? কেমন করে? বিস্তারিত বলুন..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-red-500"
                ></textarea>
              </div>

              {/* Enhanced File Upload Section */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-semibold">
                  প্রমাণ দলিল (ছবি/PDF/ভিডিও/অডিও)
                </label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-red-500 transition"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">ক্লিক করুন বা এখানে ফাইল ড্রপ করুন</p>
                  <p className="text-sm text-gray-500">সর্বোচ্চ 50MB: ছবি, PDF, ভিডিও (MP4), অডিও (MP3)</p>
                  <div className="flex justify-center gap-4 mt-2 text-xs text-gray-400">
                    
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf,video/*,audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                
                {/* File List with Enhanced Display */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="font-semibold text-sm">আপলোডের জন্য নির্বাচিত ফাইল ({files.length}):</p>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2 flex-1">
                          {getFileIcon(file)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-700 font-medium">{file.name}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                                {getFileTypeLabel(file)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </div>
                            {file.type.startsWith('video/') && (
                              <div className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                                <Play className="h-3 w-3" />
                                ভিডিও ফাইল
                              </div>
                            )}
                            {file.type.startsWith('audio/') && (
                              <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                <Volume2 className="h-3 w-3" />
                                অডিও রেকর্ডিং
                              </div>
                            )}
                          </div>
                          {uploadProgress[index] > 0 && uploadProgress[index] < 100 && (
                            <div className="flex items-center gap-2">
                              <Loader className="h-4 w-4 animate-spin text-blue-500" />
                              <span className="text-xs text-blue-500">{uploadProgress[index]}%</span>
                            </div>
                          )}
                          {!uploading && (
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Anonymous Checkbox */}
              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_anonymous"
                    checked={formData.is_anonymous}
                    onChange={handleChange}
                    className="mr-2 w-4 h-4 text-red-600"
                  />
                  <span className="text-gray-700">আমার পরিচয় গোপন রাখুন (সুপারিশকৃত)</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || uploading}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    প্রক্রিয়াধীন...
                  </>
                ) : uploading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    ফাইল আপলোড হচ্ছে...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    অভিযোগ জমা দিন
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">জানিয়ে রাখুন:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✓ আপনার সকল তথ্য গোপন রাখা হবে</li>
              <li>✓ সঠিক তথ্য প্রদান করুন</li>
              <li>✓ মিথ্যা অভিযোগ দন্ডনীয় অপরাধ</li>
              <li>✓ জরুরি অভিযোগ অগ্রাধিকার পাবে</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplaintPage;