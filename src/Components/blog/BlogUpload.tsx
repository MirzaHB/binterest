import React, { useState } from 'react';
import { createBlog, CreateBlogRequest } from '../../api/blog-api';
import './BlogUpload.css';

const BlogUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState('');
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const blogData: CreateBlogRequest = {
        file,
        title: title.trim() || undefined,
        summary: summary.trim() || undefined,
        author: author.trim() || undefined,
        tags: tags.trim() || undefined,
      };

      const result = await createBlog(blogData);
      setUploadResult(`Blog uploaded successfully: ${result.message}`);

      // Reset form
      setFile(null);
      setTitle('');
      setSummary('');
      setAuthor('');
      setTags('');

      // Reset file input
      const fileInput = document.getElementById('blog-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

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