import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  // imageHeights state is used for sessionStorage persistence (see handleImageLoad and loadAllPhotos)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [imageHeights, setImageHeights] = useState<{[key: string]: number}>({});
  const imageHeightsRef = useRef<{[key: string]: number}>({});
  const galleryRef = useRef<HTMLDivElement>(null);
  const redistributeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const pendingHeightsRef = useRef<{[key: string]: number}>({});
  const batchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isRestoringFromCache = useRef(false);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const pendingRedistribution = useRef(false);

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
  // Uses ref for imageHeights to prevent constant re-memoization
  const distributePhotosToColumns = useCallback((photoList: PhotoMetadata[]) => {
    const cols = columnCount;
    const newColumns: Column[] = Array.from({ length: cols }, () => ({
      photos: [],
      height: 0
    }));

    // Calculate actual column width accounting for gaps
    // Formula: (containerWidth - gap * (columns - 1)) / columns
    const getColumnWidth = (): number => {
      if (!galleryRef.current) return 350; // Fallback
      const containerWidth = galleryRef.current.offsetWidth;

      // Gap must match CSS media queries
      let gap = 20; // Default
      if (containerWidth <= 360) {
        gap = 8;
      } else if (containerWidth <= 600) {
        gap = 10;
      } else if (containerWidth <= 768) {
        gap = 15;
      } else if (containerWidth <= 1024) {
        gap = 18;
      }

      return (containerWidth - gap * (cols - 1)) / cols;
    };

    // Get column width for aspect ratio calculations
    const getEstimatedHeight = (photo: PhotoMetadata): number => {
      // First priority: actual measured height from ref
      if (imageHeightsRef.current[photo.blobName]) {
        return imageHeightsRef.current[photo.blobName];
      }

      // Second priority: calculate from metadata dimensions
      if (photo.width && photo.height) {
        const columnWidth = getColumnWidth();
        const aspectRatio = photo.height / photo.width;
        return columnWidth * aspectRatio;
      }

      // Fallback: reasonable estimate
      return 350;
    };

    // Get responsive gap value
    const getGap = (): number => {
      if (!galleryRef.current) return 20;
      const containerWidth = galleryRef.current.offsetWidth;
      if (containerWidth <= 360) return 8;
      if (containerWidth <= 600) return 10;
      if (containerWidth <= 768) return 15;
      if (containerWidth <= 1024) return 18;
      return 20;
    };

    const gap = getGap();

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

      // Use best available height estimate
      const photoHeight = getEstimatedHeight(photo);
      newColumns[shortestColumnIndex].height += photoHeight + gap;
    });

    return newColumns;
  }, [columnCount]);

  // Scroll detection - disable redistribution during scroll
  useEffect(() => {
    const handleScroll = () => {
      isScrollingRef.current = true;

      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Mark scroll as finished after 300ms of no scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;

        // If redistribution is pending, do it now
        if (pendingRedistribution.current) {
          setColumns(distributePhotosToColumns(photos));
          pendingRedistribution.current = false;
        }
      }, 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [photos, distributePhotosToColumns]);

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

  // Load all photos with sessionStorage caching
  const loadAllPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to restore from sessionStorage first
      const cachedPhotos = sessionStorage.getItem('photoGallery_photos');
      const cachedHeights = sessionStorage.getItem('photoGallery_heights');

      if (cachedPhotos && cachedHeights) {
        const photos = JSON.parse(cachedPhotos);
        const heights = JSON.parse(cachedHeights);

        // Set flag to skip onLoad handlers during cache restoration
        isRestoringFromCache.current = true;

        setPhotos(photos);
        setImageHeights(heights);
        imageHeightsRef.current = heights;

        // Redistribute with cached heights
        setColumns(distributePhotosToColumns(photos));

        setLoading(false);

        // Allow time for initial render, then re-enable onLoad handlers
        setTimeout(() => {
          isRestoringFromCache.current = false;
        }, 1000);

        return;
      }

      // Otherwise fetch from API
      const photoData = await getPhotos(10000, 0);
      setPhotos(photoData);

      // Cache in sessionStorage
      sessionStorage.setItem('photoGallery_photos', JSON.stringify(photoData));

      // Initial redistribution with estimated heights
      setColumns(distributePhotosToColumns(photoData));
    } catch (error) {
      console.error('Failed to load photos:', error);
      setError(error instanceof Error ? error.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [distributePhotosToColumns]);

  // Handle image load - store actual height in ref and trigger batched redistribution
  const handleImageLoad = useCallback((blobName: string, element: HTMLImageElement) => {
    // Skip if restoring from cache
    if (isRestoringFromCache.current) return;

    const actualHeight = element.offsetHeight;

    // Only update if we don't already have this height
    if (!imageHeightsRef.current[blobName]) {
      imageHeightsRef.current[blobName] = actualHeight;
      pendingHeightsRef.current[blobName] = actualHeight;

      // Find the photo to check if it has metadata
      const photo = photos.find(p => p.blobName === blobName);
      const hasMetadata = photo?.width && photo?.height;

      // Clear existing batch timer
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }

      // Batch state update - wait for 250ms of no new images (increased from 100ms)
      batchTimeoutRef.current = setTimeout(() => {
        // Single state update for all pending images
        setImageHeights(prev => {
          const updated = { ...prev, ...pendingHeightsRef.current };
          sessionStorage.setItem('photoGallery_heights', JSON.stringify(updated));
          pendingHeightsRef.current = {}; // Clear pending
          return updated;
        });

        // Only redistribute if photo lacks metadata (old photos without dimensions)
        // Photos with metadata should already be accurately placed
        if (!hasMetadata) {
          // Only redistribute if NOT scrolling
          if (!isScrollingRef.current) {
            setColumns(distributePhotosToColumns(photos));
          } else {
            // Mark as pending for when scroll finishes
            pendingRedistribution.current = true;
          }
        }
      }, 250); // Increased timeout to accumulate more images
    }
  }, [photos, distributePhotosToColumns]);

  // Clean up timeouts on unmount
  useEffect(() => {
    // Capture current ref values for cleanup
    const redistributeTimeout = redistributeTimeoutRef.current;
    const batchTimeout = batchTimeoutRef.current;
    const scrollTimeout = scrollTimeoutRef.current;

    return () => {
      if (redistributeTimeout) {
        clearTimeout(redistributeTimeout);
      }
      if (batchTimeout) {
        clearTimeout(batchTimeout);
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);

  // Photo click handler
  const handlePhotoClick = (photo: PhotoMetadata) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPhoto(null);
  };

  const handlePhotoDelete = () => {
    // Refresh the gallery after deletion
    loadAllPhotos();
  };

  // Load photos on mount
  useEffect(() => {
    loadAllPhotos();
  }, [loadAllPhotos]);

  // Create a Map for O(1) photo index lookup instead of O(n) findIndex
  // Must be before early returns (React hooks rule)
  const photoIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    photos.forEach((photo, index) => {
      map.set(photo.blobName, index);
    });
    return map;
  }, [photos]);

  if (loading) {
    return <div className="loading">Loading photos…</div>;
  }

  if (error) {
    return (
      <div className="empty-state">
        <p>Error loading photos: {error}</p>
        <button onClick={loadAllPhotos} style={{ marginTop: '10px', padding: '8px 16px' }}>
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
            {column.photos.map((photo, photoIndex) => {
              // O(1) lookup instead of O(n) findIndex
              const globalIndex = photoIndexMap.get(photo.blobName) ?? 0;

              return (
                <div
                  key={photo.blobName || `photo-${photoIndex}`}
                  className="photo-item"
                  onClick={() => handlePhotoClick(photo)}
                >
                  <img
                    src={photo.url}
                    alt={`Gallery item ${photoIndex + 1}`}
                    loading={globalIndex < 8 ? "eager" : "lazy"}
                    decoding="async"
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
              );
            })}
          </div>
        ))}
      </div>

      <PhotoModal
        photo={selectedPhoto}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onDelete={handlePhotoDelete}
      />
    </div>
  );
};

export default PhotoGallery;
