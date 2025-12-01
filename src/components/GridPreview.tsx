import type { GridImage, GridConfig } from '../types';

interface GridPreviewProps {
  images: GridImage[];
  config: GridConfig;
  onImageClick: (index: number) => void;
}

interface GridCellProps {
  image: GridImage | null;
  index: number;
  onClick: (index: number) => void;
}

function GridCell({ image, index, onClick }: GridCellProps) {
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
                transform: `translate(-50%, -50%) scale(${image.zoom || 1}) translate(${image.panX || 0}px, ${image.panY || 0}px)`,
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

  return (
    <div className="grid-preview">
      <h2>Grid Preview</h2>
      <div
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
