import React, { useState, useEffect } from 'react';
import { Course, CourseCreationData, Product } from '../types';
import Button from './Button';
import { XMarkIcon } from '@heroicons/react/24/solid';
import ImageUploadField from './ImageUploadField';

interface CourseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (courseData: Course | CourseCreationData) => Promise<void>;
  courseToEdit: Course | null;
}

const CourseEditModal: React.FC<CourseEditModalProps> = ({ isOpen, onClose, onSave, courseToEdit }) => {
  const [courseData, setCourseData] = useState<Course | CourseCreationData>({
    title: '',
    description: '',
    price: 0,
    imageUrl: '',
    instructor: '',
    duration: '',
    level: 'Iniciante',
    type: 'PRESENCIAL',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { 
        if (courseToEdit) {
            setCourseData(courseToEdit);
        } else {
            setCourseData({
                title: '', description: '', price: 0, imageUrl: '', instructor: '', 
                duration: '', level: 'Iniciante', type: 'PRESENCIAL'
            });
        }
        setError(null);
    }
  }, [courseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCourseData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageDataChange = (data: { imageUrl: string } & Partial<Product>) => {
    setCourseData(prev => ({ ...prev, imageUrl: data.imageUrl }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const dataToSave = {
        ...courseData,
        price: parseFloat(String(courseData.price)) || 0,
      };
      await onSave(dataToSave);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o curso.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-semibold text-gray-800">
            {courseToEdit ? 'Editar Curso' : 'Adicionar Novo Curso'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 space-y-4">
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-md">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título do Curso</label>
                    <input type="text" name="title" id="title" value={courseData.title} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Preço</label>
                    <input type="number" name="price" id="price" value={courseData.price} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" required step="0.01" />
                </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
              <textarea name="description" id="description" value={courseData.description} onChange={handleChange} rows={3} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" />
            </div>
            
            <ImageUploadField
              label="Imagem do Curso"
              value={courseData.imageUrl || ''}
              onChange={handleImageDataChange}
            />

            <div>
                <label htmlFor="instructor" className="block text-sm font-medium text-gray-700">Instrutor(a)</label>
                <input type="text" name="instructor" id="instructor" value={courseData.instructor} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duração (ex: 40 horas)</label>
                    <input type="text" name="duration" id="duration" value={courseData.duration} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label htmlFor="level" className="block text-sm font-medium text-gray-700">Nível</label>
                    <select name="level" id="level" value={courseData.level} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm bg-white">
                        <option value="Iniciante">Iniciante</option>
                        <option value="Intermediário">Intermediário</option>
                        <option value="Avançado">Avançado</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo de Curso</label>
                    <select name="type" id="type" value={courseData.type} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm bg-white">
                        <option value="PRESENCIAL">Presencial</option>
                        <option value="GRAVADO">Gravado (Requer Aprovação)</option>
                    </select>
                </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3 sticky bottom-0 z-10">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Curso'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseEditModal;