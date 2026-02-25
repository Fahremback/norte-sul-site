

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Product, ProductQuestion, ProductReview } from '../types';
import { fetchProductById, hasPurchased, postQuestion, postReview } from '../services/api';
import Button from '../components/Button';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import ProductSuggestions from '../components/ProductSuggestions';
import NotFoundPage from './NotFoundPage';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import StarIcon from '../components/icons/StarIcon';
import TruckIcon from '../components/icons/TruckIcon';
import ArrowUturnLeftIcon from '../components/icons/ArrowUturnLeftIcon';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import ShareIcon from '../components/icons/ShareIcon';

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, cartItems } = useCart();
  const { addToast } = useToast();
  const { isAuthenticated, currentUser } = useAuth();
  const [userHasPurchased, setUserHasPurchased] = useState(false);
  
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, title: '', comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const loadProductData = async () => {
      if (!productId) {
        setError("ID do produto não fornecido.");
        setIsLoading(false);
        setProduct(null);
        return;
      }
      setIsLoading(true);
      setError(null);
      setQuantity(1);
      try {
        const productData = await fetchProductById(productId);
        setProduct(productData || null);
        if (productData?.imageUrls?.length) {
            setActiveImage(productData.imageUrls[0]);
        }
        if (isAuthenticated && productData) {
            const purchaseStatus = await hasPurchased(productId);
            setUserHasPurchased(purchaseStatus.hasPurchased);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => {
    loadProductData();
  }, [productId, isAuthenticated]);
  
  const handleAddToCart = () => {
    if (!isAuthenticated) {
        addToast("Você precisa estar logado para adicionar itens ao carrinho.", "warning");
        navigate('/', { state: { openLoginModal: true } });
        return;
    }
    if (product) {
      addToCart(product, quantity);
    }
  };

  const handleBuyNow = () => {
     if (!isAuthenticated) {
        addToast("Você precisa estar logado para finalizar a compra.", "warning");
        navigate('/', { state: { openLoginModal: true } });
        return;
    }
    if (product) {
      addToCart(product, quantity);
      navigate('/checkout');
    }
  };
  
  const handleShare = async () => {
    if (!product) return;
    const shareData = {
      title: product.name,
      text: `Confira este produto na Norte Sul Informática: ${product.name}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        addToast('Link do produto copiado!', 'info');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      addToast('Não foi possível compartilhar o produto.', 'error');
    }
  };

  const handlePostQuestion = async () => {
    if (!product || !newQuestion.trim()) return;
    setIsSubmittingQuestion(true);
    try {
        await postQuestion(product.id, newQuestion);
        addToast("Pergunta enviada!", "success");
        setNewQuestion('');
        await loadProductData(); // Recarregar dados para ver a nova pergunta
    } catch (err) {
        addToast(err instanceof Error ? err.message : 'Falha ao enviar pergunta.', 'error');
    } finally {
        setIsSubmittingQuestion(false);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || newReview.rating === 0 || !newReview.title.trim() || !newReview.comment.trim()) {
        addToast("Por favor, preencha a avaliação, título e comentário.", "warning");
        return;
    }
    setIsSubmittingReview(true);
    try {
        await postReview(product.id, newReview);
        addToast("Avaliação enviada com sucesso!", "success");
        setNewReview({ rating: 0, title: '', comment: '' });
        setShowReviewForm(false);
        await loadProductData();
    } catch (err) {
        addToast(err instanceof Error ? err.message : 'Falha ao enviar avaliação.', 'error');
    } finally {
        setIsSubmittingReview(false);
    }
  };


  const handleQuantityChange = (change: number) => {
    setQuantity(prevQuantity => {
      const newQuantity = prevQuantity + change;
      if (newQuantity < 1) return 1;
      if (product && product.stock && newQuantity > product.stock) return product.stock;
      return newQuantity;
    });
  };
  
  const getItemInCart = product ? cartItems.find(item => item.id === product.id) : null;
  const currentStock = product?.stock ?? Infinity;
  const availableStock = getItemInCart ? currentStock - getItemInCart.quantity : currentStock;
  const isOutOfStock = availableStock <= 0 || (product?.stock !== undefined && product.stock === 0);
  
  const averageRating = useMemo(() => {
    if (!product?.reviews || product.reviews.length === 0) return 0;
    const total = product.reviews.reduce((acc, review) => acc + review.rating, 0);
    return total / product.reviews.length;
  }, [product?.reviews]);


  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto mb-6"></div>
        <p className="text-text-muted text-xl">Carregando detalhes do produto...</p>
      </div>
    );
  }

  if (error || !product) {
    return <NotFoundPage />;
  }
  
  const placeholderImageUrl = `https://placehold.co/600x600/E5E7EB/4B5563?text=${encodeURIComponent(product.name)}`;
  const characteristics = [
      { label: 'Marca', value: product.brand },
      { label: 'Modelo', value: product.model },
      { label: 'Cor', value: product.color },
      { label: 'Potência', value: product.power },
      { label: 'Material', value: product.material },
      { label: 'Compatibilidade', value: product.compatibility },
      { label: 'Dimensões', value: product.dimensions },
      { label: 'Peso', value: product.weight },
      { label: 'Outras Specs', value: product.otherSpecs },
  ].filter(c => c.value);


  return (
    <div className="py-8 bg-background-main">
      <div className="max-w-7xl mx-auto">
        <div className="bg-background-card p-6 rounded-lg shadow-md">
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                {/* Image Column */}
                <div className="lg:col-span-4">
                    <img src={activeImage || product.imageUrls?.[0] || placeholderImageUrl} alt={product.name} className="w-full aspect-square object-contain rounded-md border p-2"/>
                    {product.imageUrls && product.imageUrls.length > 1 && (
                      <div className="flex space-x-2 mt-4 overflow-x-auto p-1">
                        {product.imageUrls.map((url, index) => (
                          <img 
                            key={index}
                            src={url} 
                            alt={`Thumbnail ${index + 1}`}
                            className={`w-16 h-16 object-cover rounded-md cursor-pointer border-2 ${activeImage === url ? 'border-brand-primary' : 'border-transparent hover:border-gray-300'}`}
                            onClick={() => setActiveImage(url)}
                          />
                        ))}
                      </div>
                    )}
                </div>

                {/* Purchase Info Column */}
                <div className="lg:col-span-4">
                    <div className="flex flex-col h-full">
                        <div>
                            <p className="text-sm text-text-muted">Novo | Mais vendido</p>
                            <h1 className="text-2xl font-semibold text-text-headings mt-1">{product.name}</h1>
                             <div className="flex items-center mt-2 space-x-1">
                                {[...Array(5)].map((_, i) => <StarIcon key={i} className={`w-5 h-5 ${i < Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`} />)}
                                {product.reviews && product.reviews.length > 0 && <span className="text-sm text-text-muted ml-2">({product.reviews.length} avaliações)</span>}
                            </div>
                        </div>

                        <div className="my-4">
                            <span className="text-4xl font-bold text-text-headings">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                        
                         <div className="text-sm space-y-2 text-text-body">
                            <p>Sobre este item:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2 text-xs">
                                {product.brand && <li>Marca: {product.brand}</li>}
                                {product.model && <li>Modelo: {product.model}</li>}
                                {product.color && <li>Cor: {product.color}</li>}
                            </ul>
                        </div>
                    </div>
                </div>
                
                {/* Action Box */}
                <div className="lg:col-span-2">
                    <div className="border rounded-md p-4 space-y-4">
                        <div className="flex items-center gap-2">
                           <TruckIcon className="w-6 h-6 text-brand-primary"/>
                           <p className="text-sm text-brand-primary font-medium">Frete Grátis</p>
                        </div>
                        <p className="text-sm text-text-muted">Chegará grátis amanhã.</p>
                        <p className={`font-semibold ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>{isOutOfStock ? 'Sem estoque' : 'Em estoque'}</p>
                        
                         {!isOutOfStock && (
                            <>
                                <label htmlFor="quantity" className="block text-sm font-medium">Quantidade:</label>
                                <input type="number" id="quantity" value={quantity} onChange={(e) => setQuantity(Math.min(availableStock, Math.max(1, parseInt(e.target.value,10) || 1)))} min="1" max={availableStock} className="w-20 p-1 border rounded-md" />
                            </>
                        )}
                        
                        <Button variant="primary" size="lg" onClick={handleBuyNow} disabled={isOutOfStock} className="w-full">Comprar agora</Button>
                        <Button variant="outline" size="lg" onClick={handleAddToCart} disabled={isOutOfStock} className="w-full">Adicionar ao carrinho</Button>
                        <Button variant="outline" size="lg" onClick={handleShare} className="w-full flex justify-center items-center">
                            <ShareIcon className="w-5 h-5 mr-2" />
                            Compartilhar
                        </Button>
                        
                         <div className="text-sm space-y-3 pt-3 border-t">
                            <p>Vendido por <Link to="/" className="text-blue-600 hover:underline">{product.brand || 'Norte Sul'}</Link></p>
                             <div className="flex gap-2">
                                <ArrowUturnLeftIcon className="w-5 h-5 text-gray-500"/>
                                <p>Devolução grátis</p>
                            </div>
                            <div className="flex gap-2">
                                <ShieldCheckIcon className="w-5 h-5 text-gray-500"/>
                                <p>Compra Garantida</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Characteristics Section */}
        {characteristics.length > 0 && (
            <div className="bg-background-card p-6 rounded-lg shadow-md mt-6">
                <h2 className="text-2xl font-semibold mb-4">Características Principais</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    {characteristics.map(char => (
                        <div key={char.label} className="grid grid-cols-2 p-2 rounded odd:bg-gray-50">
                            <span className="font-semibold text-text-body">{char.label}</span>
                            <span className="text-text-muted">{char.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Description Section */}
        <div className="bg-background-card p-6 rounded-lg shadow-md mt-6">
            <h2 className="text-2xl font-semibold mb-4">Descrição</h2>
            <p className="text-text-body leading-relaxed whitespace-pre-wrap">{product.description}</p>
        </div>

        {/* Questions Section */}
        <div className="bg-background-card p-6 rounded-lg shadow-md mt-6">
            <h2 className="text-2xl font-semibold mb-4">Perguntas e Respostas</h2>
            {isAuthenticated ? (
                <div className="mb-6">
                    <textarea value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="Escreva sua pergunta aqui..." rows={3} className="w-full p-2 border rounded-md"></textarea>
                    <Button onClick={handlePostQuestion} disabled={isSubmittingQuestion} className="mt-2">{isSubmittingQuestion ? "Enviando..." : "Perguntar"}</Button>
                </div>
            ) : <p className="text-sm text-text-muted mb-4">Faça login para perguntar.</p>}
            <div className="space-y-4">
                {product.questions && product.questions.length > 0 ? product.questions.map(q => (
                    <div key={q.id}>
                        <p className="font-semibold">P: {q.question}</p>
                        {q.answer && <p className="text-text-muted ml-4">R: {q.answer}</p>}
                    </div>
                )) : <p className="text-sm text-text-muted">Ainda não há perguntas. Seja o primeiro!</p>}
            </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-background-card p-6 rounded-lg shadow-md mt-6">
            <h2 className="text-2xl font-semibold mb-4">Avaliações dos clientes</h2>
            {product.reviews && product.reviews.length > 0 && (
                <div className="mb-6 flex items-center gap-4">
                    <p className="text-4xl font-bold text-yellow-500">{averageRating.toFixed(1)}</p>
                    <div className="flex items-center">
                        {[...Array(5)].map((_, i) => <StarIcon key={i} className={`w-6 h-6 ${i < Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`} />)}
                    </div>
                    <p className="text-text-muted">{product.reviews.length} avaliações</p>
                </div>
            )}
            
            {userHasPurchased && !showReviewForm && (
                <Button onClick={() => setShowReviewForm(true)} variant="outline" className="mb-4">Escrever uma avaliação</Button>
            )}

            {showReviewForm && (
                <form onSubmit={handlePostReview} className="mb-6 p-4 border rounded-md space-y-3">
                    <h3 className="font-semibold">Sua avaliação</h3>
                     <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(star => (
                           <button type="button" key={star} onClick={() => setNewReview(prev => ({...prev, rating: star}))}>
                                <StarIcon className={`w-7 h-7 cursor-pointer ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                           </button>
                        ))}
                    </div>
                    <input type="text" value={newReview.title} onChange={e => setNewReview(prev => ({...prev, title: e.target.value}))} placeholder="Título da sua avaliação" required className="w-full p-2 border rounded-md"/>
                    <textarea value={newReview.comment} onChange={e => setNewReview(prev => ({...prev, comment: e.target.value}))} placeholder="Escreva seu comentário aqui..." rows={4} required className="w-full p-2 border rounded-md"></textarea>
                    <div className="flex gap-2">
                        <Button type="submit" disabled={isSubmittingReview}>{isSubmittingReview ? 'Enviando...' : 'Enviar Avaliação'}</Button>
                        <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)}>Cancelar</Button>
                    </div>
                </form>
            )}
            
            <div className="space-y-6">
                {product.reviews && product.reviews.length > 0 ? product.reviews.map(review => (
                    <div key={review.id} className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => <StarIcon key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} />)}
                            </div>
                            <p className="font-semibold text-text-headings">{review.title}</p>
                        </div>
                         <p className="text-sm text-text-muted mb-2">Avaliado em {new Date(review.createdAt).toLocaleDateString('pt-BR')} por {review.user.name}</p>
                        <p className="text-text-body">{review.comment}</p>
                    </div>
                )) : <p className="text-sm text-text-muted">Este produto ainda não tem avaliações.</p>}
            </div>
        </div>

        <ProductSuggestions currentProductId={product.id} category={product.category || undefined} />
      </div>
    </div>
  );
};

export default ProductDetailPage;