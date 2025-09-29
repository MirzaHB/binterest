import React, { useEffect } from 'react';
import { PhotoMetadata } from '../../api/photo-api';
import './PhotoModal.css';

interface PhotoModalProps {
  photo: PhotoMetadata | null;
  isOpen: boolean;
  onClose: () => void;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ photo, isOpen, onClose }) => {

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
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="photo-modal-backdrop" onClick={handleBackdropClick}>
      <div className="photo-modal">
        <button className="photo-modal-close" onClick={onClose}>
          ×
        </button>

        <div className="photo-modal-content">
          <div className="photo-modal-image-container">
            <img src={photo?.url || ''} alt="Full size photo" className="photo-modal-image" />
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