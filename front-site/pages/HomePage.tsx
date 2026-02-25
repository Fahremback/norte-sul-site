
import React from 'react';
import { Link } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import BriefcaseIcon from '../components/icons/BriefcaseIcon';
import BookOpenIcon from '../components/icons/BookOpenIcon';
import ChatBubbleLeftRightIcon from '../components/icons/ChatBubbleLeftRightIcon';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface OptionCardProps {
  to: string;
  title: string;
  description: string;
  IconComponent: React.FC<React.SVGProps<SVGSVGElement>>;
}

const OptionCard: React.FC<OptionCardProps> = ({ to, title, description, IconComponent }) => (
  <Link to={to} className="block bg-background-card p-8 rounded-xl shadow-lg hover:shadow-brand-primary/20 transform hover:-translate-y-1 transition-all duration-300 ease-in-out group border border-border-light hover:shadow-xl">
    <div className="flex justify-center mb-6">
      <IconComponent className="h-16 w-16 text-brand-primary group-hover:text-brand-accent transition-colors duration-300" />
    </div>
    <h3 className="text-2xl font-semibold text-text-headings text-center mb-3 group-hover:text-brand-primary transition-colors duration-300">{title}</h3>
    <p className="text-text-muted text-center text-sm">{description}</p>
  </Link>
);

const HomePage: React.FC = () => {
  const { settings, isLoading } = useSiteSettings();

  const siteName = isLoading ? '...' : settings?.siteName || 'Norte Sul Informática';
  const appInitial = isLoading ? '' : (settings?.siteName || 'N').charAt(0).toUpperCase();

  return (
    <div className="py-12">
      <div className="text-center mb-16">
        <div className="inline-block bg-brand-primary text-text-on-brand text-7xl font-bold h-32 w-32 md:h-40 md:w-40 flex items-center justify-center rounded-full shadow-lg mx-auto mb-6 animate-pulse">
          {appInitial}
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-text-headings mb-4">
          Bem-vindo à <span className="text-brand-primary">{siteName}</span>!
        </h1>
        <p className="text-xl md:text-2xl text-text-body max-w-3xl mx-auto">
          Sua jornada no mundo digital começa aqui. Explore, aprenda e conecte-se com facilidade.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <OptionCard 
          to="/products" 
          title="Comprar Produtos" 
          description="Encontre eletrônicos e acessórios pensados para você." 
          IconComponent={ShoppingCartIcon} 
        />
        <OptionCard 
          to="/plans" 
          title="Planos de Assessoria" 
          description="Suporte técnico e consultoria para facilitar seu dia a dia." 
          IconComponent={BriefcaseIcon} 
        />
        <OptionCard 
          to="/courses" 
          title="Cursos Online" 
          description="Aprenda no seu ritmo sobre tecnologia e internet." 
          IconComponent={BookOpenIcon} 
        />
        <OptionCard 
          to="/contact" 
          title="Fale Conosco" 
          description="Estamos aqui para ajudar! Entre em contato conosco." 
          IconComponent={ChatBubbleLeftRightIcon} 
        />
      </div>
    </div>
  );
};

export default HomePage;
