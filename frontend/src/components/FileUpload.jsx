import { useState, useCallback } from 'react';
import { Upload, X, FileImage, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

function FileUpload({ onUploadComplete, onRemove, existingFiles = [] }) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState(existingFiles);
  const [uploadProgress, setUploadProgress] = useState({});

  // Cloudinary configuration
  const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME'; // Replace with your cloud name
  const CLOUDINARY_UPLOAD_PRESET = 'complaint_evidence';

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'complaint_evidence');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(prev => ({ ...prev, [file.name]: percent }));
        }
      });
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.response);
          resolve({
            url: data.secure_url,
            public_id: data.public_id,
            filename: file.name,
            size: file.size,
            type: file.type
          });
        } else {
          reject(new Error('Upload failed'));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error'));
      
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`);
      xhr.send(formData);
    });
  };

  const handleFileUpload = useCallback(async (event) => {
    const files = Array.from(event.target.files);
    
    // Validate file size (max 5MB)
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} - ফাইলের সাইজ 5MB এর বেশি`);
        return false;
      }
      return true;
    });

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'application/pdf'];
    const validTypeFiles = validFiles.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} - শুধুমাত্র ছবি (JPG, PNG) বা PDF ফাইল সমর্থিত`);
        return false;
      }
      return true;
    });

    if (validTypeFiles.length === 0) return;

    setUploading(true);
    
    for (const file of validTypeFiles) {
      try {
        const uploadedFile = await uploadToCloudinary(file);
        setUploadedFiles(prev => [...prev, uploadedFile]);
        onUploadComplete(uploadedFile);
        toast.success(`${file.name} আপলোড সফল হয়েছে`);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`${file.name} আপলোড ব্যর্থ হয়েছে`);
      } finally {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
    }
    
    setUploading(false);
    event.target.value = '';
  }, [onUploadComplete]);

  const handleRemoveFile = (fileToRemove) => {
    setUploadedFiles(prev => prev.filter(f => f.public_id !== fileToRemove.public_id));
    onRemove(fileToRemove);
    toast.success('ফাইল সরানো হয়েছে');
  };

  const getFileIcon = (file) => {
    if (file.type?.startsWith('image/')) {
      return <FileImage className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-orange-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFilePreview = (file) => {
    if (file.type?.startsWith('image/')) {
      return (
        <img 
          src={file.url} 
          alt={file.filename}
          className="h-12 w-12 object-cover rounded"
        />
      );
    }
    return getFileIcon(file);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer">
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          {uploading ? (
            <>
              <Loader className="h-12 w-12 text-blue-500 animate-spin mb-2" />
              <p className="text-gray-600 font-medium">আপলোড হচ্ছে...</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-600 font-medium">
                প্রমাণ হিসেবে ছবি বা PDF আপলোড করুন
              </p>
              <p className="text-sm text-gray-400 mt-1">
                সমর্থিত ফরম্যাট: JPG, PNG, PDF (সর্বোচ্চ 5MB)
              </p>
            </>
          )}
        </label>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="bg-gray-100 rounded-lg p-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="truncate max-w-[200px]">{filename}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">আপলোডকৃত ফাইল ({uploadedFiles.length})</h4>
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFilePreview(file)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{file.filename}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.url && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      প্রিভিউ
                    </a>
                  )}
                  <button
                    onClick={() => handleRemoveFile(file)}
                    className="text-red-500 hover:text-red-600 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;