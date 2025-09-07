import React, { useCallback, useRef, useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon } from './Icons';

interface DecorImageManagerProps {
  images: File[];
  onImagesChange: (files: File[]) => void;
}

export const DecorImageManager: React.FC<DecorImageManagerProps> = ({ images, onImagesChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const newPreviews = images.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);

    return () => {
      newPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [images]);


  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length) {
      const validFiles = files.filter(file => 
        ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 4 * 1024 * 1024
      );
      
      onImagesChange([...images, ...validFiles]);
    }
    if(event.target) {
      event.target.value = '';
    }
  }, [images, onImagesChange]);

  const handleRemoveImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <h3 className="block text-sm font-medium text-gray-300 mb-2">Decor Items ({images.length})</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {previews.map((previewUrl, index) => (
          <div key={index} className="relative group aspect-square">
            <img
              src={previewUrl}
              alt={`Decor item ${index + 1}`}
              className="w-full h-full object-cover rounded-lg border border-white/20"
            />
            <button
              onClick={() => handleRemoveImage(index)}
              className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label={`Remove item ${index + 1}`}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={triggerFileInput}
          className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 hover:border-gray-500 transition-colors text-gray-400"
          aria-label="Add decor item"
        >
          <PlusIcon className="w-8 h-8 mb-2" />
          <span className="text-sm font-semibold">Add Item</span>
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
      />
       <p className="text-xs text-gray-500 mt-2">You can add multiple items. Max 4MB per image.</p>
    </div>
  );
};