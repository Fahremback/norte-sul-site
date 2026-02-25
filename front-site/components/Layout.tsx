import React from 'react';
import Header from './Header';
import Footer from './Footer';
import VerificationWarning from './VerificationWarning';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-24 sm:pt-28">
        <VerificationWarning />
        <div className="pb-12 container mx-auto px-4 sm:px-6 lg:px-8"> 
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;