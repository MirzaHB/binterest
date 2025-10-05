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
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
        tags: tags.trim()
      }, accessToken);

      setMessage({ type: 'success', text: `Blog "${result.title}" published successfully!` });

      // Reset form
      setTitle('');
      setSummary('');
      setAuthor('');
      setTags('');
      setContent('');

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