import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import UserCircleIcon from '../components/icons/UserCircleIcon';
import { useToast } from '../contexts/ToastContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForgotPasswordClick: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onForgotPasswordClick }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const { addToast } = useToast();
  
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };
  
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      setTimeout(() => modalRef.current?.focus(), 100);

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          handleClose();
        }
        if (event.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusableElements || focusableElements.length === 0) return;
          
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              event.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              event.preventDefault();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        previouslyFocusedElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);


  const handleModeToggle = () => {
    setIsRegisterMode(!isRegisterMode);
  };
  
  useEffect(() => {
    clearForm();
  }, [isRegisterMode]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
        clearForm();
        setIsRegisterMode(false);
    }, 300); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isRegisterMode) {
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        setIsLoading(false);
        return;
      }
      try {
        await register(name, email, password);
        handleClose();
        addToast("Cadastro realizado! Por favor, verifique seu e-mail para ativar sua conta.", 'success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha no cadastro. Tente outro e-mail.');
      }
    } else {
      const success = await login(email, password);
      if (!success) {
        setError('Email ou senha inválidos.');
      } else {
        handleClose();
      }
    }

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" role="dialog" aria-modal="true">
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="bg-background-card p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md relative"
        aria-labelledby="login-modal-title"
      >
        <button 
          onClick={handleClose} 
          className="absolute top-3 right-3 text-text-muted hover:text-text-headings transition-colors"
          aria-label="Fechar modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center mb-6">
          <UserCircleIcon className="h-16 w-16 text-brand-primary mx-auto mb-3" />
          <h2 id="login-modal-title" className="text-3xl font-bold text-text-headings">
            {isRegisterMode ? 'Criar Nova Conta' : 'Entrar na sua Conta'}
          </h2>
          <p className="text-text-muted text-sm mt-1">
            {isRegisterMode ? 'Preencha seus dados para começar.' : 'Acesse para gerenciar suas configurações.'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label htmlFor="nameRegister" className="block text-sm font-medium text-text-body mb-1">Nome Completo</label>
              <input type="text" id="nameRegister" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className="w-full p-3 rounded-md bg-gray-50 text-text-body border border-border-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none placeholder-text-muted" placeholder="Seu nome completo" />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-body mb-1">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="w-full p-3 rounded-md bg-gray-50 text-text-body border border-border-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none placeholder-text-muted" placeholder="Digite seu email" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-body mb-1">Senha</label>
            <input type="password" id="password" value={password} autoComplete={isRegisterMode ? "new-password" : "current-password"} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 rounded-md bg-gray-50 text-text-body border border-border-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none placeholder-text-muted" placeholder="Digite sua senha" />
          </div>
           {isRegisterMode && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-body mb-1">Confirmar Senha</label>
              <input type="password" id="confirmPassword" value={confirmPassword} autoComplete="new-password" onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full p-3 rounded-md bg-gray-50 text-text-body border border-border-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none placeholder-text-muted" placeholder="Confirme sua senha" />
            </div>
          )}
          {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? (isRegisterMode ? 'Cadastrando...' : 'Entrando...') : (isRegisterMode ? 'Cadastrar' : 'Entrar')}
          </Button>
        </form>
        <div className="flex justify-between items-center mt-4">
            <button onClick={handleModeToggle} className="text-sm text-brand-primary hover:underline font-medium">
                {isRegisterMode ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Cadastre-se'}
            </button>
             {!isRegisterMode && (
                <button onClick={onForgotPasswordClick} className="text-sm text-text-muted hover:text-brand-primary hover:underline">
                    Esqueci a senha
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;