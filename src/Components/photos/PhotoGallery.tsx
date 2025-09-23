import React, { useState, useEffect, useCallback } from 'react';
import { getPhotos, PhotoMetadata } from '../../api/photo-api';
import PhotoModal from './PhotoModal';
import './PhotoGallery.css';

interface ImageLoadState {
  [key: string]: 'loading' | 'loaded' | 'error';
}

const PhotoGallery: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoadStates, setImageLoadStates] = useState<ImageLoadState>({});
  const [error, setError] = useState<string | null>(null);
  const photosPerPage = 5;

  const loadInitialPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const photoData = await getPhotos(photosPerPage, 0);

      setPhotos(photoData);
      setHasMore(photoData.length === photosPerPage);

      // Initialize image load states
      const initialStates: ImageLoadState = {};
      photoData.forEach((photo, index) => {
        const key = photo.blobName || `photo-${index}`;
        initialStates[key] = 'loading';
      });
      setImageLoadStates(initialStates);

      // No prefetching - only load when user clicks "Load More"
    } catch (error) {
      console.error('Failed to load photos:', error);
      setError(error instanceof Error ? error.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [photosPerPage]);

  const loadMorePhotos = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const skipCount = photos.length;

      // Simple: fetch photos only when button is clicked
      const newPhotoData = await getPhotos(photosPerPage, skipCount);

      if (newPhotoData.length > 0) {
        console.log(`📸 Adding ${newPhotoData.length} new photos to gallery`);
        newPhotoData.forEach(photo => {
          console.log(`🔗 Photo URL: ${photo.url}`);
        });

        setPhotos(prev => [...prev, ...newPhotoData]);
        setHasMore(newPhotoData.length === photosPerPage);

        // Initialize image load states
        const newStates: ImageLoadState = {};
        newPhotoData.forEach((photo) => {
          newStates[photo.blobName] = 'loading';
        });
        setImageLoadStates(prev => ({ ...prev, ...newStates }));
        console.log(`🔄 Set ${Object.keys(newStates).length} images to loading state`);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more photos:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePhotoClick = (photo: PhotoMetadata) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPhoto(null);
  };

  const handleImageLoad = (blobName: string) => {
    console.log(`✅ Image loaded: ${blobName}`);
    setImageLoadStates(prev => ({
      ...prev,
      [blobName]: 'loaded'
    }));
  };

  const handleImageError = (blobName: string) => {
    console.error(`❌ Failed to load image: ${blobName}`);
    setImageLoadStates(prev => ({
      ...prev,
      [blobName]: 'error'
    }));
  };

  const retryLoadImage = (blobName: string) => {
    setImageLoadStates(prev => ({
      ...prev,
      [blobName]: 'loading'
    }));

    // Force re-render by creating a new key
    const img = document.querySelector(`img[data-blob-name="${blobName}"]`) as HTMLImageElement;
    if (img) {
      const originalSrc = img.src;
      img.src = '';
      setTimeout(() => {
        img.src = originalSrc;
      }, 100);
    }
  };


  useEffect(() => {
    loadInitialPhotos();
  }, [loadInitialPhotos]);

  if (loading) {
    return <div className="loading">Loading photos…</div>;
  }

  if (error) {
    return (
      <div className="empty-state">
        <p>Error loading photos: {error}</p>
        <button onClick={loadInitialPhotos} style={{ marginTop: '10px', padding: '8px 16px' }}>
          Retry
        </button>
      </div>
    );
  }

  if (photos.length === 0) {
    return <div className="empty-state">No photos found in the container.</div>;
  }

  return (
    <div className="photo-gallery">
      <h3 className="gallery-title">Photo Gallery</h3>
      <div className="photo-grid">
        {photos.map((photo, index) => {
          const photoKey = photo.blobName || `photo-${index}`;
          const loadState = imageLoadStates[photoKey] || 'loading';
          console.log(`🖼️ Rendering photo ${index + 1}: ${photoKey}, state: ${loadState}`);
          return (
            <div
              key={photoKey}
              className={`photo-item ${loadState}`}
              onClick={() => loadState === 'loaded' ? handlePhotoClick(photo) : undefined}
            >
              {loadState === 'loading' && (
                <div className="photo-placeholder">
                  <div className="photo-spinner"></div>
                  <span>Loading...</span>
                </div>
              )}

              {loadState === 'error' && (
                <div className="photo-error">
                  <span>⚠️</span>
                  <span>Failed to load image</span>
                  <button onClick={() => retryLoadImage(photoKey)}>
                    Retry
                  </button>
                </div>
              )}

              <img
                src={photo.url}
                alt={`Gallery item ${index + 1}`}
                loading="eager" // Always eager load to avoid lazy loading issues
                data-blob-name={photo.blobName}
                onLoad={() => {
                  console.log(`🎯 IMG onLoad fired for: ${photoKey}`);
                  handleImageLoad(photoKey);
                }}
                onError={() => {
                  console.log(`💥 IMG onError fired for: ${photoKey}`);
                  handleImageError(photoKey);
                }}
                style={{
                  display: loadState === 'loaded' ? 'block' : 'none',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="load-more-container">
          <button
            className={`load-more-btn ${loadingMore ? 'loading' : ''}`}
            onClick={loadMorePhotos}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading more photos...' : 'Load More Photos'}
          </button>
        </div>
      )}

      {!hasMore && photos.length > 0 && (
        <div className="end-message">
          You've reached the end! Total photos: {photos.length}
        </div>
      )}

      <PhotoModal
        photo={selectedPhoto}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default PhotoGallery;