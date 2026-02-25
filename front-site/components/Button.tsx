
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  type = 'button', 
  ...props 
}) => {
  const baseStyles = 'font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-all duration-150 ease-in-out hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  
  let variantStyles = '';
  switch (variant) {
    case 'primary':
      variantStyles = 'bg-brand-primary hover:bg-brand-secondary text-text-on-brand focus:ring-brand-primary';
      break;
    case 'secondary':
      variantStyles = 'bg-brand-accent hover:bg-yellow-500 text-text-headings focus:ring-brand-accent';
      break;
    case 'outline':
      variantStyles = 'bg-transparent border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-text-on-brand focus:ring-brand-primary';
      break;
  }

  let sizeStyles = '';
  switch (size) {
    case 'sm':
      sizeStyles = 'py-2 px-3 text-sm';
      break;
    case 'md':
      sizeStyles = 'py-2.5 px-5 text-base';
      break;
    case 'lg':
      sizeStyles = 'py-3 px-6 text-lg';
      break;
  }

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
