
import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      // Use a timeout to focus after the animation
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
        if (event.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusableElements || focusableElements.length === 0) return;
          
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) { // Shift + Tab
            if (document.activeElement === firstElement) {
              lastElement.focus();
              event.preventDefault();
            }
          } else { // Tab
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

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } catch (e) {
      console.error("Confirmation action failed", e);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[110] p-4"
      aria-labelledby="confirmation-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose} 
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="bg-background-card p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md relative transition-all duration-300 transform scale-95 opacity-0 animate-fade-in-up"
        onClick={e => e.stopPropagation()} 
        style={{ animationFillMode: 'forwards', animationName: 'fade-in-up', animationDuration: '0.3s' }}
        aria-describedby="confirmation-message"
      >
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <h3 id="confirmation-title" className="text-2xl font-bold text-text-headings mt-4">
                {title}
            </h3>
            <div className="mt-2">
                <p id="confirmation-message" className="text-sm text-text-muted">
                {message}
                </p>
            </div>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
                variant="outline"
                onClick={onClose}
                className="w-full"
                aria-label={cancelText}
                disabled={isConfirming}
            >
                {cancelText}
            </Button>
            <Button
                onClick={handleConfirm}
                className="w-full bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
                aria-label={confirmText}
                disabled={isConfirming}
            >
                {isConfirming ? 'Confirmando...' : confirmText}
            </Button>
        </div>
      </div>
      <style>
        {`
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
};

export default ConfirmationModal;