import { useRef, useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { GridImage } from '../types';

interface ImageUploadProps {
  onImagesSelected: (images: GridImage[]) => void;
  onImageReorder: (fromIndex: number, toIndex: number) => void;
  onImageRemove: (index: number) => void;
  requiredCount: number;
  currentImages: GridImage[];
}

function DraggableThumbnail({ 
  image, 
  index,
  onReorder,
  onRemove
}: { 
  image: GridImage; 
  index: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (index: number) => void;
}) {
  const [{ isDragging }, drag] = useDrag({
    type: 'thumbnail-image',
    item: { image, sourceIndex: index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'thumbnail-image',
    drop: (item: { image: GridImage; sourceIndex: number }) => {
      if (item.sourceIndex !== index) {
        onReorder(item.sourceIndex, index);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const thumbnailRef = useCallback(
    (node: HTMLDivElement | null) => {
      drag(drop(node));
    },
    [drag, drop]
  );

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(index);
  };

  return (
    <div
      ref={thumbnailRef as any}
      className={`thumbnail ${isDragging ? 'dragging' : ''} ${isOver ? 'drag-over' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }}
    >
      <img src={image.preview} alt={`Preview ${index + 1}`} />
      <span className="thumbnail-index">{index + 1}</span>
      <button 
        className="thumbnail-remove" 
        onClick={handleRemove}
        title="Remove image"
        aria-label="Remove image"
      >
        ×
      </button>
    </div>
  );
}

export default function ImageUpload({
  onImagesSelected,
  onImageReorder,
  onImageRemove,
  requiredCount,
  currentImages,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    
    const newImages: GridImage[] = imageFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
      zoom: 1,
      panX: 0,
      panY: 0,
    }));

    onImagesSelected(newImages);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const remainingCount = requiredCount - currentImages.length;
  const canUpload = requiredCount > 0;

  return (
    <div className="image-upload">
      <h2>Upload Images</h2>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <button
        onClick={handleClick}
        disabled={!canUpload}
        className="upload-button"
      >
        {currentImages.length === 0
          ? 'Select Images from Gallery'
          : `Add More Images (${remainingCount} needed)`}
      </button>
      {currentImages.length > 0 && (
        <div className="upload-status">
          <p>
            {currentImages.length} of {requiredCount} images selected
          </p>
          {currentImages.length < requiredCount && (
            <p className="warning">
              Please select {remainingCount} more image{remainingCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
      {currentImages.length > 0 && (
        <div className="image-thumbnails">
          <p className="thumbnails-hint">Drag images to reorder them • Click × to remove</p>
          {currentImages.map((image, index) => (
            <DraggableThumbnail 
              key={image.id} 
              image={image} 
              index={index}
              onReorder={onImageReorder}
              onRemove={onImageRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
