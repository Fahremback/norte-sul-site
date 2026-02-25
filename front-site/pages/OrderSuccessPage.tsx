
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import Button from '../components/Button';

// CheckCircleIcon for success indication
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const { orderId, orderTotal, itemCount } = (location.state as { orderId?: string, orderTotal?: number, itemCount?: number }) || {};

  return (
    <div className="py-12 text-center">
      <SectionTitle title="Pedido Realizado com Sucesso!" />
      
      <div className="max-w-md mx-auto bg-background-card p-8 rounded-xl shadow-2xl border-2 border-brand-primary">
        <CheckCircleIcon className="h-24 w-24 text-brand-primary mx-auto mb-6 animate-pulse" />
        <p className="text-xl text-text-body mb-4">
          Obrigado por sua compra! Seu pedido foi recebido.
        </p>
        
        {orderId && (
            <p className="text-sm text-text-muted">ID do Pedido: {orderId}</p>
        )}
        {orderTotal !== undefined && itemCount !== undefined && (
          <div className="my-6 p-4 bg-gray-50 rounded-md border border-border-light">
            <h4 className="text-lg font-semibold text-text-headings mb-2">Resumo da Compra:</h4>
            <p className="text-text-muted">Total de Itens: {itemCount}</p>
            <p className="text-text-muted">Valor Total: <span className="font-bold text-brand-secondary">R$ {orderTotal.toFixed(2).replace('.', ',')}</span></p>
          </div>
        )}
        
        <p className="text-sm text-text-muted mb-8">
          Você receberá um e-mail de confirmação em breve com os detalhes do pedido. Acompanharemos o status do pagamento.
        </p>
        
        <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:justify-center sm:space-x-4">
            <Link to="/products">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Continuar Comprando
                </Button>
            </Link>
            <Link to="/">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Voltar para a Página Inicial
                </Button>
            </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
