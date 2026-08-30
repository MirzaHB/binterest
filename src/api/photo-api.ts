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
  height?: number
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  if (width !== undefined) {
    formData.append('width', width.toString());
  }
  if (height !== undefined) {
    formData.append('height', height.toString());
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

// The long-form text written about a single photo.
//
// Deliberately not part of the PhotoMetadata the gallery lists: PhotoGallery
// caches that whole list in sessionStorage for the life of the tab, so a story
// riding along in it would go stale the moment it was edited and stay stale.
// Fetching per photo when the modal opens keeps edits visible immediately.
interface PhotoStoryResponse {
  story: string | null;
}

export const getPhotoStory = async (blobName: string): Promise<string | null> => {
  const response = await apiClient.get<PhotoStoryResponse>(
    `/photos/${encodeURIComponent(blobName)}/story`
  );
  return response.data.story;
};

// Saving an empty story removes it, so this doubles as the delete path.
export const savePhotoStory = async (
  blobName: string,
  story: string,
  accessToken: string
): Promise<string | null> => {
  const authenticatedClient = createAuthenticatedRequest(accessToken);
  const response = await authenticatedClient.put<PhotoStoryResponse>(
    `/photos/${encodeURIComponent(blobName)}/story`,
    { story }
  );
  return response.data.story;
};
