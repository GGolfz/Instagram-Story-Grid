import { useState, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import GridConfig from './components/GridConfig';
import ImageUpload from './components/ImageUpload';
import GridPreview from './components/GridPreview';
import ImageEditor from './components/ImageEditor';
import { exportGridToImage } from './utils/canvasExport';
import type { GridImage, GridConfig as GridConfigType } from './types';
import './App.css';

function App() {
  const [config, setConfig] = useState<GridConfigType>({ columns: 4, rows: 4 });
  const [images, setImages] = useState<GridImage[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const totalCells = useMemo(() => config.columns * config.rows, [config]);

  const handleConfigChange = (newConfig: GridConfigType) => {
    setConfig(newConfig);
    const newTotalCells = newConfig.columns * newConfig.rows;
    // Trim images if new grid is smaller
    if (images.length > newTotalCells) {
      setImages(images.slice(0, newTotalCells));
    }
    // Close editor if open
    setEditingIndex(null);
  };

  const handleImagesSelected = (newImages: GridImage[]) => {
    // If we already have images, append new ones, otherwise replace
    if (images.length > 0) {
      setImages([...images, ...newImages].slice(0, totalCells));
    } else {
      setImages(newImages.slice(0, totalCells));
    }
  };

  const handleImageReorder = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImages(newImages);
  };

  const handleImageRemove = (index: number) => {
    const imageToRemove = images[index];
    // Revoke object URL to prevent memory leak
    if (imageToRemove?.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    // Remove image from array
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    // Close editor if the removed image was being edited
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      // Adjust editing index if an image before the edited one was removed
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleImageClick = (index: number) => {
    setEditingIndex(index);
  };

  const handleImageEditorSave = (updates: { zoom: number; panX: number; panY: number }) => {
    if (editingIndex === null) return;
    const newImages = [...images];
    newImages[editingIndex] = {
      ...newImages[editingIndex],
      ...updates,
    };
    setImages(newImages);
    setEditingIndex(null);
  };

  const handleExport = async () => {
    if (images.length !== totalCells) {
      alert(`Please upload exactly ${totalCells} images`);
      return;
    }
    try {
      await exportGridToImage(images, config);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export image. Please try again.');
    }
  };

  const canExport = images.length === totalCells;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <header className="app-header">
          <h1>Instagram Story Grid Creator</h1>
          <p>Create beautiful grid layouts for your Instagram stories</p>
        </header>

        <main className="app-main">
          <section className="app-section">
            <GridConfig config={config} onChange={handleConfigChange} />
          </section>

          <section className="app-section">
            <ImageUpload
              onImagesSelected={handleImagesSelected}
              onImageReorder={handleImageReorder}
              onImageRemove={handleImageRemove}
              requiredCount={totalCells}
              currentImages={images}
            />
          </section>

          {images.length > 0 && (
            <section className="app-section">
              <GridPreview
                images={images}
                config={config}
                onImageClick={handleImageClick}
              />
            </section>
          )}

          {canExport && (
            <section className="app-section">
              <button className="export-button" onClick={handleExport}>
                Download Instagram Story
              </button>
            </section>
          )}

          {editingIndex !== null && images[editingIndex] && (
            <ImageEditor
              image={images[editingIndex]}
              onSave={handleImageEditorSave}
              onClose={() => setEditingIndex(null)}
            />
          )}
        </main>
      </div>
    </DndProvider>
  );
}

export default App;
