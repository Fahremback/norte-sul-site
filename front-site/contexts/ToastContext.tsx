
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import Toast, { ToastProps } from '../components/Toast';

type ToastData = Omit<ToastProps, 'id' | 'onDismiss'>;

interface ToastContextType {
  addToast: (message: string, type?: ToastData['type'], duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onDismiss'>[]>([]);

  const addToast = useCallback((message: string, type: ToastData['type'] = 'info', duration: number = 5000) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div 
        aria-live="assertive" 
        aria-atomic="true"
        className="fixed top-4 right-4 z-[200] space-y-2 max-w-sm pointer-events-none"
      >
         <style>
          {`
            @keyframes toast-enter {
                from { opacity: 0; transform: translateX(100%); }
                to { opacity: 1; transform: translateX(0); }
            }
            .animate-toast-enter {
                animation: toast-enter 0.5s ease-out forwards;
            }
            @keyframes toast-exit {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(100%); }
            }
            .animate-toast-exit {
                animation: toast-exit 0.3s ease-in forwards;
            }
          `}
        </style>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onDismiss={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
