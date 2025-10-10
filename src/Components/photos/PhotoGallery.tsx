import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getPhotos, PhotoMetadata } from '../../api/photo-api';
import PhotoModal from './PhotoModal';
import './PhotoGallery.css';

interface Column {
  photos: PhotoMetadata[];
  height: number;
}

const PhotoGallery: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);

  // Infinite scroll state
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const PHOTOS_PER_PAGE = 10;

  // Calculate initial column count based on screen size
  const getInitialColumnCount = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width <= 600) return 2;
      if (width <= 768) return width > 680 ? 3 : 2;
      if (width <= 1024) return 3;
      return 3;
    }
    return 3;
  };

  const [columnCount, setColumnCount] = useState(getInitialColumnCount);
  const [imageHeights, setImageHeights] = useState<{[key: string]: number}>({});
  const galleryRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Calculate optimal column count based on screen width
  const calculateColumnCount = useCallback(() => {
    if (!galleryRef.current) return 3;
    const containerWidth = galleryRef.current.offsetWidth;

    // Mobile-first responsive column calculation
    if (containerWidth <= 600) {
      // Mobile phones: Always 2 columns
      return 2;
    } else if (containerWidth <= 768) {
      // Small tablets: 2-3 columns
      return containerWidth > 680 ? 3 : 2;
    } else if (containerWidth <= 1024) {
      // Medium screens: 3-4 columns
      const columnWidth = 250;
      const gap = 18;
      const possibleColumns = Math.floor((containerWidth + gap) / (columnWidth + gap));
      return Math.max(3, Math.min(possibleColumns, 4));
    } else {
      // Large screens: 3-5 columns
      const columnWidth = 350;
      const gap = 20;
      const possibleColumns = Math.floor((containerWidth + gap) / (columnWidth + gap));
      return Math.max(3, Math.min(possibleColumns, 5));
    }
  }, []);

  // Simple, reliable masonry distribution - always shortest column
  const distributePhotosToColumns = useCallback((photoList: PhotoMetadata[]) => {
    const cols = columnCount;
    const newColumns: Column[] = Array.from({ length: cols }, () => ({
      photos: [],
      height: 0
    }));

    photoList.forEach((photo) => {
      // Find the shortest column
      let shortestColumnIndex = 0;
      for (let i = 1; i < cols; i++) {
        if (newColumns[i].height < newColumns[shortestColumnIndex].height) {
          shortestColumnIndex = i;
        }
      }

      // Add photo to shortest column
      newColumns[shortestColumnIndex].photos.push(photo);

      // Use actual height or reasonable estimate
      const photoHeight = imageHeights[photo.blobName] || 350;
      newColumns[shortestColumnIndex].height += photoHeight + 20; // 20px gap
    });

    return newColumns;
  }, [columnCount, imageHeights]);

  // Handle window resize with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (galleryRef.current) {
          const newColumnCount = calculateColumnCount();
          if (newColumnCount !== columnCount) {
            setColumnCount(newColumnCount);
          }
        }
      }, 200); // Slightly longer delay to prevent rapid changes
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [calculateColumnCount, columnCount]);

  // Redistribute when photos or column count changes
  useEffect(() => {
    if (photos.length > 0) {
      const newColumns = distributePhotosToColumns(photos);
      setColumns(newColumns);
    }
  }, [photos, distributePhotosToColumns]);

  // Initialize columns immediately when component mounts
  useEffect(() => {
    // Set initial empty columns based on screen size
    const initialCols = getInitialColumnCount();
    const emptyColumns: Column[] = Array.from({ length: initialCols }, () => ({
      photos: [],
      height: 0
    }));
    setColumns(emptyColumns);
    setColumnCount(initialCols);
  }, []);

  // Load more photos (for infinite scroll)
  const loadMorePhotos = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      setError(null);

      const photoData = await getPhotos(PHOTOS_PER_PAGE, skip);

      // If we got fewer photos than requested, we've reached the end
      if (photoData.length < PHOTOS_PER_PAGE) {
        setHasMore(false);
      }

      // If no photos returned, we're done
      if (photoData.length === 0) {
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      // Append new photos to existing ones, filter out duplicates
      setPhotos(prev => {
        const existingBlobNames = new Set(prev.map(p => p.blobName));
        const newPhotos = photoData.filter(p => !existingBlobNames.has(p.blobName));
        return [...prev, ...newPhotos];
      });

      // Update skip to current total
      setSkip(prevSkip => prevSkip + PHOTOS_PER_PAGE);
    } catch (error) {
      console.error('Failed to load photos:', error);
      setError(error instanceof Error ? error.message : 'Failed to load photos');
    } finally {
      setLoadingMore(false);
      setLoading(false);
    }
  }, [skip, hasMore, loadingMore, PHOTOS_PER_PAGE]);

  // Handle image load - store actual height and redistribute
  const handleImageLoad = useCallback((blobName: string, element: HTMLImageElement) => {
    const actualHeight = element.offsetHeight;

    setImageHeights(prev => {
      if (!prev[blobName]) {
        return {
          ...prev,
          [blobName]: actualHeight
        };
      }
      return prev;
    });
  }, []);

  // Redistribute when we have enough real heights
  useEffect(() => {
    if (photos.length > 0 && Object.keys(imageHeights).length > 0) {
      const loadedCount = Object.keys(imageHeights).length;

      // Redistribute at key milestones
      if (loadedCount % 10 === 0 || loadedCount === photos.length) {
        const newColumns = distributePhotosToColumns(photos);
        setColumns(newColumns);
      }
    }
  }, [imageHeights, photos, distributePhotosToColumns]);

  // Photo click handler
  const handlePhotoClick = (photo: PhotoMetadata) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPhoto(null);
  };

  // Load initial photos on mount
  useEffect(() => {
    loadMorePhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // When sentinel is visible and we have more photos to load
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMorePhotos();
        }
      },
      {
        // Trigger when sentinel is 200px away from viewport
        rootMargin: '200px',
      }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loadMorePhotos]);

  if (loading) {
    return <div className="loading">Loading photos…</div>;
  }

  if (error && photos.length === 0) {
    return (
      <div className="empty-state">
        <p>Error loading photos: {error}</p>
        <button onClick={loadMorePhotos} style={{ marginTop: '10px', padding: '8px 16px' }}>
          Retry
        </button>
      </div>
    );
  }

  if (photos.length === 0) {
    return <div className="empty-state">No photos found in the container.</div>;
  }

  return (
    <div className="photo-gallery" ref={galleryRef}>
      <h3 className="gallery-title">Photo Gallery</h3>

      <div className="photo-grid-balanced">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="photo-column">
            {column.photos.map((photo, photoIndex) => (
              <div
                key={photo.blobName || `photo-${photoIndex}`}
                className="photo-item"
                onClick={() => handlePhotoClick(photo)}
              >
                <img
                  src={photo.url}
                  alt={`Gallery item ${photoIndex + 1}`}
                  loading="lazy"
                  onLoad={(e) => handleImageLoad(photo.blobName, e.currentTarget)}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Sentinel element for infinite scroll */}
      {hasMore && (
        <div ref={sentinelRef} style={{ height: '20px', margin: '20px 0' }}>
          {loadingMore && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#667eea' }}>
              Loading more photos...
            </div>
          )}
        </div>
      )}

      {!hasMore && photos.length > 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          You've reached the end! 🎉
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