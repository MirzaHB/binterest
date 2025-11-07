import apiClient, { createAuthenticatedRequest } from './api-client';

export interface UploadResponse {
  message: string;
  url: string;
  blobName: string;
}

export interface PhotoMetadata {
  url: string;
  proxyUrl?: string; // Fallback URL if direct URL fails
  description?: string;
  blobName: string;
  lastModified?: string;
}

export const uploadPhoto = async (file: File, accessToken: string): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const authenticatedClient = createAuthenticatedRequest(accessToken);
  const response = await authenticatedClient.post<UploadResponse>('/photos/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Backend interface (what actually comes from the C# API)
interface BackendPhotoMetadata {
  url: string;
  description?: string;
  blobName: string;
  lastModified?: string;
}

export const getPhotos = async (limit: number = 5, skip: number = 0): Promise<PhotoMetadata[]> => {
  try {
    const response = await apiClient.get<BackendPhotoMetadata[]>(`/photos?limit=${limit}&skip=${skip}`);

    // Check if we should use direct URLs or proxy
    const useDirectUrls = true; // Set to false to force proxy usage (avoiding 404s)

    const transformedPhotos = response.data.map(photo => ({
      url: useDirectUrls ? photo.url : `/api/photos/${photo.blobName}/image`,
      proxyUrl: `/api/photos/${photo.blobName}/image`, // Always provide fallback
      description: photo.description,
      blobName: photo.blobName,
      lastModified: photo.lastModified
    }));

    return transformedPhotos;
  } catch (error) {
    console.error('Error in getPhotos:', error);
    throw error;
  }
};

export const getUploadSas = async (): Promise<{ sasUri: string }> => {
  const response = await apiClient.get<{ sasUri: string }>('/photos/upload-sas');
  return response.data;
};

export const deletePhoto = async (blobName: string, accessToken: string): Promise<void> => {
  const authenticatedClient = createAuthenticatedRequest(accessToken);
  await authenticatedClient.delete(`/photos/${blobName}`);
};
