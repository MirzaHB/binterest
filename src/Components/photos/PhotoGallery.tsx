import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getPhotos, PhotoMetadata } from '../../api/photo-api';
import PhotoModal from './PhotoModal';
import './PhotoGallery.css';

interface ImageLoadState {
  [key: string]: 'loading' | 'loaded' | 'error';
}

interface ImageHeights {
  [key: string]: number;
}

interface Column {
  photos: PhotoMetadata[];
  height: number;
}

const PhotoGallery: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoadStates, setImageLoadStates] = useState<ImageLoadState>({});
  const [imageHeights, setImageHeights] = useState<ImageHeights>({});
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [columnCount, setColumnCount] = useState(3);
  const galleryRef = useRef<HTMLDivElement>(null);
  const photosPerPage = 5;

  // Calculate optimal column count based on screen width
  const calculateColumnCount = useCallback(() => {
    if (!galleryRef.current) return 3;

    const containerWidth = galleryRef.current.offsetWidth;
    const columnWidth = 350; // Base column width
    const gap = 20; // Gap between columns

    const possibleColumns = Math.floor((containerWidth + gap) / (columnWidth + gap));
    return Math.max(1, Math.min(possibleColumns, 5)); // Between 1-5 columns
  }, []);

  // Height-based distribution for better masonry layout
  const distributePhotosToColumns = useCallback((photoList: PhotoMetadata[]) => {
    const cols = columnCount;
    const newColumns: Column[] = Array.from({ length: cols }, () => ({
      photos: [],
      height: 0
    }));

    // Distribute photos to the shortest column each time
    photoList.forEach((photo) => {
      // Find the column with the minimum height
      let shortestColumnIndex = 0;
      let minHeight = newColumns[0].height;

      for (let i = 1; i < cols; i++) {
        if (newColumns[i].height < minHeight) {
          minHeight = newColumns[i].height;
          shortestColumnIndex = i;
        }
      }

      // Add photo to the shortest column
      newColumns[shortestColumnIndex].photos.push(photo);

      // Use actual height if available, otherwise estimate
      let photoHeight: number;
      if (imageHeights[photo.blobName]) {
        photoHeight = imageHeights[photo.blobName];
      } else {
        // Estimate photo height based on blobName hash for consistency
        const hashCode = photo.blobName.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        // Convert hash to height between 200-500px
        photoHeight = Math.abs(hashCode % 300) + 200;
      }

      newColumns[shortestColumnIndex].height += photoHeight + 20; // +20 for gap
    });

    return newColumns;
  }, [columnCount, imageHeights]);

  // Handle window resize to recalculate columns
  useEffect(() => {
    const handleResize = () => {
      const newColumnCount = calculateColumnCount();
      if (newColumnCount !== columnCount) {
        setColumnCount(newColumnCount);
      }
    };

    handleResize(); // Initial calculation
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateColumnCount, columnCount]);

  // Update columns when photos or column count changes
  useEffect(() => {
    if (photos.length > 0) {
      const newColumns = distributePhotosToColumns(photos);
      setColumns(newColumns);
    }
  }, [photos, distributePhotosToColumns]);

  // Throttled redistribution when we get more actual image heights
  // Temporarily disabled to fix loading issues
  /*
  useEffect(() => {
    if (photos.length > 0 && Object.keys(imageHeights).length > 0) {
      // Only redistribute if we have heights for a significant portion of loaded photos
      const loadedImagesCount = Object.keys(imageHeights).length;
      const totalPhotos = photos.length;

      // Only redistribute when we have heights for at least 25% of photos, or every 5 images
      if (loadedImagesCount % 5 === 0 || loadedImagesCount / totalPhotos >= 0.25) {
        const newColumns = distributePhotosToColumns(photos);
        setColumns(newColumns);
      }
    }
  }, [imageHeights, photos, distributePhotosToColumns]);
  */

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
        setPhotos(prev => [...prev, ...newPhotoData]);
        setHasMore(newPhotoData.length === photosPerPage);

        // Initialize image load states
        const newStates: ImageLoadState = {};
        newPhotoData.forEach((photo) => {
          newStates[photo.blobName] = 'loading';
        });
        setImageLoadStates(prev => ({ ...prev, ...newStates }));
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

  const handleImageLoad = (blobName: string, element: HTMLImageElement) => {
    // Store actual image height for better distribution
    setImageHeights(prev => ({
      ...prev,
      [blobName]: element.offsetHeight
    }));

    setImageLoadStates(prev => {
      // Only update if the state is currently loading to avoid unnecessary re-renders
      if (prev[blobName] !== 'loaded') {
        return {
          ...prev,
          [blobName]: 'loaded'
        };
      }
      return prev;
    });
  };

  const handleImageError = (blobName: string) => {
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

  const renderPhoto = (photo: PhotoMetadata, globalIndex: number) => {
    const photoKey = photo.blobName || `photo-${globalIndex}`;
    const loadState = imageLoadStates[photoKey] || 'loading';

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
          alt={`Gallery item ${globalIndex + 1}`}
          loading="eager"
          data-blob-name={photo.blobName}
          onLoad={(e) => handleImageLoad(photoKey, e.currentTarget)}
          onError={() => handleImageError(photoKey)}
          style={{
            display: loadState === 'loaded' ? 'block' : 'none',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </div>
    );
  };

  return (
    <div className="photo-gallery" ref={galleryRef}>
      <h3 className="gallery-title">Photo Gallery</h3>
      <div className="photo-grid-balanced">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="photo-column">
            {column.photos.map((photo, photoIndex) => {
              const globalIndex = photos.findIndex(p => p.blobName === photo.blobName);
              // Use a fallback index if not found to prevent issues
              const safeIndex = globalIndex >= 0 ? globalIndex : photoIndex;
              return renderPhoto(photo, safeIndex);
            })}
          </div>
        ))}
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