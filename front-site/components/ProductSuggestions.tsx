import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { fetchSuggestedProducts } from '../services/api';
import ProductCard from './ProductCard'; // Re-use ProductCard for consistent display

interface ProductSuggestionsProps {
  currentProductId?: string;
  category?: string;
  count?: number;
}

const ProductSuggestions: React.FC<ProductSuggestionsProps> = ({ currentProductId, category, count = 3 }) => {
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSuggestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const products = await fetchSuggestedProducts(currentProductId, category, count);
        setSuggestedProducts(products);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar sugestões.');
        console.error("Error fetching suggested products:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSuggestions();
  }, [currentProductId, category, count]);

  if (isLoading) {
    return (
        <div className="py-6">
            <div className="animate-pulse flex space-x-4">
                {[...Array(count)].map((_, i) => (
                    <div key={i} className="flex-1 space-y-4 py-1">
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    </div>
                ))}
            </div>
      </div>
    );
  }

  if (error || suggestedProducts.length === 0) {
    // Silently fail or show a minimal message if no suggestions, to not clutter the UI
    return null; 
  }

  return (
    <div className="mt-12 pt-8 border-t border-border-light">
      <h3 className="text-2xl font-semibold text-text-headings mb-6">Você também pode gostar</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
        {suggestedProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductSuggestions;
