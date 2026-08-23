import React, { useEffect, useState, useRef } from 'react';
import { PhotoMetadata, deletePhoto } from '../../api/photo-api';
import { useAuth } from '../../auth/useAuth';
import './PhotoModal.css';

interface PhotoModalProps {
  photo: PhotoMetadata | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ photo, isOpen, onClose, onDelete }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [imageMousPos, setImageMousePos] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomCenter, setZoomCenter] = useState({ x: 50, y: 50 });
  const [isDeleting, setIsDeleting] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isAdmin, getAccessToken } = useAuth();

  // The grid now renders a 1280px copy, so the full-size original is no longer
  // in the browser's cache when the modal opens — going straight to it would
  // leave the modal blank for as long as it takes to pull a megabyte or two down
  // and spend ~90ms decoding it. Show the copy the grid already has, then swap.
  const [displayUrl, setDisplayUrl] = useState('');

  useEffect(() => {
    if (!photo) return;

    const largestThumb = photo.thumbnails?.length
      ? photo.thumbnails[photo.thumbnails.length - 1].url
      : null;

    setDisplayUrl(largestThumb ?? photo.url);

    // Nothing to upgrade to for photos that predate the resize function.
    if (!largestThumb) return;

    let cancelled = false;
    const full = new Image();
    full.src = photo.url;

    // decode() resolves only once the pixels are ready to paint, so the swap
    // never trades a sharp thumbnail for an empty frame. The zoom and magnifier
    // read whatever is showing, so they sharpen as soon as this lands.
    full
      .decode()
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) setDisplayUrl(photo.url);
      });

    return () => {
      cancelled = true;
    };
  }, [photo]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      // Reset zoom state when modal closes
      setIsZoomed(false);
      setShowMagnifier(false);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !containerRef.current || isZoomed) return;

    const imageRect = imageRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Position relative to container (for magnifier bubble placement)
    setMousePos({ x: e.clientX - containerRect.left, y: e.clientY - containerRect.top });

    // Position relative to image (for calculating zoomed background position)
    setImageMousePos({ x: e.clientX - imageRect.left, y: e.clientY - imageRect.top });
  };

  const handleMouseEnter = () => {
    if (!isZoomed) {
      setShowMagnifier(true);
    }
  };

  const handleMouseLeave = () => {
    setShowMagnifier(false);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    if (isZoomed) {
      // Second click: reset zoom
      setIsZoomed(false);
      setShowMagnifier(true);
    } else {
      // First click: zoom to magnified area
      const imageRect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - imageRect.left) / imageRect.width) * 100;
      const y = ((e.clientY - imageRect.top) / imageRect.height) * 100;

      setZoomCenter({ x, y });
      setIsZoomed(true);
      setShowMagnifier(false);
    }
  };

  const handleDelete = async () => {
    if (!photo || !isAdmin()) return;

    const confirmed = window.confirm('Are you sure you want to delete this photo? This action cannot be undone.');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Failed to get access token. Please try logging in again.');
        return;
      }

      await deletePhoto(photo.blobName, token);
      onClose();
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('Failed to delete photo. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const magnifierSize = 220;
  const zoomLevel = 2.5;
  // Offset the magnifier so it doesn't obscure what you're looking at
  const magnifierOffset = { x: 30, y: -30 }; // Positioned to the right and above cursor

  return (
    <div className="photo-modal-backdrop" onClick={handleBackdropClick}>
      <div className="photo-modal">
        <button className="photo-modal-close" onClick={onClose}>
          ×
        </button>

        {isAdmin() && (
          <button
            className="photo-modal-delete"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete photo"
          >
            {isDeleting ? '...' : '🗑️'}
          </button>
        )}

        <div className="photo-modal-content">
          <div
            ref={containerRef}
            className="photo-modal-image-container"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleImageClick}
          >
            <img
              ref={imageRef}
              src={displayUrl}
              alt="Full size photo"
              className={`photo-modal-image ${isZoomed ? 'zoomed' : ''}`}
              style={isZoomed ? {
                transform: `scale(2.5)`,
                transformOrigin: `${zoomCenter.x}% ${zoomCenter.y}%`,
                transition: 'transform 0.3s ease'
              } : {
                transition: 'transform 0.3s ease'
              }}
            />

            {showMagnifier && !isZoomed && imageRef.current && (
              <div
                className="magnifier-bubble"
                style={{
                  left: `${mousePos.x + magnifierOffset.x}px`,
                  top: `${mousePos.y + magnifierOffset.y}px`,
                  width: `${magnifierSize}px`,
                  height: `${magnifierSize}px`,
                  backgroundImage: `url(${displayUrl})`,
                  backgroundSize: `${imageRef.current.width * zoomLevel}px ${imageRef.current.height * zoomLevel}px`,
                  backgroundPosition: `-${imageMousPos.x * zoomLevel - magnifierSize / 2}px -${imageMousPos.y * zoomLevel - magnifierSize / 2}px`,
                }}
              />
            )}
          </div>

          {photo?.description && (
            <div className="photo-modal-sidebar">
              <div className="photo-modal-description">
                <p>{photo.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoModal;