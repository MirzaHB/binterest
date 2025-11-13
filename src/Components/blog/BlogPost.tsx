import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getBlog, getBlogContent, deleteBlog, updateBlog, BlogPost as BlogPostType, formatBlogDate, parseTags } from '../../api/blog-api';
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
  const [editFormData, setEditFormData] = useState({ title: '', summary: '', author: '', tags: '' });
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
            ← Back to Blog
          </button>

          {isAdmin() && (
            <div className="admin-actions">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="edit-btn"
                disabled={isDeleting}
              >
                {isEditing ? 'Cancel Edit' : '✏️ Edit'}
              </button>
              <button
                onClick={handleDelete}
                className="delete-btn"
                disabled={isDeleting || isEditing}
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

          {blogPost.summary && (
            <p className="blog-post-summary">{blogPost.summary}</p>
          )}

          {blogPost.tags && (
            <div className="blog-post-tags">
              {parseTags(blogPost.tags).map(tag => (
                <span key={tag} className="blog-post-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
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