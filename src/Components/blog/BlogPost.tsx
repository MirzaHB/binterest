import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getBlog, getBlogContent, deleteBlog, updateBlog, updateBlogContent, uploadBlogPhoto, deleteBlogPhoto, BlogPost as BlogPostType, formatBlogDate, parseTags } from '../../api/blog-api';
import { useAuth } from '../../auth/useAuth';
import TableOfContents from './TableOfContents';
import './BlogPost.css';

const BlogPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [blogPost, setBlogPost] = useState<BlogPostType | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editFormData, setEditFormData] = useState({ title: '', summary: '', author: '', tags: '' });
  const [editContentData, setEditContentData] = useState('');
  const [isManagingPhotos, setIsManagingPhotos] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<number | null>(null);
  const { isAdmin, getAccessToken } = useAuth();

  useEffect(() => {
    if (!id) {
      setError('Blog post ID not provided');
      setLoading(false);
      return;
    }

    loadBlogPost();
  }, [id]);

  const loadBlogPost = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Add .md extension back for API calls
      const blogId = id.endsWith('.md') ? id : `${id}.md`;

      // Load blog metadata and content in parallel
      const [blogData, blogContent] = await Promise.all([
        getBlog(blogId),
        getBlogContent(blogId)
      ]);

      setBlogPost(blogData);
      setContent(blogContent);
      // Populate edit form with current data
      setEditFormData({
        title: blogData.title || '',
        summary: blogData.summary || '',
        author: blogData.author || '',
        tags: blogData.tags || '',
      });
      setEditContentData(blogContent);
    } catch (err) {
      console.error('Failed to load blog post:', err);
      setError('Failed to load blog post. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/blog');
  };

  const handleDelete = async () => {
    if (!id || !isAdmin()) return;

    const confirmed = window.confirm('Are you sure you want to delete this blog post? This action cannot be undone.');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Failed to get access token. Please try logging in again.');
        return;
      }

      const blogId = id.endsWith('.md') ? id : `${id}.md`;
      await deleteBlog(blogId, token);
      alert('Blog post deleted successfully!');
      navigate('/blog');
    } catch (error) {
      console.error('Failed to delete blog post:', error);
      alert('Failed to delete blog post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !isAdmin()) return;

    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Failed to get access token. Please try logging in again.');
        return;
      }

      const blogId = id.endsWith('.md') ? id : `${id}.md`;
      await updateBlog(blogId, editFormData, token);
      alert('Blog post updated successfully!');
      setIsEditing(false);
      // Reload the blog post to show updated data
      loadBlogPost();
    } catch (error) {
      console.error('Failed to update blog post:', error);
      alert('Failed to update blog post. Please try again.');
    }
  };

  const handleContentEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !isAdmin()) return;

    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Failed to get access token. Please try logging in again.');
        return;
      }

      const blogId = id.endsWith('.md') ? id : `${id}.md`;
      await updateBlogContent(blogId, editContentData, token);
      alert('Blog content updated successfully!');
      setIsEditingContent(false);
      // Reload the blog post to show updated data
      loadBlogPost();
    } catch (error) {
      console.error('Failed to update blog content:', error);
      alert('Failed to update blog content. Please try again.');
    }
  };

  const handlePhotoUpload = async (photoNumber: number, file: File) => {
    if (!id || !isAdmin()) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid photo format. Please use JPG, PNG, GIF, WEBP, BMP, or SVG.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Photo size must be less than 10MB');
      return;
    }

    setUploadingPhoto(photoNumber);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Failed to get access token. Please try logging in again.');
        return;
      }

      const blogId = id.endsWith('.md') ? id : `${id}.md`;
      await uploadBlogPhoto(blogId, photoNumber, file, token);
      alert(`Photo ${photoNumber} uploaded successfully!`);
      // Reload the blog post to show updated photos
      loadBlogPost();
    } catch (error) {
      console.error('Failed to upload photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handlePhotoDelete = async (photoNumber: number) => {
    if (!id || !isAdmin()) return;

    const confirmed = window.confirm(`Are you sure you want to delete photo ${photoNumber}?`);
    if (!confirmed) return;

    setDeletingPhoto(photoNumber);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Failed to get access token. Please try logging in again.');
        return;
      }

      const blogId = id.endsWith('.md') ? id : `${id}.md`;
      await deleteBlogPhoto(blogId, photoNumber, token);
      alert(`Photo ${photoNumber} deleted successfully!`);
      // Reload the blog post to show updated photos
      loadBlogPost();
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('Failed to delete photo. Please try again.');
    } finally {
      setDeletingPhoto(null);
    }
  };

  if (loading) {
    return (
      <div className="blog-post-container">
        <div className="blog-post-loading">
          <h2>Loading blog post...</h2>
        </div>
      </div>
    );
  }

  if (error || !blogPost) {
    return (
      <div className="blog-post-container">
        <div className="blog-post-error">
          <h2>Error Loading Blog Post</h2>
          <p>{error || 'Blog post not found'}</p>
          <button onClick={handleBackClick} className="back-btn">
            ← Back to Blog
          </button>
        </div>
      </div>
    );
  }

  // Helper function to generate heading IDs - must match TableOfContents.tsx logic
  const generateHeadingId = (children: any): string => {
    const text = typeof children === 'string' ? children : children?.toString() || '';
    // Simple clean ID: "Introduction" -> "introduction"
    const id = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return id;
  };

  return (
    <div className="blog-post-container">
      <TableOfContents content={content} />

      <div className="blog-post-header">
        <div className="blog-post-actions">
          <button onClick={handleBackClick} className="back-btn">
            ←
          </button>

          {isAdmin() && (
            <div className="admin-actions">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="edit-btn"
                disabled={isDeleting || isEditingContent || isManagingPhotos}
              >
                {isEditing ? 'Cancel Metadata Edit' : '✏️ Edit Metadata'}
              </button>
              <button
                onClick={() => setIsEditingContent(!isEditingContent)}
                className="edit-btn"
                disabled={isDeleting || isEditing || isManagingPhotos}
              >
                {isEditingContent ? 'Cancel Content Edit' : '📝 Edit Content'}
              </button>
              <button
                onClick={() => setIsManagingPhotos(!isManagingPhotos)}
                className="edit-btn"
                disabled={isDeleting || isEditing || isEditingContent}
              >
                {isManagingPhotos ? 'Close Photos' : '📸 Manage Photos'}
              </button>
              <button
                onClick={handleDelete}
                className="delete-btn"
                disabled={isDeleting || isEditing || isEditingContent || isManagingPhotos}
              >
                {isDeleting ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          )}
        </div>

        {isEditing && isAdmin() && (
          <div className="edit-form-container">
            <form onSubmit={handleEditSubmit} className="edit-form">
              <h3>Edit Blog Metadata</h3>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="Blog title"
                />
              </div>
              <div className="form-group">
                <label htmlFor="summary">Summary</label>
                <textarea
                  id="summary"
                  value={editFormData.summary}
                  onChange={(e) => setEditFormData({ ...editFormData, summary: e.target.value })}
                  placeholder="Blog summary"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label htmlFor="author">Author</label>
                <input
                  type="text"
                  id="author"
                  value={editFormData.author}
                  onChange={(e) => setEditFormData({ ...editFormData, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <input
                  type="text"
                  id="tags"
                  value={editFormData.tags}
                  onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">Save Changes</button>
                <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {isEditingContent && isAdmin() && (
          <div className="edit-form-container">
            <form onSubmit={handleContentEditSubmit} className="edit-form">
              <h3>Edit Blog Content</h3>
              <div className="form-group">
                <label htmlFor="content">Content (Markdown)</label>
                <textarea
                  id="content"
                  value={editContentData}
                  onChange={(e) => setEditContentData(e.target.value)}
                  placeholder="Write your blog content in Markdown..."
                  rows={25}
                  style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">Save Content</button>
                <button type="button" onClick={() => setIsEditingContent(false)} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="blog-post-meta">
          <h1 className="blog-post-title">{blogPost.title || 'Untitled Post'}</h1>

          <div className="blog-post-info">
            <span className="blog-post-date">
              {formatBlogDate(blogPost.lastModified || blogPost.createdDate)}
            </span>
            {blogPost.author && (
              <>
                <span className="info-divider">•</span>
                <span className="blog-post-author">By {blogPost.author}</span>
              </>
            )}
          </div>

          {blogPost.tags && (
            <div className="blog-post-tags">
              {parseTags(blogPost.tags).map(tag => (
                <span key={tag} className="blog-post-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Admin Photo Management */}
        {isAdmin() && isManagingPhotos && (
          <div className="admin-photo-management">
            <h3 className="photo-management-title">Manage Blog Photos</h3>
            <p className="photo-management-info">
              Upload photos here, then copy their URLs to embed them anywhere in your blog content using markdown: <code>![Description](URL)</code>
            </p>
            <div className="photo-management-grid">
              {[1, 2, 3].map((num) => {
                const existingPhotoUrl = blogPost.photoUrls && blogPost.photoUrls[num - 1];
                const isUploading = uploadingPhoto === num;
                const isDeleting = deletingPhoto === num;

                return (
                  <div key={num} className="photo-management-item">
                    <div className="photo-management-header">
                      <span className="photo-number">Photo {num}</span>
                    </div>

                    {existingPhotoUrl ? (
                      <div className="existing-photo-container">
                        <img src={existingPhotoUrl} alt={`Photo ${num}`} className="existing-photo" />
                        <div className="photo-url-container">
                          <label className="photo-url-label">Click to copy URL:</label>
                          <input
                            type="text"
                            value={existingPhotoUrl}
                            readOnly
                            className="photo-url-input"
                            onClick={(e) => {
                              e.currentTarget.select();
                              navigator.clipboard.writeText(existingPhotoUrl);
                              alert('URL copied to clipboard!');
                            }}
                            title="Click to copy URL"
                          />
                        </div>
                        <div className="photo-actions">
                          <label className="replace-photo-btn">
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(num, file);
                              }}
                              disabled={isUploading || isDeleting}
                              style={{ display: 'none' }}
                            />
                            {isUploading ? 'Uploading...' : '🔄 Replace'}
                          </label>
                          <button
                            onClick={() => handlePhotoDelete(num)}
                            className="delete-photo-btn-small"
                            disabled={isUploading || isDeleting}
                          >
                            {isDeleting ? 'Deleting...' : '🗑️ Delete'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-photo-container">
                        <label className="upload-photo-btn">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePhotoUpload(num, file);
                            }}
                            disabled={isUploading}
                            style={{ display: 'none' }}
                          />
                          <div className="upload-placeholder">
                            <span className="upload-icon">📸</span>
                            <span className="upload-text">
                              {isUploading ? 'Uploading...' : 'Upload Photo'}
                            </span>
                            <span className="upload-hint">Max 10MB</span>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="blog-post-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom components for better styling with IDs for navigation
            h1: ({children}) => {
              const id = generateHeadingId(children);
              return <h1 id={id} className="markdown-h1">{children}</h1>;
            },
            h2: ({children}) => {
              const id = generateHeadingId(children);
              return <h2 id={id} className="markdown-h2">{children}</h2>;
            },
            h3: ({children}) => {
              const id = generateHeadingId(children);
              return <h3 id={id} className="markdown-h3">{children}</h3>;
            },
            h4: ({children}) => {
              const id = generateHeadingId(children);
              return <h4 id={id} className="markdown-h4">{children}</h4>;
            },
            h5: ({children}) => {
              const id = generateHeadingId(children);
              return <h5 id={id} className="markdown-h5">{children}</h5>;
            },
            h6: ({children}) => {
              const id = generateHeadingId(children);
              return <h6 id={id} className="markdown-h6">{children}</h6>;
            },
            p: ({children}) => <p className="markdown-p">{children}</p>,
            code: ({children, className}) => {
              const isInline = !className;
              return isInline ?
                <code className="markdown-code-inline">{children}</code> :
                <code className={`markdown-code-block ${className}`}>{children}</code>;
            },
            pre: ({children}) => <pre className="markdown-pre">{children}</pre>,
            blockquote: ({children}) => <blockquote className="markdown-blockquote">{children}</blockquote>,
            ul: ({children}) => <ul className="markdown-ul">{children}</ul>,
            ol: ({children}) => <ol className="markdown-ol">{children}</ol>,
            li: ({children}) => <li className="markdown-li">{children}</li>,
            a: ({children, href}) => <a className="markdown-link" href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
            img: ({src, alt}) => <img className="markdown-img" src={src} alt={alt} />,
            table: ({children}) => <table className="markdown-table">{children}</table>,
            th: ({children}) => <th className="markdown-th">{children}</th>,
            td: ({children}) => <td className="markdown-td">{children}</td>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default BlogPost;