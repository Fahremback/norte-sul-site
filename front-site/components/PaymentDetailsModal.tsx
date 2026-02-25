import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { fetchOrderPaymentDetails } from '../services/api';
import Button from './Button';
import { XMarkIcon } from '@heroicons/react/24/solid';
import QRCode from 'react-qr-code';
import IconPix from './icons/IconPix';
import BoletoIcon from './icons/BoletoIcon';
import { useToast } from '../contexts/ToastContext';

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({ isOpen, onClose, order }) => {
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && order?.paymentId) {
      setIsLoading(true);
      setError(null);
      fetchOrderPaymentDetails(order.paymentId)
        .then(data => setPaymentDetails(data))
        .catch(err => setError(err.message || 'Falha ao buscar detalhes do pagamento.'))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const renderPaymentContent = () => {
    if (isLoading) {
      return <div className="text-center p-8">Carregando detalhes...</div>;
    }
    if (error) {
      return <div className="text-center p-8 text-red-500 bg-red-100 rounded-md">{error}</div>;
    }
    if (!paymentDetails) {
      return <div className="text-center p-8 text-text-muted">Não foi possível carregar os detalhes do pagamento.</div>;
    }

    if (paymentDetails.billingType === 'PIX' && paymentDetails.pixQrCode) {
      return (
        <div className="text-center">
            <IconPix className="h-12 w-12 text-brand-primary mx-auto mb-3" />
            <h3 className="text-xl font-bold text-text-headings mb-2">Pague com PIX</h3>
            <div className="p-2 bg-white inline-block rounded-md shadow-sm border border-border-light my-4">
                <QRCode value={paymentDetails.pixQrCode.payload} size={180} />
            </div>
            <textarea readOnly value={paymentDetails.pixQrCode.payload} className="w-full p-2 text-xs rounded-md bg-gray-100 border border-border-medium resize-none text-text-muted" rows={3} onClick={(e) => (e.target as HTMLTextAreaElement).select()} />
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(paymentDetails.pixQrCode.payload).then(() => addToast('Código PIX Copiado!', 'success'))} className="w-full mt-2">Copiar Código PIX</Button>
        </div>
      );
    }

    if (paymentDetails.billingType === 'BOLETO') {
        return (
            <div className="text-center">
                <BoletoIcon className="h-12 w-12 text-brand-primary mx-auto mb-3" />
                <h3 className="text-xl font-bold text-text-headings mb-2">Pagar com Boleto</h3>
                <p className="text-text-muted text-sm mb-4">Clique no botão para abrir o boleto em uma nova aba.</p>
                <a href={paymentDetails.bankSlipUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="primary" className="w-full">Visualizar Boleto</Button>
                </a>
            </div>
        );
    }
    
    return <p className="text-center text-text-muted">Detalhes de pagamento não disponíveis para este método.</p>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="bg-background-card p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-text-muted hover:text-text-headings">
            <XMarkIcon className="w-7 h-7" />
        </button>
        <h2 className="text-2xl font-semibold text-text-headings mb-4 text-center">Pagamento do Pedido #{order.id.substring(0, 8)}</h2>
        {renderPaymentContent()}
      </div>
    </div>
  );
};

export default PaymentDetailsModal;