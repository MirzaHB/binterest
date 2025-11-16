import React, { useState } from 'react';
import { createBlog, CreateBlogRequest } from '../../api/blog-api';
import { useAuth } from '../../auth/useAuth';
import './BlogUpload.css';

const BlogUpload: React.FC = () => {
  const { getAccessToken } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState('');
  const [photo1, setPhoto1] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [photo3, setPhoto3] = useState<File | null>(null);
  const [photo1Preview, setPhoto1Preview] = useState<string | null>(null);
  const [photo2Preview, setPhoto2Preview] = useState<string | null>(null);
  const [photo3Preview, setPhoto3Preview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setUploadResult(null);
    }
  };

  const handlePhotoSelect = (photoNumber: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Invalid photo format. Please use JPG, PNG, GIF, WEBP, BMP, or SVG.');
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (selectedFile.size > maxSize) {
        setError('Photo size must be less than 10MB');
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(selectedFile);

      // Set photo and preview based on photo number
      if (photoNumber === 1) {
        setPhoto1(selectedFile);
        setPhoto1Preview(previewUrl);
      } else if (photoNumber === 2) {
        setPhoto2(selectedFile);
        setPhoto2Preview(previewUrl);
      } else if (photoNumber === 3) {
        setPhoto3(selectedFile);
        setPhoto3Preview(previewUrl);
      }

      setError(null);
    }
  };

  const removePhoto = (photoNumber: number) => {
    if (photoNumber === 1) {
      setPhoto1(null);
      if (photo1Preview) URL.revokeObjectURL(photo1Preview);
      setPhoto1Preview(null);
    } else if (photoNumber === 2) {
      setPhoto2(null);
      if (photo2Preview) URL.revokeObjectURL(photo2Preview);
      setPhoto2Preview(null);
    } else if (photoNumber === 3) {
      setPhoto3(null);
      if (photo3Preview) URL.revokeObjectURL(photo3Preview);
      setPhoto3Preview(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Get access token first
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Unable to get access token. Please try logging in again.');
      }

      const blogData: CreateBlogRequest = {
        file,
        title: title.trim() || undefined,
        summary: summary.trim() || undefined,
        author: author.trim() || undefined,
        tags: tags.trim() || undefined,
        photo1: photo1 || undefined,
        photo2: photo2 || undefined,
        photo3: photo3 || undefined,
      };

      const result = await createBlog(blogData, accessToken);
      setUploadResult(`Blog uploaded successfully: ${result.message}`);

      // Reset form
      setFile(null);
      setTitle('');
      setSummary('');
      setAuthor('');
      setTags('');

      // Clean up photo previews
      if (photo1Preview) URL.revokeObjectURL(photo1Preview);
      if (photo2Preview) URL.revokeObjectURL(photo2Preview);
      if (photo3Preview) URL.revokeObjectURL(photo3Preview);
      setPhoto1(null);
      setPhoto2(null);
      setPhoto3(null);
      setPhoto1Preview(null);
      setPhoto2Preview(null);
      setPhoto3Preview(null);

      // Reset file inputs
      const fileInput = document.getElementById('blog-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      const photo1Input = document.getElementById('photo-1') as HTMLInputElement;
      if (photo1Input) photo1Input.value = '';
      const photo2Input = document.getElementById('photo-2') as HTMLInputElement;
      if (photo2Input) photo2Input.value = '';
      const photo3Input = document.getElementById('photo-3') as HTMLInputElement;
      if (photo3Input) photo3Input.value = '';

    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="blog-upload-container">
      <div className="upload-header">
        <h1 className="upload-title">
          Upload <span className="title-highlight">Blog Post</span>
        </h1>
        <p className="upload-subtitle">
          Share your thoughts and ideas with the world
        </p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="file-upload-section">
          <label htmlFor="blog-file" className="file-upload-label">
            <div className="file-upload-area">
              {file ? (
                <div className="file-selected">
                  <span className="file-icon">📄</span>
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  </div>
                </div>
              ) : (
                <div className="file-placeholder">
                  <span className="upload-icon">📤</span>
                  <span className="upload-text">Click to select blog file</span>
                  <span className="upload-hint">Markdown, PDF, DOC, or TXT files (Max 50MB)</span>
                </div>
              )}
            </div>
          </label>
          <input
            type="file"
            id="blog-file"
            onChange={handleFileSelect}
            accept=".md,.markdown,.pdf,.doc,.docx,.txt"
            className="file-input"
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="title" className="form-label">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="Enter blog post title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="author" className="form-label">Author</label>
            <input
              type="text"
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="form-input"
              placeholder="Enter author name"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="summary" className="form-label">Summary</label>
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="form-textarea"
              placeholder="Brief description of your blog post"
              rows={4}
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="tags" className="form-label">Tags</label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="form-input"
              placeholder="Enter tags separated by commas (e.g., React, TypeScript, Web Development)"
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">Blog Photos (Optional - Max 3)</label>
            <div className="photos-upload-section">
              {[1, 2, 3].map((num) => {
                const photo = num === 1 ? photo1 : num === 2 ? photo2 : photo3;
                const preview = num === 1 ? photo1Preview : num === 2 ? photo2Preview : photo3Preview;

                return (
                  <div key={num} className="photo-upload-item">
                    <label htmlFor={`photo-${num}`} className="photo-upload-label">
                      {preview ? (
                        <div className="photo-preview">
                          <img src={preview} alt={`Photo ${num} preview`} />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              removePhoto(num);
                            }}
                            className="remove-photo-btn"
                            title="Remove photo"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="photo-placeholder">
                          <span className="photo-icon">🖼️</span>
                          <span className="photo-text">Photo {num}</span>
                          <span className="photo-hint">Max 10MB</span>
                        </div>
                      )}
                    </label>
                    <input
                      type="file"
                      id={`photo-${num}`}
                      onChange={handlePhotoSelect(num)}
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml"
                      className="file-input"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {error && (
          <div className="upload-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {uploadResult && (
          <div className="upload-success">
            <span className="success-icon">✅</span>
            {uploadResult}
          </div>
        )}

        <button
          type="submit"
          disabled={!file || uploading}
          className={`upload-button ${uploading ? 'uploading' : ''}`}
        >
          {uploading ? (
            <>
              <span className="loading-spinner"></span>
              Uploading...
            </>
          ) : (
            <>
              <span className="upload-btn-icon">📤</span>
              Upload Blog Post
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default BlogUpload;