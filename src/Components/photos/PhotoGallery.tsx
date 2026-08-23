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
  const restoredFromCacheRef = useRef<Set<string>>(new Set());
  const photosRef = useRef<PhotoMetadata[]>([]);
  const hasLoadedRef = useRef(false);
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

    // Calculate containerWidth, gap, and columnWidth once — reused for every photo in the loop
    const containerWidth = galleryRef.current ? galleryRef.current.offsetWidth : 1200;
    let gap = 20;
    if (containerWidth <= 360) gap = 8;
    else if (containerWidth <= 600) gap = 10;
    else if (containerWidth <= 768) gap = 15;
    else if (containerWidth <= 1024) gap = 18;
    const columnWidth = (containerWidth - gap * (cols - 1)) / cols;

    const getEstimatedHeight = (photo: PhotoMetadata): number => {
      // First priority: actual measured height from ref
      if (imageHeightsRef.current[photo.blobName]) {
        return imageHeightsRef.current[photo.blobName];
      }

      // Second priority: calculate from metadata dimensions
      if (photo.width && photo.height) {
        const aspectRatio = photo.height / photo.width;
        return columnWidth * aspectRatio;
      }

      // Fallback: reasonable estimate
      return 350;
    };

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
          setColumns(distributePhotosToColumns(photosRef.current));
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
  }, [distributePhotosToColumns]);

  // Keep photosRef in sync so callbacks always see the latest photos array
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

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

        // Mark these blobNames so onLoad handlers skip them (they're already measured)
        restoredFromCacheRef.current = new Set(photos.map((p: PhotoMetadata) => p.blobName));

        setPhotos(photos);
        setImageHeights(heights);
        imageHeightsRef.current = heights;

        // Redistribute with cached heights
        setColumns(distributePhotosToColumns(photos));

        setLoading(false);

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
    // Skip if this image was restored from cache (already has a measured height)
    if (restoredFromCacheRef.current.has(blobName)) {
      restoredFromCacheRef.current.delete(blobName);
      return;
    }

    const actualHeight = element.offsetHeight;

    // Only update if we don't already have this height
    if (!imageHeightsRef.current[blobName]) {
      imageHeightsRef.current[blobName] = actualHeight;
      pendingHeightsRef.current[blobName] = actualHeight;

      // Use photosRef to avoid stale closure — photosRef always points to latest photos array
      const photo = photosRef.current.find(p => p.blobName === blobName);
      const hasMetadata = photo?.width && photo?.height;

      // Clear existing batch timer
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }

      // Batch state update - wait for 250ms of no new images
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
            setColumns(distributePhotosToColumns(photosRef.current));
          } else {
            // Mark as pending for when scroll finishes
            pendingRedistribution.current = true;
          }
        }
      }, 250);
    }
  }, [distributePhotosToColumns]);

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

  // Load photos on mount only — hasLoadedRef prevents re-firing when loadAllPhotos
  // reference changes due to columnCount/distributePhotosToColumns recreating on resize
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadAllPhotos();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // These photos are 8–30 megapixels each, so their decoded bitmaps run to well
  // over a gigabyte in total — far past what Chrome keeps in its decoded-image
  // cache. It evicts them as you scroll, and because the <img> is decoding="async"
  // the browser is free to paint a frame without the pixels rather than wait for
  // the ~90ms re-decode. That frame is the blank card, and it stays blank until
  // something dirties the tile — which is what hovering does.
  //
  // Re-decoding a little before the image reaches the viewport keeps a warm
  // bitmap ready for the frame that actually needs it. onLoad can't do this job:
  // it fired once, long before the eviction.
  const decodeObserverRef = useRef<IntersectionObserver | null>(null);

  const observeForDecode = useCallback((img: HTMLImageElement | null) => {
    if (!img) return;
    if (!decodeObserverRef.current) {
      decodeObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            // A no-op when the bitmap is still warm, so this costs nothing in
            // the common case. Rejects if the src is swapped mid-decode.
            (entry.target as HTMLImageElement).decode?.().catch(() => {});
          });
        },
        // Far enough ahead that the decode has finished before the card is on
        // screen, close enough that we aren't decoding the whole gallery at once.
        { rootMargin: '600px 0px' }
      );
    }
    const observer = decodeObserverRef.current;
    observer.observe(img);
    // Changing the column count re-parents every image, so these nodes are
    // replaced far more often than the gallery unmounts. An IntersectionObserver
    // keeps a strong reference to whatever it observes, so without this the
    // detached ones pile up for the life of the page.
    return () => observer.unobserve(img);
  }, []);

  useEffect(() => () => decodeObserverRef.current?.disconnect(), []);

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

              // The originals are 8–30 megapixels. Rendered in a tile no wider
              // than 440 CSS px they decode to roughly 1.6 GB of bitmap across the
              // gallery, which overruns the browser's decoded-image cache and
              // leaves cards painting blank until something forces a repaint.
              // These are the same photos at 640w and 1280w: ~25 MB on a phone,
              // ~101 MB on a desktop.
              const srcSet = photo.thumbnails?.length
                ? photo.thumbnails.map((t) => `${t.url} ${t.width}w`).join(', ')
                : undefined;

              // Fall back to the original for anything the resize function has
              // not reached yet, and give the browser the largest derivative as
              // the plain src so a no-srcset client still avoids the full size.
              const largest = photo.thumbnails?.length
                ? photo.thumbnails[photo.thumbnails.length - 1].url
                : photo.url;

              return (
                <div
                  key={photo.blobName || `photo-${photoIndex}`}
                  className="photo-item"
                  onClick={() => handlePhotoClick(photo)}
                >
                  <img
                    src={largest}
                    srcSet={srcSet}
                    // Mirrors calculateColumnCount: two columns on phones, three
                    // from tablet up, and a hard 440px once the 1400px cap bites.
                    sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 440px"
                    alt={`Gallery item ${photoIndex + 1}`}
                    loading={globalIndex < 8 ? "eager" : "lazy"}
                    decoding="async"
                    ref={observeForDecode}
                    onLoad={(e) => handleImageLoad(photo.blobName, e.currentTarget)}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      aspectRatio: photo.width && photo.height ? `${photo.width}/${photo.height}` : undefined,
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
