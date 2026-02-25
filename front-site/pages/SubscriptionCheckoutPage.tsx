
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCardData, PlanAnswers } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { createCustomSubscription, fetchCep } from '../services/api';
import * as cpfUtils from '../utils/cpf';
import Button from '../components/Button';
import SectionTitle from '../components/SectionTitle';
import UserCircleIcon from '../components/icons/UserCircleIcon';
import MapPinIcon from '../components/icons/MapPinIcon';
import CreditCardIcon from '../components/icons/CreditCardIcon';
import { useToast } from '../contexts/ToastContext';

interface PlanDetails {
  name: string;
  price: number;
  description: string;
  answers: PlanAnswers;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
  <div>
    <label htmlFor={props.id || props.name} className="block text-sm font-medium text-text-body mb-1">{label}</label>
    <input
      {...props}
      className="w-full p-2.5 rounded-md bg-gray-50 text-text-body border border-border-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none placeholder-text-muted transition-shadow focus:shadow-md"
    />
  </div>
);

const SubscriptionCheckoutPage: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const planDetails: PlanDetails | undefined = location.state?.planDetails;

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '', email: '', cpfCnpj: '', phone: '', cep: '',
    street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
  });

  const [creditCardData, setCreditCardData] = useState<CreditCardData>({
    holderName: '', number: '', expiryMonth: '', expiryYear: '', ccv: '',
  });

  const [cpfError, setCpfError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      addToast('Você precisa estar logado para continuar.', 'warning');
      navigate('/plans');
      return;
    }
    if (!planDetails) {
      addToast('Detalhes do plano não encontrados. Por favor, monte seu plano novamente.', 'error');
      navigate('/plans');
      return;
    }

    if (currentUser) {
        const primaryAddress = currentUser.addresses?.find(a => a.isPrimary) || currentUser.addresses?.[0];
        setFormData({
            name: currentUser.name || '',
            email: currentUser.email || '',
            cpfCnpj: currentUser.cpfCnpj || '',
            phone: currentUser.phone || '',
            cep: primaryAddress?.cep || '',
            street: primaryAddress?.street || '',
            number: primaryAddress?.number || '',
            complement: primaryAddress?.complement || '',
            neighborhood: primaryAddress?.neighborhood || '',
            city: primaryAddress?.city || '',
            state: primaryAddress?.state || '',
        });
        setCreditCardData(prev => ({ ...prev, holderName: currentUser.name || '' }));
    }
  }, [currentUser, isAuthenticated, planDetails, navigate, addToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCreditCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreditCardData(prev => ({ ...prev, [name]: value }));
  };

  const handleCpfBlur = () => {
    const cpf = formData.cpfCnpj.replace(/\D/g, '');
    if (!cpf) {
        setCpfError(null);
        return;
    }
    if (cpfUtils.validateCPF(cpf)) {
        setCpfError(null);
    } else {
        setCpfError("CPF inválido. Por favor, verifique o número digitado.");
    }
  };
  
  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setIsFetchingCep(true);
    try {
        const data = await fetchCep(cep);
        if (data.erro) {
            addToast("CEP não encontrado.", "error");
            return;
        }
        setFormData(prev => ({ ...prev, street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf }));
    } catch (error) {
        addToast("Falha ao buscar CEP.", "error");
    } finally {
        setIsFetchingCep(false);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.cpfCnpj || !formData.name || !formData.email || !formData.phone) {
        setError("Todos os campos de dados pessoais são obrigatórios.");
        return false;
      }
      if (cpfError) {
        setError("O CPF informado é inválido.");
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formData.cep || !formData.street || !formData.number || !formData.neighborhood || !formData.city || !formData.state) {
        setError("Todos os campos de endereço são obrigatórios.");
        return false;
      }
    }
    return true;
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(s => s + 1);
    }
  };
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planDetails || !validateStep(1) || !validateStep(2)) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    
    setIsProcessing(true);
    setError(null);

    const holderInfo = {
        name: formData.name,
        email: formData.email,
        cpfCnpj: formData.cpfCnpj,
        postalCode: formData.cep,
        addressNumber: formData.number,
        phone: formData.phone,
    };

    try {
      await createCustomSubscription(planDetails, { creditCard: creditCardData, holderInfo });
      addToast("Assinatura criada com sucesso!", "success");
      navigate('/settings', { state: { activeTab: 'orders' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro ao processar a assinatura.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
            <div className="space-y-4">
                <div>
                    <InputField id="cpfCnpj" name="cpfCnpj" label="CPF / CNPJ" value={formData.cpfCnpj} onChange={handleInputChange} onBlur={handleCpfBlur} required />
                    {cpfError && <p className="text-sm text-red-500 mt-1">{cpfError}</p>}
                </div>
                <InputField id="name" name="name" label="Nome Completo" value={formData.name} onChange={handleInputChange} required autoComplete="name" />
                <InputField id="email" name="email" type="email" label="Email de Contato" value={formData.email} onChange={handleInputChange} required autoComplete="email" />
                <InputField id="phone" name="phone" type="tel" label="Telefone / WhatsApp" value={formData.phone} onChange={handleInputChange} required autoComplete="tel" />
            </div>
        );
      case 2:
        return (
            <div className="space-y-4">
                <InputField id="cep" name="cep" label="CEP" value={formData.cep} onChange={handleInputChange} onBlur={handleCepBlur} required autoComplete="postal-code" />
                {isFetchingCep && <p className="text-sm text-text-muted">Buscando endereço...</p>}
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2"><InputField id="street" name="street" label="Rua / Avenida" value={formData.street} onChange={handleInputChange} required autoComplete="address-line1" /></div>
                    <div><InputField id="number" name="number" label="Número" value={formData.number} onChange={handleInputChange} required autoComplete="address-line2" /></div>
                </div>
                 <InputField id="complement" name="complement" label="Complemento (Opcional)" value={formData.complement || ''} onChange={handleInputChange} autoComplete="address-line3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField id="neighborhood" name="neighborhood" label="Bairro" value={formData.neighborhood} onChange={handleInputChange} required />
                    <InputField id="city" name="city" label="Cidade" value={formData.city} onChange={handleInputChange} required autoComplete="address-level2" />
                </div>
                <InputField id="state" name="state" label="Estado (UF)" value={formData.state} onChange={handleInputChange} required maxLength={2} autoComplete="address-level1" />
            </div>
        );
      case 3:
        return (
            <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
                <InputField id="holderName" name="holderName" label="Nome no Cartão" value={creditCardData.holderName} onChange={handleCreditCardChange} required />
                <InputField id="number" name="number" label="Número do Cartão" value={creditCardData.number} onChange={handleCreditCardChange} required placeholder="0000 0000 0000 0000" />
                <div className="grid grid-cols-3 gap-4">
                    <InputField id="expiryMonth" name="expiryMonth" label="Mês (MM)" value={creditCardData.expiryMonth} onChange={handleCreditCardChange} required placeholder="01" maxLength={2} />
                    <InputField id="expiryYear" name="expiryYear" label="Ano (AAAA)" value={creditCardData.expiryYear} onChange={handleCreditCardChange} required placeholder="2028" maxLength={4} />
                    <InputField id="ccv" name="ccv" label="CVV" value={creditCardData.ccv} onChange={handleCreditCardChange} required placeholder="123" maxLength={4} />
                </div>
            </form>
        );
      default: return null;
    }
  };
  
  const stepConfig = [
      { num: 1, title: 'Dados Pessoais', icon: UserCircleIcon },
      { num: 2, title: 'Endereço', icon: MapPinIcon },
      { num: 3, title: 'Pagamento', icon: CreditCardIcon },
  ];

  if (!planDetails) {
    return null; // or a loading spinner, though useEffect should redirect quickly
  }

  return (
    <div className="py-8">
      <SectionTitle title="Assinatura de Plano" subtitle="Finalize a contratação do seu plano personalizado." />
      <div className="max-w-3xl mx-auto bg-background-card p-6 sm:p-8 rounded-xl shadow-xl border border-border-light">
        <div className="text-center mb-4">
          <p className="text-text-muted text-lg">{planDetails.name}</p>
          <p className="text-3xl font-bold text-brand-primary mt-2">R$ {planDetails.price.toFixed(2).replace('.', ',')} / mês</p>
        </div>

        <div className="my-8">
            <div className="flex items-center justify-between">
                {stepConfig.map((item, index) => (
                    <React.Fragment key={item.num}>
                        <div className="flex flex-col items-center text-center px-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= item.num ? 'bg-brand-primary border-brand-primary text-white' : 'bg-gray-100 border-border-medium text-text-muted'}`}>
                                <item.icon className="w-5 h-5"/>
                            </div>
                            <p className={`mt-2 text-xs font-semibold ${step >= item.num ? 'text-brand-primary' : 'text-text-muted'}`}>{item.title}</p>
                        </div>
                        {index < stepConfig.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${step > index + 1 ? 'bg-brand-primary' : 'bg-border-medium'}`}/>}
                    </React.Fragment>
                ))}
            </div>
        </div>

        <div className="min-h-[250px]">
            {renderStepContent()}
        </div>

        {error && <p className="text-sm text-center text-red-600 bg-red-100 p-3 rounded-md mt-4">{error}</p>}
        
        <div className="mt-8 pt-6 border-t border-border-light flex justify-between items-center">
            <Button variant="outline" onClick={prevStep} disabled={step === 1 || isProcessing}>Voltar</Button>
            {step < 3 ? (
                <Button variant="primary" onClick={nextStep} disabled={isProcessing}>Próximo</Button>
            ) : (
                <Button type="submit" form="payment-form" variant="primary" disabled={isProcessing}>
                    {isProcessing ? 'Processando...' : `Assinar por R$ ${planDetails.price.toFixed(2).replace('.', ',')}`}
                </Button>
            )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckoutPage;