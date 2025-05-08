import React, { useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

export function ImageModal({ imageUrl, alt, onClose }: ImageModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [handleKeyDown]);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
      onClick={handleBackgroundClick}
    >
      <div className="relative max-w-[90vw] max-h-[90vh] bg-black rounded-lg overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
        >
          <X className="h-6 w-6" />
        </button>
        
        <div className="relative">
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://dummyimage.com/64x64/cfcbcf/000000&text=Bild+Saknas';
            }}
          />
        </div>
      </div>
    </div>
  );
}