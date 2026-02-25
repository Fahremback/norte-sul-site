
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { forgotPassword } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import Button from './Button';
import KeyIcon from './icons/KeyIcon';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const forgotPasswordSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido.'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { addToast } = useToast();

  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      reset();
      setError('');
      setIsLoading(false);
      setIsSuccess(false);
    }, 300);
  };

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      setTimeout(() => modalRef.current?.focus(), 100);

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') handleClose();
        if (event.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
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
  }, [isOpen]);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError('');
    setIsLoading(true);
    setIsSuccess(false);

    try {
      const response = await forgotPassword(data.email);
      addToast(response.message, 'success');
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" role="dialog" aria-modal="true">
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="bg-background-card p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md relative"
        aria-labelledby="forgot-password-title"
      >
        <button onClick={handleClose} className="absolute top-3 right-3 text-text-muted hover:text-text-headings transition-colors" aria-label="Fechar modal">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center mb-6">
          <KeyIcon className="h-16 w-16 text-brand-primary mx-auto mb-3" />
          <h2 id="forgot-password-title" className="text-3xl font-bold text-text-headings">Recuperar Senha</h2>
          <p className="text-text-muted text-sm mt-1">
            {isSuccess ? 'Verifique sua caixa de entrada!' : 'Digite seu e-mail para receber um link de redefinição.'}
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center">
            <p className="text-text-body mb-4">
              Se um e-mail correspondente for encontrado em nosso sistema, um link para redefinição de senha será enviado.
            </p>
            <Button variant="primary" onClick={handleClose}>
              Ok, Entendi!
            </Button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="emailForgot" className="block text-sm font-medium text-text-body mb-1">Email</label>
                <input
                  type="email"
                  id="emailForgot"
                  {...register('email')}
                  autoComplete="email"
                  className="w-full p-3 rounded-md bg-gray-50 text-text-body border border-border-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none placeholder-text-muted"
                  placeholder="Digite seu email de cadastro"
                  aria-invalid={!!errors.email}
                  aria-describedby="email-error"
                />
                {errors.email && <p id="email-error" className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
              </div>
              {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar Link de Redefinição'}
              </Button>
            </form>
            <div className="text-center mt-4">
              <button onClick={onSwitchToLogin} className="text-sm text-brand-primary hover:underline font-medium">
                Lembrou a senha? Voltar para o Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
