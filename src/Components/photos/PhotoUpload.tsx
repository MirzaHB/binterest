import React, { useState, useRef } from 'react';
import { uploadPhoto } from '../../api/photo-api';
import './PhotoUpload.css';

const PhotoUpload: React.FC = () => {
  const [statusMessage, setStatusMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, WebP, or GIF)';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }

    return null;
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError('');
    setStatusMessage('');

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl('');
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      setPreviewUrl('');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setStatusMessage('Uploading your photo...');
    setError('');

    try {
      const response = await uploadPhoto(selectedFile);
      setStatusMessage(`✅ ${response.message}`);
      setSelectedFile(null);
      setPreviewUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      let errorMessage = 'Upload failed. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setStatusMessage('');
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setStatusMessage('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="photo-upload">
      <h3 className="upload-title">Upload Photo</h3>

      <div className="upload-container">
        <div className="file-input-wrapper">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelected}
            disabled={uploading}
            className="file-input"
            id="photo-upload"
          />
          <label htmlFor="photo-upload" className={`file-input-label ${uploading ? 'disabled' : ''}`}>
            <span className="upload-icon">📷</span>
            <span className="upload-text">
              {selectedFile ? 'Change Photo' : 'Choose Photo'}
            </span>
            <span className="upload-hint">JPEG, PNG, WebP, GIF (max 5MB)</span>
          </label>
        </div>

        {previewUrl && (
          <div className="preview-container">
            <img src={previewUrl} alt="Preview" className="preview-image" />
            <div className="preview-info">
              <p className="file-name">{selectedFile?.name}</p>
              <p className="file-size">
                {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB' : ''}
              </p>
            </div>
          </div>
        )}

        {selectedFile && !uploading && (
          <div className="upload-actions">
            <button
              onClick={handleUpload}
              className="upload-btn"
              disabled={uploading}
            >
              Upload Photo
            </button>
            <button
              onClick={clearSelection}
              className="clear-btn"
              disabled={uploading}
            >
              Clear
            </button>
          </div>
        )}

        {uploading && (
          <div className="uploading-state">
            <div className="upload-spinner"></div>
            <p>Uploading your photo...</p>
          </div>
        )}

        {statusMessage && (
          <div className="status-message success">
            {statusMessage}
          </div>
        )}

        {error && (
          <div className="status-message error">
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoUpload;