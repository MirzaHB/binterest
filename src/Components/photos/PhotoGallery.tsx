import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getPhotos, PhotoMetadata } from '../../api/photo-api';
import PhotoModal from './PhotoModal';
import './PhotoGallery.css';

interface ImageLoadState {
  [key: string]: 'loading' | 'loaded' | 'error';
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

  // Simple round-robin distribution for initial layout
  const distributePhotosToColumns = useCallback((photoList: PhotoMetadata[]) => {
    const cols = columnCount;
    const newColumns: Column[] = Array.from({ length: cols }, () => ({
      photos: [],
      height: 0
    }));

    // Simple round-robin distribution - much more even than height-based
    photoList.forEach((photo, index) => {
      const columnIndex = index % cols;
      newColumns[columnIndex].photos.push(photo);
    });

    return newColumns;
  }, [columnCount]);

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

  const handleImageLoad = (blobName: string) => {
    setImageLoadStates(prev => ({
      ...prev,
      [blobName]: 'loaded'
    }));
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
          onLoad={() => handleImageLoad(photoKey)}
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
            {column.photos.map((photo) => {
              const globalIndex = photos.findIndex(p => p.blobName === photo.blobName);
              return renderPhoto(photo, globalIndex);
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