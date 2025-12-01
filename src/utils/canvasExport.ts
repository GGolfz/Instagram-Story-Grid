import type { GridImage, GridConfig } from '../types';

const INSTAGRAM_STORY_WIDTH = 1080;
const INSTAGRAM_STORY_HEIGHT = 1920;

export async function exportGridToImage(
  images: GridImage[],
  config: GridConfig
): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = INSTAGRAM_STORY_WIDTH;
  canvas.height = INSTAGRAM_STORY_HEIGHT;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const cellWidth = INSTAGRAM_STORY_WIDTH / config.columns;
  const cellHeight = INSTAGRAM_STORY_HEIGHT / config.rows;

  // Draw each image to its corresponding cell
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const row = Math.floor(i / config.columns);
    const col = i % config.columns;
    const x = col * cellWidth;
    const y = row * cellHeight;

    // Load image
    const img = await loadImage(image.preview);
    
    // Save context state
    ctx.save();
    
    // Clip to cell bounds
    ctx.beginPath();
    ctx.rect(x, y, cellWidth, cellHeight);
    ctx.clip();
    
    // Calculate image aspect ratio and cell aspect ratio
    const imgAspect = img.width / img.height;
    const cellAspect = cellWidth / cellHeight;
    
    // Calculate dimensions to fill cell completely (cover mode)
    // Start with base dimensions that cover the cell
    let baseWidth: number;
    let baseHeight: number;
    
    if (imgAspect > cellAspect) {
      // Image is wider - fit to height
      baseHeight = cellHeight;
      baseWidth = baseHeight * imgAspect;
    } else {
      // Image is taller - fit to width
      baseWidth = cellWidth;
      baseHeight = baseWidth / imgAspect;
    }
    
    // Apply zoom
    const zoom = image.zoom || 1;
    const drawWidth = baseWidth * zoom;
    const drawHeight = baseHeight * zoom;
    
    // Center the image, then apply pan
    let drawX = x + (cellWidth - drawWidth) / 2;
    let drawY = y + (cellHeight - drawHeight) / 2;
    
    // Apply pan offset
    // Pan values are in pixels from the preview, scale proportionally to canvas
    // We scale based on the ratio of canvas cell size to a typical preview cell size
    // For better accuracy, we'll scale pan relative to the image dimensions
    const panScaleX = drawWidth / (img.width * (zoom || 1));
    const panScaleY = drawHeight / (img.height * (zoom || 1));
    drawX += (image.panX || 0) * panScaleX * 2; // Scale factor for preview to canvas
    drawY += (image.panY || 0) * panScaleY * 2;
    
    // Draw image
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    
    // Restore context state
    ctx.restore();
  }

  // Convert canvas to blob and download
  canvas.toBlob((blob) => {
    if (!blob) {
      throw new Error('Failed to create blob');
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instagram-story-grid-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

