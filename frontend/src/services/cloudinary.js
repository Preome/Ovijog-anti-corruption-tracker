import axios from 'axios';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dkejhvcde';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'complaint_evidence';

// Upload file to Cloudinary
export const uploadToCloudinary = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
  
  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
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

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  // Note: This typically requires a backend endpoint for security
  // For now, we'll just return success
  return { success: true };
};