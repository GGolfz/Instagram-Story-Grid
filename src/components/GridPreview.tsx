import { useRef, useEffect, useState } from 'react';
import type { GridImage, GridConfig } from '../types';

interface GridPreviewProps {
  images: GridImage[];
  config: GridConfig;
  onImageClick: (index: number) => void;
}

interface GridCellProps {
  image: GridImage | null;
  index: number;
  previewCellSize: { width: number; height: number } | null;
  onClick: (index: number) => void;
}

function GridCell({ image, index, previewCellSize, onClick }: GridCellProps) {
  // Scale pan values from editor preview size to grid cell size
  // Editor preview is typically ~400-600px, grid cells are much smaller
  // We need to scale pan values proportionally
  let scaledPanX = image?.panX || 0;
  let scaledPanY = image?.panY || 0;
  
  if (image && previewCellSize) {
    // Estimate editor preview size (typical size is around 500px)
    // This is an approximation - the actual editor preview size varies
    const estimatedEditorSize = 500;
    
    // Scale pan values based on cell size to editor size ratio
    // Smaller cells need smaller pan values
    const scaleFactor = Math.min(previewCellSize.width, previewCellSize.height) / estimatedEditorSize;
    
    scaledPanX = (image.panX || 0) * scaleFactor;
    scaledPanY = (image.panY || 0) * scaleFactor;
  }

  return (
    <div
      className={`grid-cell ${!image ? 'empty' : ''}`}
      onClick={() => image && onClick(index)}
    >
      {image ? (
        <>
          <div className="grid-cell-image-wrapper">
            <img
              src={image.preview}
              alt={`Grid cell ${index + 1}`}
              style={{
                transform: `translate(-50%, -50%) scale(${image.zoom || 1}) translate(${scaledPanX}px, ${scaledPanY}px)`,
              }}
            />
          </div>
          <div className="cell-overlay">
            <span className="cell-index">{index + 1}</span>
            <span className="cell-hint">Click to edit</span>
          </div>
        </>
      ) : (
        <div className="empty-cell">
          <span>Empty</span>
        </div>
      )}
    </div>
  );
}

function GridPreviewInner({
  images,
  config,
  onImageClick,
}: GridPreviewProps) {
  const totalCells = config.columns * config.rows;
  const gridImages: (GridImage | null)[] = Array.from({ length: totalCells }, (_, i) =>
    images[i] || null
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const [previewCellSize, setPreviewCellSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const updateCellSize = () => {
      if (gridRef.current) {
        const gridRect = gridRef.current.getBoundingClientRect();
        const cellWidth = gridRect.width / config.columns;
        const cellHeight = gridRect.height / config.rows;
        setPreviewCellSize({ width: cellWidth, height: cellHeight });
      }
    };

    updateCellSize();
    const resizeObserver = new ResizeObserver(updateCellSize);
    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }
    
    window.addEventListener('resize', updateCellSize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateCellSize);
    };
  }, [config]);

  return (
    <div className="grid-preview">
      <h2>Grid Preview</h2>
      <div
        ref={gridRef}
        className="grid-container"
        style={{
          gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
          gridTemplateRows: `repeat(${config.rows}, 1fr)`,
        }}
      >
        {gridImages.map((image, index) => (
          <GridCell
            key={image?.id || `empty-${index}`}
            image={image}
            index={index}
            previewCellSize={previewCellSize}
            onClick={onImageClick}
          />
        ))}
      </div>
      <p className="preview-hint">
        Images are arranged in the order shown in thumbnails • Click on an image to zoom and adjust position
      </p>
    </div>
  );
}

export default function GridPreview(props: GridPreviewProps) {
  return <GridPreviewInner {...props} />;
}
