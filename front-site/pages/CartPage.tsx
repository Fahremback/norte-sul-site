
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import Button from '../components/Button';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import TrashIcon from '../components/icons/TrashIcon'; 
import { useCart } from '../contexts/CartContext';
import { CartItem } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';

const CartPage: React.FC = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartItemCount } = useCart();
  const navigate = useNavigate();

  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const handleUpdateQuantity = (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) {
      setConfirmationState({
        isOpen: true,
        title: 'Remover Item',
        message: `Tem certeza que deseja remover "${item.name}" do seu carrinho?`,
        onConfirm: () => removeFromCart(item.id),
      });
      return;
    }
    const maxQuantity = item.stock ?? Infinity;
    updateQuantity(item.id, Math.min(newQuantity, maxQuantity));
  };

  const handleProceedToCheckout = () => {
    if (getCartItemCount() > 0) {
      navigate('/checkout');
    } else {
      alert("Seu carrinho está vazio!");
    }
  };

  const handleClearCart = () => {
    if (getCartItemCount() > 0) {
      setConfirmationState({
        isOpen: true,
        title: 'Limpar Carrinho',
        message: 'Tem certeza que deseja remover todos os itens do seu carrinho?',
        onConfirm: () => clearCart(),
      });
    }
  };

  const cartTotal = getCartTotal();
  const itemCount = getCartItemCount();

  return (
    <>
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={() => setConfirmationState({ ...confirmationState, isOpen: false })}
        onConfirm={() => {
          confirmationState.onConfirm();
          setConfirmationState({ ...confirmationState, isOpen: false });
        }}
        title={confirmationState.title}
        message={confirmationState.message}
      />
      <div className="py-8">
        <SectionTitle title="Meu Carrinho" subtitle={itemCount > 0 ? `Você tem ${itemCount} item(ns) no seu carrinho.` : "Seu carrinho está pronto para novos produtos!"} />
        
        {itemCount === 0 ? (
          <div className="text-center py-12 bg-background-card p-8 rounded-xl shadow-lg border border-border-light">
            <ShoppingCartIcon className="h-20 w-20 text-brand-primary mx-auto mb-6 opacity-50" />
            <h2 className="text-3xl font-semibold text-text-headings mb-3">Seu carrinho está vazio.</h2>
            <p className="text-text-muted mb-8 max-w-md mx-auto">
              Parece que você ainda não adicionou nenhum produto. Que tal explorar nossas ofertas?
            </p>
            <Link to="/products">
              <Button variant="primary" size="lg">
                Explorar Produtos
              </Button>
            </Link>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-background-card p-6 sm:p-8 rounded-xl shadow-xl border border-border-light">
              {cartItems.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between py-4 border-b border-border-light last:border-b-0">
                  <div className="flex items-center mb-4 sm:mb-0">
                    <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded-md shadow-sm mr-4" />
                    <div>
                      <Link to={`/products/${item.id}`} className="text-lg font-semibold text-brand-primary hover:underline">{item.name}</Link>
                      <p className="text-sm text-text-muted">R$ {item.price.toFixed(2).replace('.', ',')} cada</p>
                      {item.stock !== undefined && item.quantity >= item.stock && <p className="text-xs text-red-500">Máximo em estoque atingido.</p> }
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <div className="flex items-center border border-border-medium rounded-md">
                      <button
                        onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                        className="px-2 py-1 text-text-muted hover:bg-gray-100 rounded-l-md transition-colors"
                        aria-label={`Diminuir quantidade de ${item.name}`}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        min="1"
                        max={item.stock}
                        onChange={(e) => handleUpdateQuantity(item, parseInt(e.target.value, 10) || 1)}
                        className="w-12 text-center border-l border-r border-border-medium py-1 focus:outline-none text-text-body bg-gray-50"
                        aria-label={`Quantidade de ${item.name}`}
                      />
                      <button
                        onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                        className="px-2 py-1 text-text-muted hover:bg-gray-100 rounded-r-md transition-colors"
                        aria-label={`Aumentar quantidade de ${item.name}`}
                        disabled={item.stock !== undefined && item.quantity >= item.stock}
                      >
                        +
                      </button>
                    </div>
                    <p className="text-md font-semibold text-text-headings w-24 text-right">
                      R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                    </p>
                    <button 
                      onClick={() => handleUpdateQuantity(item, 0)}
                      title={`Remover ${item.name}`}
                      className="p-2 text-text-muted hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                      <span className="sr-only">Remover item</span>
                    </button>
                  </div>
                </div>
              ))}

              {itemCount > 0 && (
                <div className="mt-8 pt-6 border-t border-border-light">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-lg text-text-body">Subtotal ({itemCount} item{itemCount > 1 ? 's' : ''}):</p>
                    <p className="text-xl font-semibold text-text-headings">R$ {cartTotal.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-xl font-bold text-text-body">Total:</p>
                    <p className="text-3xl font-bold text-brand-primary">R$ {cartTotal.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={handleClearCart}
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      Limpar Carrinho
                    </Button>
                    <Button 
                      variant="primary" 
                      size="lg" 
                      onClick={handleProceedToCheckout} 
                      disabled={itemCount === 0}
                    >
                      <>
                        <ShoppingCartIcon className="w-5 h-5 mr-2" />
                        Ir para Pagamento
                      </>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartPage;
