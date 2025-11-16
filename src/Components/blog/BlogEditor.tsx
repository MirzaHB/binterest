import React, { useState } from 'react';
import './BlogEditor.css';
import { uploadBlog } from '../../api/blog-api';
import { useAuth } from '../../auth/useAuth';

const BlogEditor: React.FC = () => {
  const { getAccessToken } = useAuth();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [photo1, setPhoto1] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [photo3, setPhoto3] = useState<File | null>(null);
  const [photo1Preview, setPhoto1Preview] = useState<string | null>(null);
  const [photo2Preview, setPhoto2Preview] = useState<string | null>(null);
  const [photo3Preview, setPhoto3Preview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handlePhotoSelect = (photoNumber: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
      if (!validTypes.includes(selectedFile.type)) {
        setMessage({ type: 'error', text: 'Invalid photo format. Please use JPG, PNG, GIF, WEBP, BMP, or SVG.' });
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (selectedFile.size > maxSize) {
        setMessage({ type: 'error', text: 'Photo size must be less than 10MB' });
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

      setMessage(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setMessage({ type: 'error', text: 'Title and content are required' });
      return;
    }

    try {
      setUploading(true);
      setMessage(null);

      // Get access token first
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Unable to get access token. Please try logging in again.');
      }

      // Create a markdown file from the content
      const markdownContent = `# ${title}\n\n${content}`;
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const file = new File([blob], `${title.toLowerCase().replace(/\s+/g, '-')}.md`, { type: 'text/markdown' });

      const result = await uploadBlog({
        file,
        title: title.trim(),
        summary: summary.trim(),
        author: author.trim(),
        tags: tags.trim(),
        photo1: photo1 || undefined,
        photo2: photo2 || undefined,
        photo3: photo3 || undefined,
      }, accessToken);

      setMessage({ type: 'success', text: `Blog "${result.title}" published successfully!` });

      // Reset form
      setTitle('');
      setSummary('');
      setAuthor('');
      setTags('');
      setContent('');

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

    } catch (error) {
      console.error('Failed to upload blog:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to publish blog'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all content?')) {
      setTitle('');
      setSummary('');
      setAuthor('');
      setTags('');
      setContent('');
      setMessage(null);

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
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const characterCount = content.length;

  return (
    <div className="blog-editor">
      <div className="editor-header">
        <h1 className="editor-title">Write New Blog Post</h1>
        <p className="editor-subtitle">Share your thoughts with the world</p>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="editor-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your blog title..."
              maxLength={100}
              required
            />
            <span className="char-count">{title.length}/100</span>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="summary">Summary</label>
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief description of your blog post..."
              maxLength={500}
              rows={3}
            />
            <span className="char-count">{summary.length}/500</span>
          </div>
        </div>

        <div className="form-row two-columns">
          <div className="form-group">
            <label htmlFor="author">Author</label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name..."
              maxLength={50}
            />
            <span className="char-count">{author.length}/50</span>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tech, personal, tutorial..."
              maxLength={200}
            />
            <span className="char-count">{tags.length}/200</span>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label>Blog Photos (Optional - Max 3)</label>
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
                      style={{ display: 'none' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="form-group content-group">
          <label htmlFor="content">Content *</label>
          <div className="editor-toolbar">
            <div className="word-stats">
              <span className="stat">Words: {wordCount}</span>
              <span className="stat">Characters: {characterCount}</span>
            </div>
            <div className="formatting-hint">
              💡 Supports Markdown formatting
            </div>
          </div>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Start writing your blog post here...

You can use Markdown formatting:
# Heading 1
## Heading 2
**Bold text**
*Italic text*
[Link](https://example.com)
- List item
- Another item

Write your thoughts and ideas freely!`}
            rows={20}
            required
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleClear}
            className="btn btn-secondary"
            disabled={uploading}
          >
            Clear All
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploading || !title.trim() || !content.trim()}
          >
            {uploading ? (
              <>
                <div className="spinner"></div>
                Publishing...
              </>
            ) : (
              'Publish Blog'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlogEditor;