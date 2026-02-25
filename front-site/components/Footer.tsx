
import React from 'react';
import { useSiteSettings } from '../hooks/useSiteSettings'; // Import useSiteSettings

// New Instagram Icon component with the official logo shape
const InstagramIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const Footer: React.FC = () => {
  const { settings, isLoading } = useSiteSettings();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background-card py-8 mt-16 border-t border-border-light print:hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-text-muted">
        <p>&copy; {currentYear} {isLoading ? 'Carregando nome...' : (settings?.siteName || 'Norte Sul Informática')}. Todos os direitos reservados.</p>
        <p className="text-sm mt-1">Simplificando a tecnologia para você.</p>
        
        {!isLoading && settings && (settings.facebookUrl || settings.instagramUrl) && (
          <div className="mt-6 flex justify-center items-center space-x-4">
            {settings.facebookUrl && (
              <a 
                href={settings.facebookUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Facebook" 
                className="inline-flex items-center justify-center px-4 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#166fe5] transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-sm">Facebook</span>
              </a>
            )}
            {settings.instagramUrl && (
               <a 
                href={settings.instagramUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Instagram" 
                className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-lg hover:opacity-90 transition-opacity duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <InstagramIcon className="h-5 w-5 mr-2"/>
                <span className="font-medium text-sm">Instagram</span>
              </a>
            )}
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;