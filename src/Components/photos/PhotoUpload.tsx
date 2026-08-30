import React, { useState, useRef } from 'react';
import { uploadPhoto, savePhotoStory } from '../../api/photo-api';
import { useAuth } from '../../auth/useAuth';
import './PhotoUpload.css';

const PhotoUpload: React.FC = () => {
  const { getAccessToken } = useAuth();
  const [statusMessage, setStatusMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [story, setStory] = useState('');
  // The photo landed but its story did not — a different situation from a failed
  // upload, and the only one where the text on screen is the sole copy.
  const [storyWarning, setStoryWarning] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const maxSize = 8 * 1024 * 1024; // 8MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, WebP, GIF, or AVIF)';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 8MB';
    }

    return null;
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError('');
    setStatusMessage('');
    setStoryWarning('');

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

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setStatusMessage('Uploading your photo...');
    setError('');

    try {
      // Get access token first
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Unable to get access token. Please try logging in again.');
      }

      // Try to get image dimensions, but don't fail if it doesn't work
      let width: number | undefined;
      let height: number | undefined;

      try {
        const dimensions = await getImageDimensions(selectedFile);
        width = dimensions.width;
        height = dimensions.height;
      } catch (dimensionError) {
        console.warn('Could not get image dimensions, uploading without them:', dimensionError);
        // Continue without dimensions
      }

      const response = await uploadPhoto(selectedFile, accessToken, width, height);

      // Second request rather than part of the upload: the story is stored
      // separately from the photo, so the photo is safely up either way.
      if (story.trim()) {
        try {
          setStatusMessage('Saving your story...');
          await savePhotoStory(response.blobName, story, accessToken);
        } catch (storyError) {
          console.error('Photo uploaded but story failed to save:', storyError);
          // Deliberately keeps the text on screen: the photo is already up, so
          // re-uploading would duplicate it, and this box holds the only copy.
          setStatusMessage(`✅ ${response.message}`);
          setStoryWarning(
            'Your photo uploaded, but the story did not save. Copy the text below and add it from the gallery.'
          );
          setSelectedFile(null);
          setPreviewUrl('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
      }

      setStatusMessage(`✅ ${response.message}`);
      setSelectedFile(null);
      setPreviewUrl('');
      setStory('');
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
    setStory('');
    setStoryWarning('');
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
            <span className="upload-hint">JPEG, PNG, WebP, GIF (max 8MB)</span>
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

        {(selectedFile || storyWarning) && (
          <div className="upload-story">
            <label htmlFor="photo-story" className="upload-story-label">
              Story <span className="upload-story-optional">(optional)</span>
            </label>
            <textarea
              id="photo-story"
              className="upload-story-input"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Write the story behind this photo. Markdown works. You can also add or change it later from the gallery."
              disabled={uploading}
            />
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
            <p>{statusMessage || 'Uploading your photo...'}</p>
          </div>
        )}

        {statusMessage && (
          <div className="status-message success">
            {statusMessage}
          </div>
        )}

        {storyWarning && (
          <div className="status-message warning">
            ⚠️ {storyWarning}
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