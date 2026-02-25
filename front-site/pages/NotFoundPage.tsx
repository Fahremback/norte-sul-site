
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center py-12">
      <h1 className="text-8xl font-extrabold text-brand-primary mb-4">404</h1>
      <h2 className="text-4xl font-bold text-text-headings mb-6">Página Não Encontrada</h2>
      <p className="text-xl text-text-muted mb-10 max-w-md">
        Oops! Parece que a página que você está procurando não existe ou foi movida.
      </p>
      <Link to="/">
        <Button variant="primary" size="lg">
          Voltar para a Página Inicial
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
