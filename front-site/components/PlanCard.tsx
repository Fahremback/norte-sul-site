
import React from 'react';
import { Plan } from '../types';
import Button from './Button';

interface PlanCardProps {
  plan: Plan;
  onSubscribe: (planId: string) => void;
  isProcessing: boolean;
}

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const PlanCard: React.FC<PlanCardProps> = ({ plan, onSubscribe, isProcessing }) => {
  const getFrequencyText = (frequency: string) => {
    switch (frequency?.toUpperCase()) {
      case 'MONTHLY': return 'mês';
      case 'WEEKLY': return 'semana';
      case 'YEARLY': return 'ano';
      default: return frequency?.toLowerCase() || '';
    }
  };

  return (
    <div className="bg-background-card rounded-xl shadow-lg overflow-hidden flex flex-col border-2 border-brand-primary/20 hover:border-brand-primary hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      <div className="p-8">
        <h3 className="text-2xl font-bold text-brand-primary text-center mb-2">{plan.name}</h3>
        <p className="text-text-muted text-center h-12 mb-6">{plan.description}</p>
        
        <div className="text-center mb-8">
          <span className="text-5xl font-extrabold text-text-headings">
            R$ {plan.price.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-lg text-text-muted">
            /{getFrequencyText(plan.frequency)}
          </span>
        </div>

        <ul className="space-y-4 mb-10">
          {plan.features?.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckIcon className="w-5 h-5 text-brand-primary mr-3 mt-0.5 shrink-0" />
              <span className="text-text-body">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto p-8 pt-0">
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full"
          onClick={() => onSubscribe(plan.id)}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processando...' : 'Assinar Agora'}
        </Button>
      </div>
    </div>
  );
};

export default PlanCard;