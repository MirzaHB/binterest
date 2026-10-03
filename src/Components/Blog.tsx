import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  getBlogs,
  BlogPost,
  parseTags,
  formatBlogDate,
  sortBlogsByDate,
  getTagCounts,
  filterBlogsByTag,
} from '../api/blog-api';
import MahoragaLoader from './MahoragaLoader';
import './Blog.css';

const Blog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeTag = searchParams.get('tag');

  useEffect(() => {
    loadBlogs();
  }, []);

  // Jump back to the top when the filter changes so you don't land mid-page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTag]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const blogs = await getBlogs();
      setBlogPosts(sortBlogsByDate(blogs));
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

  // Counts come from the full list so a tag's total doesn't change once filtered
  const tagCounts = useMemo(() => getTagCounts(blogPosts), [blogPosts]);
  const visiblePosts = useMemo(
    () => filterBlogsByTag(blogPosts, activeTag),
    [blogPosts, activeTag]
  );

  // Display label for the active tag, using the casing from the posts themselves
  const activeTagLabel = useMemo(() => {
    if (!activeTag) return null;
    const match = tagCounts.find(t => t.tag.toLowerCase() === activeTag.toLowerCase());
    return match ? match.tag : activeTag;
  }, [activeTag, tagCounts]);

  const clearTag = () => {
    setSearchParams({});
  };

  // Clicking the tag that's already active toggles the filter back off
  const toggleTag = (tag: string) => {
    if (activeTag && tag.toLowerCase() === activeTag.toLowerCase()) {
      clearTag();
    } else {
      setSearchParams({ tag });
    }
  };

  if (loading) {
    return (
      <div className="blog-container">
        <MahoragaLoader label="Loading blog posts…" />
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
          Thoughts, ideas, and whatever I'm into
        </p>
      </div>

      <div className="posts-section">
        <div className="section-heading">
          <h2 className="section-title">
            {activeTagLabel ? (
              <>
                <span className="section-title-tag">{activeTagLabel}</span>
                <span className="section-title-count">
                  {visiblePosts.length} {visiblePosts.length === 1 ? 'post' : 'posts'}
                </span>
              </>
            ) : (
              'All Posts'
            )}
          </h2>
          {activeTagLabel && (
            <button onClick={clearTag} className="clear-filter-btn">
              Clear ×
            </button>
          )}
        </div>

        {visiblePosts.length === 0 ? (
          <div className="posts-empty">
            <p>No posts tagged “{activeTagLabel}”.</p>
            <button onClick={clearTag} className="retry-btn">
              Show all posts
            </button>
          </div>
        ) : (
          <div className="posts-grid">
            {visiblePosts.map(post => (
              <article key={post.id} className="blog-post">
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
                  {/* The title link stretches over the whole card via ::after, so the
                      card is clickable while tags stay separately interactive above it */}
                  <h3 className="post-title-small">
                    <Link to={`/blog/${post.id.replace('.md', '')}`} className="post-title-link">
                      {post.title || 'Untitled Post'}
                    </Link>
                  </h3>
                  <p className="post-excerpt-small">{getBlogExcerpt(post)}</p>
                  <div className="post-tags">
                    {getBlogTags(post).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        className={`post-tag-small${
                          activeTag && tag.toLowerCase() === activeTag.toLowerCase() ? ' active' : ''
                        }`}
                        onClick={() => toggleTag(tag)}
                        aria-pressed={
                          !!activeTag && tag.toLowerCase() === activeTag.toLowerCase()
                        }
                        aria-label={`Filter by tag ${tag}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
