import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBlogs, BlogPost, parseTags, formatBlogDate } from '../api/blog-api';
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
          <article className="featured-post" onClick={() => navigate(`/blog/${featuredPost.id.replace('.md', '')}`)}>
            <div className="post-content">
              <div className="post-meta">
                <span className="post-date">{formatBlogDate(featuredPost.createdDate || featuredPost.lastModified)}</span>
                {featuredPost.photoCount !== undefined && featuredPost.photoCount > 0 && (
                  <>
                    <span className="post-divider">•</span>
                    <span className="post-photos">📸 {featuredPost.photoCount}</span>
                  </>
                )}
              </div>
              <h3 className="post-title">{featuredPost.title || 'Untitled Post'}</h3>
              <p className="post-excerpt">{getBlogExcerpt(featuredPost)}</p>
              <div className="post-tags">
                {getBlogTags(featuredPost).map(tag => (
                  <span key={tag} className="post-tag">{tag}</span>
                ))}
              </div>
            </div>
          </article>
        </div>
      )}

      <div className="posts-section">
        <h2 className="section-title">Recent Posts</h2>
        <div className="posts-grid">
          {regularPosts.map(post => (
            <article key={post.id} className="blog-post" onClick={() => navigate(`/blog/${post.id.replace('.md', '')}`)}>
              <div className="post-content-small">
                <div className="post-meta">
                  <span className="post-date">{formatBlogDate(post.createdDate || post.lastModified)}</span>
                  {post.photoCount !== undefined && post.photoCount > 0 && (
                    <>
                      <span className="post-divider">•</span>
                      <span className="post-photos">📸 {post.photoCount}</span>
                    </>
                  )}
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
    </div>
  );
};

export default Blog;