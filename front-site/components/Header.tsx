
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useSiteSettings } from '../hooks/useSiteSettings';
import LoginModal from '../components/LoginModal';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import Button from './Button'; 

import ShoppingCartIcon from './icons/ShoppingCartIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import CogIcon from './icons/CogIcon';
import LogoutIcon from './icons/LogoutIcon';
import HomeIcon from './icons/HomeIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import { NavLinkItem } from '../types';

const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);


const NAV_LINKS: NavLinkItem[] = [
  { label: 'Início', path: '/', icon: HomeIcon },
  { label: 'Produtos', path: '/products', icon: ShoppingCartIcon },
  { label: 'Planos', path: '/plans', icon: BriefcaseIcon },
  { label: 'Cursos', path: '/courses', icon: BookOpenIcon },
  { label: 'Contato', path: '/contact', icon: ChatBubbleLeftRightIcon },
];

const Header: React.FC = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { getCartItemCount, clearCart } = useCart();
  const { settings, isLoading: isLoadingSettings } = useSiteSettings();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const location = useLocation();
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
  }, [location.pathname]);

  // Close dropdowns if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openForgotPasswordModal = () => {
    setIsLoginModalOpen(false);
    setIsForgotPasswordModalOpen(true);
  };
  
  const openLoginModalFromForgot = () => {
    setIsForgotPasswordModalOpen(false);
    setIsLoginModalOpen(true);
  }

  const siteName = isLoadingSettings ? 'Carregando...' : settings?.siteName || 'Norte Sul Informática';
  const logoUrl = settings?.logoUrl;

  const renderNavLinks = (isMobile: boolean = false) => (
    NAV_LINKS.map(link => (
      <NavLink
        key={link.path}
        to={link.path}
        className={({ isActive }) =>
          `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out
           ${isMobile ? 'text-lg w-full hover:bg-brand-primary/10' : 'hover:text-brand-primary'}
           ${isActive ? (isMobile ? 'text-brand-primary bg-brand-primary/10' : 'text-brand-primary') : (isMobile ? 'text-text-headings' : 'text-text-body')}`
        }
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        {link.icon && <link.icon className={`w-5 h-5 mr-2 ${isMobile ? '' : 'hidden sm:inline-block'}`} />}
        {link.label}
      </NavLink>
    ))
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-background-card shadow-md z-[90] print:hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 sm:h-24">
            {/* Logo */}
            <Link to="/" className="flex items-center text-2xl font-bold text-brand-primary hover:opacity-80 transition-opacity">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="h-10 sm:h-12 mr-2 object-contain" />
              ) : (
                <span>{siteName}</span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2 lg:space-x-4">
              {renderNavLinks()}
            </nav>

            {/* Actions: Cart & User/Login */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {isAuthenticated && (
                <Link to="/cart" className="relative p-2 text-text-muted hover:text-brand-primary transition-colors" aria-label="Carrinho de compras">
                  <ShoppingCartIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                  {getCartItemCount() > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-text-on-brand transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                      {getCartItemCount()}
                    </span>
                  )}
                </Link>
              )}

              {/* User/Login Section */}
              {isAuthenticated && currentUser ? (
                <div className="relative" ref={userDropdownRef}>
                  <button 
                    type="button"
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} 
                    className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-brand-primary text-text-on-brand rounded-full text-lg font-semibold hover:bg-brand-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-50"
                    aria-label="Menu do usuário"
                    aria-expanded={isUserDropdownOpen}
                  >
                    {currentUser.initial}
                  </button>
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-background-card rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 border border-border-light">
                      <div className="px-4 py-2 text-sm text-text-muted">
                        Logado como <strong className="text-text-headings">{currentUser.username}</strong>
                      </div>
                      <div className="border-t border-border-light my-1"></div>
                      {currentUser.isAdmin && (
                         <Link
                          to="/settings"
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-text-body hover:bg-gray-100 hover:text-brand-primary transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <CogIcon className="w-4 h-4 mr-2" /> Painel Admin
                        </Link>
                      )}
                       <Link
                        to="/settings"
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-text-body hover:bg-gray-100 hover:text-brand-primary transition-colors"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        <UserCircleIcon className="w-4 h-4 mr-2" /> Minha Conta
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          clearCart();
                          setIsUserDropdownOpen(false);
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-text-body hover:bg-gray-100 hover:text-brand-primary transition-colors"
                      >
                        <LogoutIcon className="w-4 h-4 mr-2" /> Sair
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button variant="primary" size="sm" onClick={() => setIsLoginModalOpen(true)} className="hidden sm:inline-flex">
                  Entrar
                </Button>
              )}
              
              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 text-text-muted hover:text-brand-primary transition-colors"
                  aria-label="Abrir menu principal"
                  aria-expanded={isMobileMenuOpen}
                >
                  {isMobileMenuOpen ? <CloseIcon className="w-7 h-7" /> : <MenuIcon className="w-7 h-7" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div ref={mobileMenuRef} className="md:hidden fixed inset-0 top-20 sm:top-24 bg-background-card/95 backdrop-blur-sm p-4 space-y-3 z-[80] overflow-y-auto">
            <nav className="flex flex-col space-y-2">
              {renderNavLinks(true)}
            </nav>
            <div className="border-t border-border-light pt-3">
              {!isAuthenticated && (
                <Button 
                  variant="primary" 
                  size="md" 
                  onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full"
                >
                  Entrar / Cadastrar
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onForgotPasswordClick={openForgotPasswordModal}
      />
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
        onSwitchToLogin={openLoginModalFromForgot}
      />
    </>
  );
};

export default Header;
