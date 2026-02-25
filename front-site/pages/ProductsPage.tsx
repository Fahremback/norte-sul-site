
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Product } from '../types';
import { fetchProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import SectionTitle from '../components/SectionTitle';
import Button from '../components/Button';
import ProductCardSkeleton from '../components/ProductCardSkeleton';

const ProductsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const { data: allProducts = [], isLoading, error, refetch } = useQuery<Product[], Error>({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  const filteredProducts = useMemo(() => {
    let currentProducts = [...allProducts];
    if (selectedCategory !== 'Todos') {
      currentProducts = currentProducts.filter(product => product.category === selectedCategory);
    }
    if (searchTerm) {
      currentProducts = currentProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return currentProducts;
  }, [searchTerm, selectedCategory, allProducts]);

  const categories = useMemo(() => {
    const productCategories = allProducts.map(p => p.category).filter((c): c is string => !!c);
    return ['Todos', ...new Set(productCategories)];
  }, [allProducts]);

  return (
    <div className="py-8">
      <SectionTitle title="Nossos Produtos" subtitle="Tecnologia e acessórios para facilitar sua vida e conectar você ao mundo." />
      
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-background-card rounded-lg shadow-md border border-border-light">
        <input 
          type="text"
          placeholder="Buscar por nome ou descrição..."
          aria-label="Buscar produtos"
          className="w-full sm:flex-grow p-3 rounded-md bg-gray-50 text-text-body border border-border-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none placeholder-text-muted transition-shadow focus:shadow-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="relative w-full sm:w-auto sm:min-w-[200px]">
          <select
            aria-label="Selecionar categoria do produto"
            className="w-full p-3 rounded-md bg-gray-50 text-text-body border border-border-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none appearance-none pr-10 transition-shadow focus:shadow-md"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((category: string) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
            <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.516 7.548l4.484 4.484 4.484-4.484z"/></svg>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
          {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center py-10 bg-red-50 p-6 rounded-lg border border-red-200">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 text-xl mt-4 mb-2 font-semibold">Oops! Algo deu errado.</p>
          <p className="text-text-muted mb-4">{error.message}</p>
          <Button onClick={() => refetch()} variant="primary" size="md">Tentar Novamente</Button>
        </div>
      )}

      {!isLoading && !error && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {!isLoading && !error && filteredProducts.length === 0 && (
        <div className="text-center py-10 bg-yellow-50 p-6 rounded-lg border border-yellow-200">
           <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7H7m3 0V4m0 3v3m0-3h3m-3 0H7m3 0V4m0 3v3m0-3h3m-3 0H7" />
          </svg>
          <p className="text-yellow-700 text-xl mt-4 mb-2 font-semibold">Nenhum produto encontrado.</p>
          <p className="text-text-muted">
            {searchTerm || selectedCategory !== 'Todos' ? "Tente ajustar seus filtros de busca ou categoria." : "Parece que não há produtos cadastrados no momento."}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;