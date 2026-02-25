

import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import Button from './Button';
import ShoppingCartIcon from './icons/ShoppingCartIcon';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const placeholderImageUrl = `https://placehold.co/600x400/E5E7EB/4B5563?text=${encodeURIComponent(product.name)}`;
  
  return (
    <div className="bg-background-card rounded-xl shadow-lg overflow-hidden flex flex-col transform hover:scale-105 transition-transform duration-300 ease-in-out border border-border-light hover:shadow-xl h-full">
      <Link to={`/products/${product.id}`} aria-label={`Ver detalhes de ${product.name}`}>
        <img src={product.imageUrls?.[0] || placeholderImageUrl} alt={product.name} className="w-full h-48 object-cover" loading="lazy" decoding="async" />
      </Link>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-brand-primary mb-2 min-h-[3.5em]"> {/* Ensure consistent title height */}
          <Link to={`/products/${product.id}`} className="hover:underline">{product.name}</Link>
        </h3>
        <p className="text-text-muted text-sm mb-3 flex-grow min-h-[4.5em] line-clamp-3">{product.description}</p> {/* Ensure consistent description height and clamp long text */}
        <div className="mt-auto">
          <p className="text-2xl font-bold text-text-headings mb-4">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </p>
          <Link to={`/products/${product.id}`} className="w-full">
            <Button variant="primary" size="md" className="w-full flex items-center justify-center" aria-label={`Comprar ${product.name}`}>
              <ShoppingCartIcon className="w-5 h-5 mr-2" />
              Ver Detalhes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;