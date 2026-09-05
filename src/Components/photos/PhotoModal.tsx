import React, { useEffect, useState, useRef, useCallback } from 'react';
import { PhotoMetadata, deletePhoto, updatePhotoDescription } from '../../api/photo-api';
import { useAuth } from '../../auth/useAuth';
import './PhotoModal.css';

interface PhotoModalProps {
  photo: PhotoMetadata | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
  // The gallery owns the photo list and its sessionStorage cache, so a saved
  // caption has to go back up rather than living only in here.
  onDescriptionSaved?: (blobName: string, description: string | null) => void;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ photo, isOpen, onClose, onDelete, onDescriptionSaved }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [imageMousPos, setImageMousePos] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomCenter, setZoomCenter] = useState({ x: 50, y: 50 });
  const [isDeleting, setIsDeleting] = useState(false);

  // The caption rides along in the photo list, so it is already here when the
  // modal opens — no fetch, no loading state, nothing to flash.
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

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

  const canEdit = isAdmin();

  const description = photo?.description ?? null;
  const isDirty = draft !== (description ?? '');

  // A different photo means a different caption; drop any half-written draft
  // rather than carrying it across to the wrong photo.
  useEffect(() => {
    setIsEditing(false);
    setDraft('');
    setDescriptionError(null);
  }, [photo]);

  const handleStartEditing = () => {
    setDraft(description ?? '');
    setDescriptionError(null);
    setIsEditing(true);
  };

  const handleCancelEditing = useCallback(() => {
    if (isDirty && !window.confirm('Discard your unsaved changes to this description?')) return;
    setIsEditing(false);
    setDraft('');
    setDescriptionError(null);
  }, [isDirty]);

  const handleSaveDescription = async () => {
    if (!photo || !canEdit) return;

    setIsSaving(true);
    setDescriptionError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setDescriptionError('Your session expired. Please sign in again.');
        return;
      }

      // Saving an empty draft clears the caption, so this is also the delete path.
      const saved = await updatePhotoDescription(photo.blobName, draft, token);
      onDescriptionSaved?.(photo.blobName, saved);
      setIsEditing(false);
      setDraft('');
    } catch (error: any) {
      console.error('Failed to save description:', error);
      // 409 means the resize function wrote first and the retries ran out —
      // worth saying so, because trying again really does work.
      setDescriptionError(
        error?.response?.status === 409
          ? 'That photo was being updated. Please try again.'
          : 'Failed to save. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    // Closing the modal unmounts the editor, taking the draft with it
    if (isEditing && isDirty && !window.confirm('Discard your unsaved changes to this description?')) return;
    onClose();
  };

  // Escape backs out of the editor before it backs out of the modal, so it never
  // discards a draft in one keystroke.
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    if (isEditing) {
      handleCancelEditing();
      return;
    }
    onClose();
  }, [isEditing, handleCancelEditing, onClose]);

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
  }, [isOpen, handleKeyDown]);

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

        {canEdit && (
          <button
            className="photo-modal-delete"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete photo"
          >
            {isDeleting ? '...' : '🗑️'}
          </button>
        )}

        {canEdit && !isEditing && (
          <button
            className="photo-modal-edit-description"
            onClick={handleStartEditing}
            title={description ? 'Edit this description' : 'Write a description for this photo'}
          >
            ✏️
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
              alt={description || 'Full size view'}
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

          {(isEditing || description || canEdit) && (
            <div className="photo-modal-sidebar">
              {isEditing ? (
                <div className="photo-modal-description-editor">
                  <textarea
                    className="photo-modal-description-input"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Describe this photo."
                    maxLength={1000}
                    autoFocus
                    disabled={isSaving}
                  />

                  {descriptionError && <p className="photo-modal-description-error">{descriptionError}</p>}

                  <div className="photo-modal-description-actions">
                    <button
                      className="photo-modal-description-save"
                      onClick={handleSaveDescription}
                      disabled={isSaving || !isDirty}
                    >
                      {isSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      className="photo-modal-description-cancel"
                      onClick={handleCancelEditing}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Clearing the box is the only way to remove a caption, so say so */}
                  <p className="photo-modal-description-hint">
                    {draft.trim()
                      ? `${draft.length}/1000`
                      : 'Saving an empty description removes it.'}
                  </p>
                </div>
              ) : description ? (
                <div className="photo-modal-description">
                  <p>{description}</p>
                </div>
              ) : (
                // Only admins reach this branch — for everyone else the sidebar
                // is not rendered at all when there is nothing to read.
                <p className="photo-modal-description-empty">No description yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoModal;