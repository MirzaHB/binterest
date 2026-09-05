import apiClient, { createAuthenticatedRequest } from './api-client';

export interface UploadResponse {
  message: string;
  url: string;
  blobName: string;
}

// A display-sized copy of a photo, produced by the ProcessPhotoOnUpload Azure
// function and listed by the API.
export interface PhotoThumbnail {
  width: number;
  url: string;
}

export interface PhotoMetadata {
  url: string;
  proxyUrl?: string; // Fallback URL if direct URL fails
  description?: string;
  blobName: string;
  lastModified?: string;
  width?: number;
  height?: number;
  // Smallest first. Empty for photos uploaded before the resize function existed,
  // in which case callers fall back to the full-size url.
  thumbnails?: PhotoThumbnail[];
}

export const uploadPhoto = async (
  file: File,
  accessToken: string,
  width?: number,
  height?: number,
  description?: string
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  if (width !== undefined) {
    formData.append('width', width.toString());
  }
  if (height !== undefined) {
    formData.append('height', height.toString());
  }
  // Sent with the upload rather than in a follow-up call, so the caption cannot
  // race the function that resizes the photo and rewrites its metadata.
  if (description !== undefined && description.trim()) {
    formData.append('description', description);
  }

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
  width?: number;
  height?: number;
  thumbnails?: PhotoThumbnail[];
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
      lastModified: photo.lastModified,
      width: photo.width,
      height: photo.height,
      thumbnails: photo.thumbnails
    }));

    return transformedPhotos;
  } catch (error) {
    console.error('Error in getPhotos:', error);
    throw error;
  }
};

export const deletePhoto = async (blobName: string, accessToken: string): Promise<void> => {
  const authenticatedClient = createAuthenticatedRequest(accessToken);
  await authenticatedClient.delete(`/photos/${blobName}`);
};

// Editing a caption on a photo that is already uploaded. There is no matching
// read: the description ships with every photo in the list, so the gallery and
// modal already have it.
interface PhotoDescriptionResponse {
  description: string | null;
}

// Saving an empty description clears it, so this doubles as the delete path.
export const updatePhotoDescription = async (
  blobName: string,
  description: string,
  accessToken: string
): Promise<string | null> => {
  const authenticatedClient = createAuthenticatedRequest(accessToken);
  const response = await authenticatedClient.put<PhotoDescriptionResponse>(
    `/photos/${encodeURIComponent(blobName)}/description`,
    { description }
  );
  return response.data.description;
};
