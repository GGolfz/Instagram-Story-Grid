import { useState, useEffect, useRef } from 'react';
import type { GridImage } from '../types';

interface ImageEditorProps {
  image: GridImage;
  onSave: (updates: { zoom: number; panX: number; panY: number }) => void;
  onClose: () => void;
}


function getDistance(touch1: React.Touch, touch2: React.Touch): number {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getCenter(touch1: React.Touch, touch2: React.Touch): { x: number; y: number } {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  };
}

export default function ImageEditor({ image, onSave, onClose }: ImageEditorProps) {
  const [zoom, setZoom] = useState(image.zoom || 1);
  const [panX, setPanX] = useState(image.panX || 0);
  const [panY, setPanY] = useState(image.panY || 0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pinchStart, setPinchStart] = useState({ distance: 0, zoom: 1, center: { x: 0, y: 0 }, pan: { x: 0, y: 0 } });
  const previewRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setZoom(image.zoom || 1);
    setPanX(image.panX || 0);
    setPanY(image.panY || 0);
  }, [image]);



  const getEventCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const coords = getEventCoordinates(e);
    setIsDragging(true);
    setDragStart({ x: coords.x - panX, y: coords.y - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      const coords = getEventCoordinates(e);
      setPanX(coords.x - dragStart.x);
      setPanY(coords.y - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Pinch gesture
      setIsPinching(true);
      setIsDragging(false);
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = getDistance(touch1, touch2);
      const center = getCenter(touch1, touch2);
      
      setPinchStart({
        distance,
        zoom,
        center,
        pan: { x: panX, y: panY },
      });
    } else if (e.touches.length === 1) {
      // Single touch - pan
      setIsPinching(false);
      const coords = getEventCoordinates(e);
      setIsDragging(true);
      setDragStart({ x: coords.x - panX, y: coords.y - panY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2 && isPinching) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = getDistance(touch1, touch2);
      const center = getCenter(touch1, touch2);
      
      // Calculate zoom based on distance ratio
      const zoomRatio = distance / pinchStart.distance;
      const newZoom = Math.max(0.5, Math.min(3, pinchStart.zoom * zoomRatio));
      setZoom(newZoom);
      
      // Adjust pan to keep the pinch center stable
      const centerDeltaX = center.x - pinchStart.center.x;
      const centerDeltaY = center.y - pinchStart.center.y;
      
      setPanX(pinchStart.pan.x + centerDeltaX);
      setPanY(pinchStart.pan.y + centerDeltaY);
    } else if (e.touches.length === 1 && isDragging && !isPinching) {
      // Single touch pan
      const coords = getEventCoordinates(e);
      setPanX(coords.x - dragStart.x);
      setPanY(coords.y - dragStart.y);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 0) {
      // All touches ended
      setIsDragging(false);
      setIsPinching(false);
    } else if (e.touches.length === 1) {
      // One finger lifted, switch to pan mode
      setIsPinching(false);
      const coords = getEventCoordinates(e);
      setIsDragging(true);
      setDragStart({ x: coords.x - panX, y: coords.y - panY });
    }
  };

  const handleSave = () => {
    onSave({ zoom, panX, panY });
    onClose();
  };

  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };


  return (
    <div className="image-editor-overlay" onClick={onClose}>
      <div className="image-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h3>Edit Image</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div
          ref={previewRef}
          className="editor-preview"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="editor-image-container"
            style={{
              transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
            }}
          >
            <img 
              ref={imgRef}
              src={image.preview} 
              alt="Editor preview" 
            />
          </div>
        </div>
        <div className="editor-controls">
          <div className="editor-buttons">
            <button onClick={handleReset} className="reset-button">
              Reset
            </button>
            <button onClick={handleSave} className="save-button">
              Save Changes
            </button>
          </div>
        </div>
        <p className="editor-hint">
          Drag to reposition • Pinch to zoom (mobile) • Use slider to adjust zoom
        </p>
      </div>
    </div>
  );
}
