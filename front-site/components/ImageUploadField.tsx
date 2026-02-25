



import React, { useState, useRef, useEffect } from 'react';
import { uploadAndProcessProductImage, uploadImageOnly } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import Button from './Button';
import PhotoIcon from './icons/PhotoIcon';
import DocumentArrowUpIcon from './icons/DocumentArrowUpIcon';
import { Product } from '../types';

interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  onChange: (data: { imageUrl: string } & Partial<Product>) => void;
  aiProcessing?: boolean;
}


const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ label, value, onChange, aiProcessing = true }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    setPreview(value);
  }, [value]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        addToast('Por favor, selecione um arquivo de imagem válido.', 'error');
        return;
    }

    setUploading(true);
    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl);

    try {
        let response;
        if (aiProcessing) {
            response = await uploadAndProcessProductImage(file);
            addToast('Imagem enviada com sucesso e processada com IA!', 'success');
        } else {
            response = await uploadImageOnly(file);
            addToast('Imagem enviada com sucesso!', 'success');
        }
        onChange(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Falha ao enviar imagem.';
        addToast(errorMessage, 'error');
        setPreview(value); // Revert to original image on error
    } finally {
        setUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        URL.revokeObjectURL(localPreviewUrl);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center border border-dashed border-gray-300 overflow-hidden">
          {preview ? (
            <img src={preview} alt="Prévia" className="w-full h-full object-cover" />
          ) : (
            <PhotoIcon className="w-10 h-10 text-gray-400" />
          )}
        </div>
        <div className="flex-grow">
           <input
             type="file"
             ref={fileInputRef}
             onChange={handleFileChange}
             className="hidden"
             accept="image/*"
           />
           <Button
             type="button"
             variant="secondary"
             size="sm"
             onClick={triggerFileSelect}
             disabled={uploading}
             className="w-full flex justify-center items-center"
           >
            <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
             {uploading ? 'Enviando...' : 'Escolher Arquivo'}
           </Button>
            <p className="text-xs text-gray-500 mt-2">Faça o upload de uma imagem do seu dispositivo.</p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadField;