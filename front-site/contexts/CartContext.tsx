
import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import { CartItem, Product, Course, CartContextType } from '../types';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { syncMyCart, fetchMyCart } from '../services/api';

const LOCAL_CART_STORAGE_KEY = 'norteSulInformaticaCart';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  const isInitialLoad = useRef(true);
  const isAuthChangeInProgress = useRef(false);

  useEffect(() => {
    if (isLoadingAuth) return;

    isAuthChangeInProgress.current = true;
    
    const handleAuthChange = async () => {
      if (isAuthenticated) {
        try {
          const localCartJson = localStorage.getItem(LOCAL_CART_STORAGE_KEY);
          const localCart: CartItem[] = localCartJson ? JSON.parse(localCartJson) : [];
          
          const serverCart = await fetchMyCart();

          let cartToSync = serverCart;

          if (localCart.length > 0) {
            const mergedCartMap = new Map<string, CartItem>();
            serverCart.forEach(item => mergedCartMap.set(item.id, { ...item }));
            localCart.forEach(localItem => {
              const existing = mergedCartMap.get(localItem.id);
              if (existing) {
                existing.quantity += localItem.quantity;
              } else {
                mergedCartMap.set(localItem.id, localItem);
              }
            });
            cartToSync = Array.from(mergedCartMap.values());
            addToast('Seu carrinho local foi combinado com o da sua conta.', 'info');
          }
          
          const finalCart = await syncMyCart(cartToSync);
          setCartItems(finalCart);
          localStorage.removeItem(LOCAL_CART_STORAGE_KEY);

        } catch (error) {
          addToast('Não foi possível sincronizar o carrinho com sua conta.', 'error');
        }
      } else {
        // User is logged out or anonymous
        const storedCart = localStorage.getItem(LOCAL_CART_STORAGE_KEY);
        setCartItems(storedCart ? JSON.parse(storedCart) : []);
      }
      isInitialLoad.current = false;
      isAuthChangeInProgress.current = false;
    };

    handleAuthChange();
  }, [isAuthenticated, isLoadingAuth, addToast]);

  // Syncs changes back to the correct storage
  useEffect(() => {
    if (isInitialLoad.current || isAuthChangeInProgress.current) return;
    
    if (isAuthenticated) {
      syncMyCart(cartItems).catch(error => {
        console.error("Failed to sync cart on change:", error);
        addToast('Falha ao atualizar o carrinho na sua conta.', 'error');
      });
    } else {
      localStorage.setItem(LOCAL_CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated]);

  const addToCart = (itemToAdd: Product | Course, quantity: number = 1) => {
    const itemType = 'title' in itemToAdd ? 'COURSE' : 'PRODUCT';
    const name = 'title' in itemToAdd ? itemToAdd.title : itemToAdd.name;
    
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === itemToAdd.id && item.itemType === itemType);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        const maxQuantity = itemType === 'PRODUCT' ? (itemToAdd as Product).stock ?? Infinity : Infinity;
        return prevItems.map(item =>
          item.id === itemToAdd.id ? { ...item, quantity: Math.min(newQuantity, maxQuantity) } : item
        );
      } else {
        const maxQuantity = itemType === 'PRODUCT' ? (itemToAdd as Product).stock ?? Infinity : Infinity;
        return [...prevItems, { 
          id: itemToAdd.id,
          itemType,
          name, 
          price: itemToAdd.price, 
          imageUrl: ('imageUrls' in itemToAdd ? itemToAdd.imageUrls?.[0] : itemToAdd.imageUrl) || '',
          quantity: Math.min(quantity, maxQuantity),
          stock: itemType === 'PRODUCT' ? (itemToAdd as Product).stock : undefined,
        }];
      }
    });
    addToast(`"${name}" foi adicionado ao carrinho!`, 'success');
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, quantity);
          const maxQuantity = item.stock ?? Infinity;
          if (newQuantity === 0) return null; 
          return { ...item, quantity: Math.min(newQuantity, maxQuantity) };
        }
        return item;
      }).filter(item => item !== null) as CartItem[]
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartItemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};