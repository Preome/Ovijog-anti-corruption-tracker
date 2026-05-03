import axios from 'axios';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dkejhvcde';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'complaint_evidence';

// Upload file to Cloudinary with support for images, PDFs, videos, and audio
export const uploadToCloudinary = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
  
  // Add resource type based on file type
  let resourceType = 'auto';
  if (file.type.startsWith('image/')) {
    resourceType = 'image';
  } else if (file.type === 'application/pdf') {
    resourceType = 'raw';
  } else if (file.type.startsWith('video/')) {
    resourceType = 'video';
  } else if (file.type.startsWith('audio/')) {
    resourceType = 'video'; // Audio is treated as video type with 'audio' flag
  }
  
  formData.append('resource_type', resourceType);
  
  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      }
    );
    
    return {
      success: true,
      url: response.data.secure_url,
      public_id: response.data.public_id,
      format: response.data.format,
      size: response.data.bytes,
      resource_type: resourceType,
      duration: response.data.duration || null,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.response?.data?.error?.message || 'Upload failed',
    };
  }
};

// Upload multiple files
export const uploadMultipleToCloudinary = async (files, onProgress) => {
  const uploadPromises = files.map(async (file, index) => {
    const result = await uploadToCloudinary(file, (progress) => {
      if (onProgress) {
        onProgress(index, progress);
      }
    });
    return result;
  });
  
  return await Promise.all(uploadPromises);
};

// Get file type icon/display info
export const getFileTypeInfo = (file) => {
  const type = file.type;
  if (type.startsWith('image/')) {
    return { icon: '🖼️', label: 'ছবি', color: 'text-blue-500' };
  } else if (type === 'application/pdf') {
    return { icon: '📄', label: 'PDF', color: 'text-red-500' };
  } else if (type.startsWith('video/')) {
    return { icon: '🎥', label: 'ভিডিও', color: 'text-purple-500' };
  } else if (type.startsWith('audio/')) {
    return { icon: '🎵', label: 'অডিও', color: 'text-green-500' };
  }
  return { icon: '📎', label: 'ফাইল', color: 'text-gray-500' };
};

// Get file icon based on extension/type
export const getFileIcon = (format, resource_type) => {
  if (resource_type === 'image' || format === 'jpg' || format === 'png' || format === 'jpeg') {
    return '🖼️';
  } else if (format === 'pdf') {
    return '📄';
  } else if (resource_type === 'video' || format === 'mp4' || format === 'mov' || format === 'avi') {
    return '🎥';
  } else if (format === 'mp3' || format === 'wav' || format === 'm4a') {
    return '🎵';
  }
  return '📎';
};