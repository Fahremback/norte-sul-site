



import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import apiService from '../../services/apiService';
import { PhotoIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import type { ImageUploadFieldProps } from '../../types';

// FIX: Corrected prop name from `onImageUploaded` to `onChange` to match `ImageUploadFieldProps` type.
const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ onChange, value, label = "Foto" }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl);

    setIsUploading(true);
    try {
      const response = await apiService.uploadImage(file);
      // FIX: Corrected prop name from `onImageUploaded` to `onChange` to match `ImageUploadFieldProps` type.
      onChange(response.imageUrl); // Only URL is needed now
    } catch (error) {
      alert(`Erro no upload: ${(error as Error).message}`);
      setPreview(value || null); // Revert on error
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(localPreviewUrl);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center border overflow-hidden">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
          ) : (
            <PhotoIcon className="w-10 h-10 text-gray-400" />
          )}
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
            {isUploading ? 'Enviando...' : 'Fazer Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadField;