import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBlogs, BlogPost, parseTags, formatBlogDate, calculateReadTime } from '../api/blog-api';
import './Blog.css';

const Blog: React.FC = () => {
  const navigate = useNavigate();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const blogs = await getBlogs();
      setBlogPosts(blogs);
    } catch (err: any) {
      console.error('Failed to load blogs:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error occurred';
      setError(`Failed to load blog posts: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getBlogExcerpt = (blog: BlogPost): string => {
    return blog.summary || 'No summary available for this blog post.';
  };

  const getBlogTags = (blog: BlogPost): string[] => {
    return parseTags(blog.tags);
  };

  const getBlogReadTime = (blog: BlogPost): string => {
    // For now, we'll estimate based on summary length or use a default
    // Later you could fetch the actual content and calculate properly
    const content = blog.summary || '';
    return content.length > 0 ? calculateReadTime(content) : '5 min read';
  };

  // Use the first blog post as featured
  const featuredPost = blogPosts.length > 0 ? blogPosts[0] : null;
  const regularPosts = blogPosts.slice(1);

  if (loading) {
    return (
      <div className="blog-container">
        <div className="blog-loading">
          <h2>Loading blog posts...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-container">
        <div className="blog-error">
          <h2>Error Loading Blogs</h2>
          <p>{error}</p>
          <button onClick={loadBlogs} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-container">
      <div className="blog-header">
        <h1 className="blog-title">
          My <span className="title-highlight">Blog</span>
        </h1>
        <p className="blog-subtitle">
          Thoughts on development, photography, and the creative process
        </p>
      </div>

      {featuredPost && (
        <div className="featured-section">
          <h2 className="section-title">Featured Post</h2>
          <article className="featured-post">
            <div className="post-content">
              <div className="post-meta">
                <span className="post-date">{formatBlogDate(featuredPost.lastModified || featuredPost.createdDate)}</span>
                <span className="post-divider">•</span>
                <span className="post-read-time">{getBlogReadTime(featuredPost)}</span>
              </div>
              <h3 className="post-title">{featuredPost.title || 'Untitled Post'}</h3>
              <p className="post-excerpt">{getBlogExcerpt(featuredPost)}</p>
              <div className="post-tags">
                {getBlogTags(featuredPost).map(tag => (
                  <span key={tag} className="post-tag">{tag}</span>
                ))}
              </div>
              <button className="read-more-btn" onClick={() => navigate(`/blog/${featuredPost.id}`)}>
                <span>Read Full Post</span>
                <span className="btn-icon">→</span>
              </button>
            </div>
            <div className="post-image">
              <div className="image-placeholder">
                <span className="placeholder-icon">📝</span>
                <p>Featured post image</p>
              </div>
            </div>
          </article>
        </div>
      )}

      <div className="posts-section">
        <h2 className="section-title">Recent Posts</h2>
        <div className="posts-grid">
          {regularPosts.map(post => (
            <article key={post.id} className="blog-post" onClick={() => navigate(`/blog/${post.id}`)}>
              <div className="post-image-small">
                <div className="image-placeholder-small">
                  <span className="placeholder-icon-small">📄</span>
                </div>
              </div>
              <div className="post-content-small">
                <div className="post-meta">
                  <span className="post-date">{formatBlogDate(post.lastModified || post.createdDate)}</span>
                  <span className="post-divider">•</span>
                  <span className="post-read-time">{getBlogReadTime(post)}</span>
                </div>
                <h3 className="post-title-small">{post.title || 'Untitled Post'}</h3>
                <p className="post-excerpt-small">{getBlogExcerpt(post)}</p>
                <div className="post-tags">
                  {getBlogTags(post).map(tag => (
                    <span key={tag} className="post-tag-small">{tag}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="blog-footer">
        <div className="newsletter-section">
          <h3>Stay Updated</h3>
          <p>Get notified when I publish new posts about development and photography.</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email" className="email-input" />
            <button className="subscribe-btn">Subscribe</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;