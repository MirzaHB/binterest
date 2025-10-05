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
}

export interface CreateBlogRequest {
  file: File;
  title?: string;
  summary?: string;
  author?: string;
  tags?: string;
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

  const response = await apiClient.post<CreateBlogResponse>('/blogs', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return response.data;
};

// Update blog metadata
export const updateBlog = async (id: string, updateData: UpdateBlogRequest): Promise<{ message: string }> => {
  const formData = new FormData();

  if (updateData.title) formData.append('title', updateData.title);
  if (updateData.summary) formData.append('summary', updateData.summary);
  if (updateData.author) formData.append('author', updateData.author);
  if (updateData.tags) formData.append('tags', updateData.tags);

  const response = await apiClient.put<{ message: string }>(`/blogs/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Delete a blog post
export const deleteBlog = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/blogs/${id}`);
  return response.data;
};

// Helper function to parse tags string into array
export const parseTags = (tagsString?: string): string[] => {
  if (!tagsString) return [];
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
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