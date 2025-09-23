import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getBlog, getBlogContent, BlogPost as BlogPostType, formatBlogDate, parseTags } from '../../api/blog-api';
import './BlogPost.css';

const BlogPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [blogPost, setBlogPost] = useState<BlogPostType | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Load blog metadata and content in parallel
      const [blogData, blogContent] = await Promise.all([
        getBlog(id),
        getBlogContent(id)
      ]);

      setBlogPost(blogData);
      setContent(blogContent);
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

  return (
    <div className="blog-post-container">
      <div className="blog-post-header">
        <button onClick={handleBackClick} className="back-btn">
          ← Back to Blog
        </button>

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
            // Custom components for better styling
            h1: ({children}) => <h1 className="markdown-h1">{children}</h1>,
            h2: ({children}) => <h2 className="markdown-h2">{children}</h2>,
            h3: ({children}) => <h3 className="markdown-h3">{children}</h3>,
            h4: ({children}) => <h4 className="markdown-h4">{children}</h4>,
            h5: ({children}) => <h5 className="markdown-h5">{children}</h5>,
            h6: ({children}) => <h6 className="markdown-h6">{children}</h6>,
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