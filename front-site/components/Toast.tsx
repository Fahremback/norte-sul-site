import React, { useEffect, useState } from 'react';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onDismiss: (id: string) => void;
  duration?: number;
}

const typeClasses = {
  success: 'bg-green-100 border-green-400 text-green-700',
  error: 'bg-red-100 border-red-400 text-red-700',
  info: 'bg-blue-100 border-blue-400 text-blue-700',
  warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
};

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const Toast: React.FC<ToastProps> = ({ id, message, type = 'info', onDismiss, duration = 5000 }) => {
  const [isExiting, setIsExiting] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onDismiss(id), 300);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [id, onDismiss, duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 300);
  };
  
  const baseClasses = 'relative w-full max-w-sm p-4 border rounded-lg shadow-lg flex items-center space-x-4 transition-all duration-300 ease-in-out pointer-events-auto';
  const animationClass = isExiting ? 'animate-toast-exit' : 'animate-toast-enter';

  return (
    <div 
      role="alert" 
      className={`${baseClasses} ${typeClasses[type]} ${animationClass}`}
    >
      <div className="flex-grow">{message}</div>
      <button onClick={handleDismiss} className="p-1 rounded-full hover:bg-black/10" aria-label="Fechar notificação">
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;