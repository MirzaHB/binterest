import apiClient from './api-client';

export interface BlogPost {
  id: string;
  title?: string;
  summary?: string;
  author?: string;
  tags?: string;
  url: string;
  blobName: string;
  lastModified?: string;
  createdDate?: string;
  photoCount?: number;
  photoUrls?: string[];
}

export interface CreateBlogRequest {
  file: File;
  title?: string;
  summary?: string;
  author?: string;
  tags?: string;
  photo1?: File;
  photo2?: File;
  photo3?: File;
}

export interface CreateBlogResponse {
  id: string;
  message: string;
  title?: string;
  summary?: string;
  author?: string;
  tags?: string;
}

export interface UpdateBlogRequest {
  title?: string;
  summary?: string;
  author?: string;
  tags?: string;
}

// Get all blogs with optional pagination
export const getBlogs = async (limit?: number, skip?: number): Promise<BlogPost[]> => {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (skip) params.append('skip', skip.toString());

  const response = await apiClient.get<BlogPost[]>(`/blogs?${params.toString()}`);
  return response.data;
};

// Get a specific blog by ID
export const getBlog = async (id: string): Promise<BlogPost> => {
  const response = await apiClient.get<BlogPost>(`/blogs/${id}`);
  return response.data;
};

// Create a new blog post
export const createBlog = async (blogData: CreateBlogRequest, accessToken: string): Promise<CreateBlogResponse> => {
  const formData = new FormData();
  formData.append('file', blogData.file);

  if (blogData.title) formData.append('title', blogData.title);
  if (blogData.summary) formData.append('summary', blogData.summary);
  if (blogData.author) formData.append('author', blogData.author);
  if (blogData.tags) formData.append('tags', blogData.tags);

  // Add photos if provided
  if (blogData.photo1) formData.append('photo1', blogData.photo1);
  if (blogData.photo2) formData.append('photo2', blogData.photo2);
  if (blogData.photo3) formData.append('photo3', blogData.photo3);

  const response = await apiClient.post<CreateBlogResponse>('/blogs', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return response.data;
};

// Update blog metadata
export const updateBlog = async (id: string, updateData: UpdateBlogRequest, accessToken: string): Promise<{ message: string }> => {
  const formData = new FormData();

  if (updateData.title) formData.append('title', updateData.title);
  if (updateData.summary) formData.append('summary', updateData.summary);
  if (updateData.author) formData.append('author', updateData.author);
  if (updateData.tags) formData.append('tags', updateData.tags);

  const response = await apiClient.put<{ message: string }>(`/blogs/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return response.data;
};

// Delete a blog post
export const deleteBlog = async (id: string, accessToken: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/blogs/${id}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

// Helper function to parse tags string into array
export const parseTags = (tagsString?: string): string[] => {
  if (!tagsString) return [];
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
};

export interface TagCount {
  tag: string;
  count: number;
}

// Sort newest first. The API returns blobs in GUID order, so the list must be
// sorted client-side or posts appear in an arbitrary order.
export const sortBlogsByDate = (posts: BlogPost[]): BlogPost[] => {
  const timestamp = (post: BlogPost): number => {
    const date = post.createdDate || post.lastModified;
    if (!date) return 0;
    const parsed = new Date(date).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  return [...posts].sort((a, b) => timestamp(b) - timestamp(a));
};

// Count posts per tag, deduping case-insensitively so "Tech" and "tech" stay
// one entry. The first casing encountered becomes the display label.
export const getTagCounts = (posts: BlogPost[]): TagCount[] => {
  const counts = new Map<string, TagCount>();

  posts.forEach(post => {
    parseTags(post.tags).forEach(tag => {
      const key = tag.toLowerCase();
      const existing = counts.get(key);
      if (existing) {
        existing.count++;
      } else {
        counts.set(key, { tag, count: 1 });
      }
    });
  });

  return Array.from(counts.values()).sort(
    (a, b) => b.count - a.count || a.tag.localeCompare(b.tag)
  );
};

// Filter posts by tag. A null/empty tag returns everything.
export const filterBlogsByTag = (posts: BlogPost[], tag?: string | null): BlogPost[] => {
  if (!tag) return posts;
  const target = tag.toLowerCase();
  return posts.filter(post =>
    parseTags(post.tags).some(t => t.toLowerCase() === target)
  );
};

// Helper function to format date
export const formatBlogDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown date';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Get blog content (MDX file content) through backend API
export const getBlogContent = async (id: string): Promise<string> => {
  const response = await apiClient.get<string>(`/blogs/${id}/content`, {
    headers: {
      'Accept': 'text/plain',
    },
  });
  return response.data;
};

// Helper function to calculate read time (rough estimate based on content length)
export const calculateReadTime = (content: string): string => {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
};

// Convenience function for the blog editor
export const uploadBlog = async (blogData: CreateBlogRequest, accessToken: string): Promise<CreateBlogResponse> => {
  return createBlog(blogData, accessToken);
};

// Update blog content (the actual markdown file)
export const updateBlogContent = async (id: string, content: string, accessToken: string): Promise<{ message: string }> => {
  const formData = new FormData();

  // Create a markdown file from the content
  const blob = new Blob([content], { type: 'text/markdown' });
  const file = new File([blob], `${id}`, { type: 'text/markdown' });

  formData.append('file', file);

  const response = await apiClient.put<{ message: string }>(`/blogs/${id}/content`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return response.data;
};

// Upload or replace a specific blog photo
export const uploadBlogPhoto = async (id: string, photoNumber: number, photo: File, accessToken: string): Promise<{ message: string }> => {
  if (photoNumber < 1 || photoNumber > 3) {
    throw new Error('Photo number must be 1, 2, or 3');
  }

  const formData = new FormData();
  formData.append('photo', photo);

  const response = await apiClient.put<{ message: string }>(`/blogs/${id}/photos/${photoNumber}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return response.data;
};

// Delete a specific blog photo
export const deleteBlogPhoto = async (id: string, photoNumber: number, accessToken: string): Promise<{ message: string }> => {
  if (photoNumber < 1 || photoNumber > 3) {
    throw new Error('Photo number must be 1, 2, or 3');
  }

  const response = await apiClient.delete<{ message: string }>(`/blogs/${id}/photos/${photoNumber}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return response.data;
};