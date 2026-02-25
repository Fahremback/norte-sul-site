

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product, Omit } from '../types';
import Button from './Button';
import { XMarkIcon, PencilIcon, TrashIcon, DocumentArrowUpIcon } from '@heroicons/react/24/solid';
import ImageUploadField from './ImageUploadField';
import { uploadImageOnly, uploadAndProcessProductImage, addMultipleProducts } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import PlusCircleIcon from './icons/PlusCircleIcon';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Product | Omit<Product, 'id' | 'createdAt'> | Omit<Product, 'id' | 'createdAt'>[]) => Promise<void>;
  productToEdit: Product | null;
  existingCategories?: string[];
}

interface DraftProduct extends Omit<Product, 'id' | 'createdAt' | 'price' | 'imageUrls'> {
    clientId: string;
    imageFile?: File;
    previewUrl?: string;
    status: 'processing' | 'success' | 'error';
    errorMessage?: string;
    price: number | string;
    imageUrls: string[];
}

const ProductEditModal: React.FC<ProductEditModalProps> = ({ isOpen, onClose, onSave, productToEdit, existingCategories = [] }) => {
  const [productData, setProductData] = useState<Partial<Product>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  const addImagesInputRef = useRef<HTMLInputElement>(null);
  const replaceImageInputRef = useRef<HTMLInputElement>(null);
  const [replaceImageIndex, setReplaceImageIndex] = useState<number | null>(null);

  // === BATCH ADDITION STATE ===
  const [drafts, setDrafts] = useState<DraftProduct[]>([]);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setProductData({ ...productToEdit, imageUrls: productToEdit.imageUrls || [] });
      } else {
        // Reset state for batch mode
        setDrafts([]);
        setIsProcessingBatch(false);
        setProductData({});
      }
      setError(null);
    }
  }, [productToEdit, isOpen]);

  // === BATCH ADDITION LOGIC ===
  const handleBatchFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newDrafts: DraftProduct[] = Array.from(files).map(file => ({
        clientId: crypto.randomUUID(),
        imageFile: file,
        previewUrl: URL.createObjectURL(file),
        status: 'processing',
        name: file.name.split('.')[0].replace(/[-_]/g, ' '),
        description: '',
        price: '',
        imageUrls: [],
        category: null,
        stock: 0
    }));

    setDrafts(prev => [...prev, ...newDrafts]);
    
    // Process files one by one
    newDrafts.forEach(draft => processSingleDraft(draft));
  };
  
  const processSingleDraft = async (draft: DraftProduct) => {
    if (!draft.imageFile) return;
    try {
      const result = await uploadAndProcessProductImage(draft.imageFile);
      setDrafts(prev => prev.map(d => d.clientId === draft.clientId ? {
        ...d,
        status: 'success',
        name: result.name || d.name,
        description: result.description || '',
        category: result.category || null,
        imageUrls: [result.imageUrl],
        brand: result.brand,
        model: result.model,
        color: result.color,
        power: result.power,
        dimensions: result.dimensions,
        weight: result.weight,
        compatibility: result.compatibility,
        otherSpecs: result.otherSpecs,
      } : d));
    } catch (err) {
      setDrafts(prev => prev.map(d => d.clientId === draft.clientId ? {
        ...d,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Falha no processamento com IA.'
      } : d));
    }
  };

  const handleDraftChange = (clientId: string, field: keyof DraftProduct, value: any) => {
    setDrafts(prev => prev.map(d => d.clientId === clientId ? { ...d, [field]: value } : d));
  };
  
  const handleRemoveDraft = (clientId: string) => {
    setDrafts(prev => prev.filter(d => d.clientId !== clientId));
  };

  const handleSaveBatch = async () => {
    const validDrafts = drafts.filter(d => d.name && d.status === 'success');
    if(validDrafts.length !== drafts.length) {
        if(!window.confirm("Alguns produtos têm erros ou ainda estão sendo processados. Deseja salvar apenas os produtos concluídos?")) {
            return;
        }
    }

    if (validDrafts.length === 0) {
        addToast("Nenhum produto pronto para salvar.", "warning");
        return;
    }

    setIsSaving(true);
    try {
        const productsToSave = validDrafts.map(d => ({
            name: d.name,
            description: d.description,
            price: Number(d.price) || 0,
            imageUrls: d.imageUrls,
            category: d.category,
            stock: Number(d.stock) || 0,
            sku: d.sku,
            brand: d.brand,
            model: d.model,
            color: d.color,
            power: d.power,
            dimensions: d.dimensions,
            weight: d.weight,
            material: d.material,
            compatibility: d.compatibility,
            otherSpecs: d.otherSpecs
        }));
        await onSave(productsToSave);
        addToast(`${productsToSave.length} produto(s) salvos com sucesso!`, 'success');
        onClose();
    } catch(err) {
        setError(err instanceof Error ? err.message : "Não foi possível salvar os produtos.");
    } finally {
        setIsSaving(false);
    }
  };
  

  // === SINGLE EDIT LOGIC ===
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  const handleInitialImageDataChange = (data: { imageUrl: string; } & Partial<Product>) => {
    setProductData(prev => ({
        ...prev,
        imageUrls: data.imageUrl ? [data.imageUrl] : [],
        name: prev.name || data.name || '',
        description: prev.description || data.description || '',
    }));
  };

  const handleAddNewImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    const uploadPromises = Array.from(files).map(file => uploadImageOnly(file).catch(err => ({ error: err })));
    
    const results = await Promise.all(uploadPromises);
    const newUrls = results.filter(res => 'imageUrl' in res).map(res => (res as { imageUrl: string }).imageUrl);

    if(newUrls.length > 0) {
        setProductData(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), ...newUrls] }));
        addToast(`${newUrls.length} imagem(ns) adicionada(s).`, 'success');
    }
    
    if (newUrls.length < files.length) addToast('Algumas imagens não puderam ser enviadas.', 'error');
    setIsUploading(false);
  };

  const handleReplaceImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || replaceImageIndex === null) return;

    setIsUploading(true);
    try {
        const { imageUrl } = await uploadImageOnly(file);
        setProductData(prev => {
            const newImageUrls = [...(prev.imageUrls || [])];
            newImageUrls[replaceImageIndex] = imageUrl;
            return { ...prev, imageUrls: newImageUrls };
        });
        addToast('Imagem substituída com sucesso.', 'success');
    } catch (err) {
        addToast(err instanceof Error ? err.message : "Falha ao trocar a imagem.", "error");
    } finally {
        setIsUploading(false);
        setReplaceImageIndex(null);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setProductData(prev => ({
        ...prev,
        imageUrls: (prev.imageUrls || []).filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const dataToSave = {
        ...productData,
        price: parseFloat(String(productData.price)) || 0,
        stock: parseInt(String(productData.stock), 10) || 0,
      };
      await onSave(dataToSave as Product | Omit<Product, 'id' | 'createdAt'>);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o produto.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // === RENDER LOGIC ===
  if (!productToEdit) {
    // BATCH ADD MODE
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center flex-shrink-0">
              <h2 className="text-2xl font-semibold text-gray-800">Adicionar Produtos em Lote</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <div className="p-6 flex-shrink-0 border-b">
                <input type="file" ref={batchFileInputRef} onChange={handleBatchFileChange} className="hidden" accept="image/*" multiple />
                <Button type="button" variant="primary" size="md" onClick={() => batchFileInputRef.current?.click()} className="w-full">
                    <PlusCircleIcon className="w-5 h-5 mr-2"/> Selecionar Imagens para Adicionar
                </Button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-50">
            {drafts.length === 0 && <p className="text-center text-gray-500">Selecione uma ou mais imagens para começar.</p>}
            {drafts.map((draft) => (
                <div key={draft.clientId} className="bg-white p-4 rounded-lg shadow-md border grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <img src={draft.previewUrl} alt="Prévia" className="w-full h-32 object-contain rounded-md border" />
                         {draft.status === 'processing' && <div className="text-sm text-blue-600 flex items-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div> Processando com IA...</div>}
                         {draft.status === 'error' && <p className="text-sm text-red-600">{draft.errorMessage}</p>}
                         {draft.status === 'success' && <p className="text-sm text-green-600">Pronto para salvar.</p>}
                    </div>
                    <div className="space-y-3 md:col-span-2">
                        <div className="flex items-start gap-2">
                            <div className="flex-grow">
                                <label className="text-xs font-medium">Nome do Produto</label>
                                <input type="text" value={draft.name} onChange={(e) => handleDraftChange(draft.clientId, 'name', e.target.value)} className="p-2 w-full border rounded-md text-sm" />
                            </div>
                            <button onClick={() => handleRemoveDraft(draft.clientId)} className="mt-5 p-2 text-gray-400 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs font-medium">Preço (R$)</label>
                                <input type="number" value={draft.price} onChange={(e) => handleDraftChange(draft.clientId, 'price', e.target.value)} className="p-2 w-full border rounded-md text-sm" step="0.01" />
                            </div>
                             <div>
                                <label className="text-xs font-medium">Estoque</label>
                                <input type="number" value={draft.stock} onChange={(e) => handleDraftChange(draft.clientId, 'stock', e.target.value)} className="p-2 w-full border rounded-md text-sm" />
                            </div>
                             <div>
                                <label className="text-xs font-medium">Categoria</label>
                                <input type="text" value={draft.category || ''} onChange={(e) => handleDraftChange(draft.clientId, 'category', e.target.value)} className="p-2 w-full border rounded-md text-sm" list="category-suggestions"/>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            <datalist id="category-suggestions">
                {existingCategories?.map(cat => <option key={cat} value={cat} />)}
            </datalist>
            </div>
            <div className="px-6 py-4 bg-gray-100 border-t flex justify-end space-x-3 flex-shrink-0">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                <Button type="button" variant="primary" onClick={handleSaveBatch} disabled={isSaving || drafts.some(d => d.status === 'processing')}>
                {isSaving ? 'Salvando...' : `Salvar ${drafts.filter(d=>d.status === 'success').length} Produtos`}
                </Button>
            </div>
        </div>
      </div>
    );
  }

  // SINGLE EDIT MODE
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 pt-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-semibold text-gray-800">
            {productToEdit ? 'Editar Produto' : 'Adicionar Novo Produto'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate className="flex-grow flex flex-col overflow-hidden">
          <div className="p-6 space-y-6 flex-grow overflow-y-auto">
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-md">{error}</div>}
            
            <div className="p-4 border rounded-md bg-gray-50 space-y-4">
              <h4 className="font-semibold text-lg text-gray-800">Informações Básicas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Produto</label>
                      <input type="text" name="name" id="name" value={productData.name || ''} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" required />
                  </div>
                  <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">Preço</label>
                      <input type="number" name="price" id="price" value={productData.price || 0} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" required step="0.01" />
                  </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea name="description" id="description" value={productData.description || ''} onChange={handleChange} rows={4} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagens do Produto</label>
                {(!productData.imageUrls || productData.imageUrls.length === 0) ? (
                    <ImageUploadField 
                        label="Imagem Principal (com IA)"
                        value={null}
                        onChange={handleInitialImageDataChange}
                    />
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                           {(productData.imageUrls || []).map((url, index) => (
                               <div key={index} className="relative group aspect-square">
                                   <img src={url} alt={`Imagem ${index + 1}`} className="w-full h-full object-cover rounded-md border" />
                                   <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
                                       <button type="button" onClick={() => { setReplaceImageIndex(index); replaceImageInputRef.current?.click(); }} className="p-2 bg-white/70 rounded-full opacity-0 group-hover:opacity-100" title="Trocar Imagem"><PencilIcon className="w-4 h-4 text-black"/></button>
                                       <button type="button" onClick={() => handleRemoveImage(index)} className="p-2 bg-white/70 rounded-full opacity-0 group-hover:opacity-100" title="Remover Imagem"><TrashIcon className="w-4 h-4 text-red-600"/></button>
                                   </div>
                               </div>
                           ))}
                           {isUploading && <div className="aspect-square flex items-center justify-center border-2 border-dashed rounded-md"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div></div>}
                        </div>
                        <input type="file" ref={addImagesInputRef} onChange={handleAddNewImages} className="hidden" accept="image/*" multiple />
                        <input type="file" ref={replaceImageInputRef} onChange={handleReplaceImage} className="hidden" accept="image/*" />
                        <Button type="button" variant="outline" size="sm" onClick={() => addImagesInputRef.current?.click()} disabled={isUploading}>
                            <DocumentArrowUpIcon className="w-4 h-4 mr-2"/> Adicionar Novas Imagens
                        </Button>
                    </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria</label>
                      <input type="text" name="category" id="category" value={productData.category || ''} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" list="category-suggestions" />
                      <datalist id="category-suggestions">
                          {existingCategories?.map(cat => <option key={cat} value={cat} />)}
                      </datalist>
                  </div>
                  <div>
                      <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Estoque</label>
                      <input type="number" name="stock" id="stock" value={productData.stock || 0} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" />
                  </div>
                  <div>
                      <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU (Cód. de Referência)</label>
                      <input type="text" name="sku" id="sku" value={productData.sku || ''} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" />
                  </div>
              </div>
            </div>

             <div className="p-4 border rounded-md bg-gray-50 space-y-4">
                <h4 className="font-semibold text-lg text-gray-800">Características Adicionais (Opcional)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Marca</label>
                        <input type="text" name="brand" id="brand" value={productData.brand || ''} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" />
                    </div>
                     <div>
                        <label htmlFor="model" className="block text-sm font-medium text-gray-700">Modelo</label>
                        <input type="text" name="model" id="model" value={productData.model || ''} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" />
                    </div>
                     <div>
                        <label htmlFor="color" className="block text-sm font-medium text-gray-700">Cor</label>
                        <input type="text" name="color" id="color" value={productData.color || ''} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" />
                    </div>
                      <div>
                        <label htmlFor="power" className="block text-sm font-medium text-gray-700">Potência (ex: 25W)</label>
                        <input type="text" name="power" id="power" value={productData.power || ''} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700">Dimensões (ex: 15cm x 7cm)</label>
                        <input type="text" name="dimensions" id="dimensions" value={productData.dimensions || ''} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" />
                    </div>
                     <div>
                        <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Peso (ex: 200g)</label>
                        <input type="text" name="weight" id="weight" value={productData.weight || ''} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" />
                    </div>
                </div>
                <div>
                    <label htmlFor="compatibility" className="block text-sm font-medium text-gray-700">Compatibilidade</label>
                    <input type="text" name="compatibility" id="compatibility" value={productData.compatibility || ''} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" />
                </div>
                 <div>
                    <label htmlFor="otherSpecs" className="block text-sm font-medium text-gray-700">Outras Especificações</label>
                    <textarea name="otherSpecs" id="otherSpecs" value={productData.otherSpecs || ''} onChange={handleChange} rows={2} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" />
                </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3 flex-shrink-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving || isUploading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving || isUploading}>
              {isSaving ? 'Salvando...' : (isUploading ? 'Enviando Imagens...' : 'Salvar Produto')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEditModal;