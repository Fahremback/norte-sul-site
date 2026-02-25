import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Address, CreditCardData, PaymentPayload, AddressFormData } from '../types';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
    initiatePayment as apiInitiatePayment, 
    fetchMyAddresses, 
    addAddress, 
    fetchCep, 
    calculateShippingOptions,
    fetchMyCards,
} from '../services/api';
import { validateCPF } from '../utils/cpf';

import SectionTitle from '../components/SectionTitle';
import Button from '../components/Button';
import IconPix from '../components/icons/IconPix';
import CreditCardIcon from '../components/icons/CreditCardIcon';
import BoletoIcon from '../components/icons/BoletoIcon';
import MapPinIcon from '../components/icons/MapPinIcon';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import TruckIcon from '../components/icons/TruckIcon';
import BuildingOfficeIcon from '../components/icons/BuildingOfficeIcon';
import QRCode from 'react-qr-code';
import DocumentArrowDownIcon from '../components/icons/DocumentArrowDownIcon';

// Schemas
const userDataSchema = z.object({
  fullName: z.string().min(3, 'Nome completo é obrigatório'),
  email: z.string().email('Email inválido'),
  cpf: z.string().refine(cpf => validateCPF(cpf.replace(/\D/g, '')), 'CPF inválido'),
});

const addressSchema = z.object({
  cep: z.string().min(8, 'CEP inválido'),
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'UF inválido').max(2),
  complement: z.string().optional(),
  saveAddress: z.boolean(),
});

const cardSchema = z.object({
  holderName: z.string().min(3, 'Nome no cartão é obrigatório'),
  number: z.string().min(13, 'Número do cartão inválido').max(19),
  expiryMonth: z.string().length(2, 'Mês inválido'),
  expiryYear: z.string().length(4, 'Ano inválido'),
  ccv: z.string().min(3, 'CVV inválido').max(4),
  saveCard: z.boolean().optional(),
});

type UserData = z.infer<typeof userDataSchema>;
type AddressFormValues = z.infer<typeof addressSchema>;
type CardFormValues = z.infer<typeof cardSchema>;

type CheckoutStep = 'userData' | 'shipping' | 'payment' | 'confirmation';
type ShippingOption = { type: string; cost: number; days: string };

const steps = [
    { id: 'userData', name: 'Seus Dados' },
    { id: 'shipping', name: 'Endereço e Entrega' },
    { id: 'payment', name: 'Pagamento' },
];

const CheckoutPage: React.FC = () => {
    const { cartItems, getCartTotal, clearCart } = useCart();
    const { isAuthenticated, currentUser } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState<CheckoutStep>('userData');
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentResult, setPaymentResult] = useState<any>(null);

    const [checkoutData, setCheckoutData] = useState<{
        userData: UserData | null;
        address: Address | (AddressFormData & { id?: string }) | null;
        shippingOption: ShippingOption | null;
    }>({ userData: null, address: null, shippingOption: null });

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [isFetchingCep, setIsFetchingCep] = useState(false);
    
    const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
    
    const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'PIX' | 'BOLETO'>('CREDIT_CARD');
    const [savedCards, setSavedCards] = useState<any[]>([]);
    const [selectedCard, setSelectedCard] = useState<any | null>(null);
    const [showNewCardForm, setShowNewCardForm] = useState(false);
    const [cvv, setCvv] = useState('');

    const { register: registerUser, handleSubmit: handleUserSubmit, formState: { errors: userErrors } } = useForm<UserData>({
        resolver: zodResolver(userDataSchema),
        defaultValues: { fullName: currentUser?.name || '', email: currentUser?.email || '', cpf: currentUser?.cpfCnpj || '' }
    });

    const { register: registerAddress, handleSubmit: handleAddressSubmit, formState: { errors: addressErrors }, setValue: setAddressValue, reset: resetAddressForm } = useForm<AddressFormValues>({ resolver: zodResolver(addressSchema) });
    const { register: registerCard, handleSubmit: handleCardSubmit, formState: { errors: cardErrors }, reset: resetCardForm } = useForm<CardFormValues>({ resolver: zodResolver(cardSchema) });
    
    const subTotal = useMemo(() => getCartTotal(), [getCartTotal]);
    const finalTotal = useMemo(() => subTotal + (checkoutData.shippingOption?.cost || 0), [subTotal, checkoutData.shippingOption]);

    useEffect(() => {
        if (!isAuthenticated) { navigate('/cart'); addToast('Você precisa estar logado.', 'warning'); return; }
        if (cartItems.length === 0) { navigate('/cart'); return; }
        
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [userAddresses, userCards] = await Promise.all([fetchMyAddresses(), fetchMyCards()]);
                setAddresses(userAddresses);
                setSavedCards(userCards);
                if (userAddresses.length === 0) setShowAddressForm(true);
            } catch (err) { setError('Falha ao carregar seus dados.'); } 
            finally { setIsLoading(false); }
        };
        loadData();
    }, [isAuthenticated, cartItems.length, navigate, addToast]);

    const onUserDataSubmit: SubmitHandler<UserData> = (data) => {
        setCheckoutData(prev => ({ ...prev, userData: data }));
        setCurrentStep('shipping');
    };

    const handleSelectAddress = async (address: Address) => {
        setCheckoutData(prev => ({ ...prev, address, shippingOption: null }));
        setShowAddressForm(false);
        try {
            const options = await calculateShippingOptions(address.cep);
            setShippingOptions(options);
        } catch(err) { addToast("Não foi possível calcular o frete.", "error"); }
    };
    
    const onAddressFormSubmit: SubmitHandler<AddressFormValues> = async (data) => {
        const newAddressData = { ...data, type: 'Casa', contactName: checkoutData.userData!.fullName, contactPhone: currentUser!.phone || '' };
        setCheckoutData(prev => ({...prev, address: newAddressData, shippingOption: null}));
        if (data.saveAddress) {
            try { await addAddress(newAddressData); } catch (err) { addToast("Não foi possível salvar o endereço.", "error"); }
        }
        try {
            const options = await calculateShippingOptions(data.cep);
            setShippingOptions(options);
        } catch(err) { addToast("Não foi possível calcular o frete.", "error"); }
        setShowAddressForm(false);
    };

    const handleSelectShipping = (option: ShippingOption) => {
        setCheckoutData(prev => ({...prev, shippingOption: option}));
    };
    
    const onFinalSubmit = async (cardData?: CardFormValues) => {
        if (!checkoutData.userData || !checkoutData.address || !checkoutData.shippingOption) {
            addToast("Dados incompletos. Verifique as etapas anteriores.", "error"); return;
        }
        setIsProcessing(true); setError(null);
        try {
            let creditCardPayload: CreditCardData | undefined;
            if (paymentMethod === 'CREDIT_CARD') {
                if (showNewCardForm && cardData) {
                     const { saveCard, ...details } = cardData; 
                     creditCardPayload = details;
                } else if (selectedCard) {
                    creditCardPayload = { id: selectedCard.id, ccv: cvv } as any;
                } else { throw new Error('Selecione ou adicione um cartão.'); }
            }
            
            const payload: PaymentPayload = {
                cartItems, totalAmount: finalTotal, paymentMethod,
                address: checkoutData.address as Address,
                buyerInfo: { 
                    name: checkoutData.userData.fullName, email: checkoutData.userData.email,
                    cpfCnpj: checkoutData.userData.cpf, phone: currentUser!.phone || '',
                },
                creditCard: creditCardPayload,
                creditCardHolderInfo: (showNewCardForm && cardData) ? {
                    name: cardData.holderName, email: checkoutData.userData.email, cpfCnpj: checkoutData.userData.cpf,
                    postalCode: checkoutData.address.cep, addressNumber: checkoutData.address.number, phone: currentUser!.phone || '',
                } : undefined,
                saveCard: showNewCardForm ? cardData?.saveCard : false,
            };

            const result = await apiInitiatePayment(payload);
            setPaymentResult(result);
            clearCart();
            setCurrentStep('confirmation');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha no pagamento.');
        } finally { setIsProcessing(false); }
    };

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length !== 8) return;
        setIsFetchingCep(true);
        try {
            const data = await fetchCep(cep);
            if(data.erro) { addToast("CEP não encontrado.", "warning"); return; }
            setAddressValue('street', data.logradouro); setAddressValue('neighborhood', data.bairro);
            setAddressValue('city', data.localidade); setAddressValue('state', data.uf);
        } catch (err) { addToast("Falha ao buscar CEP.", "error"); }
        finally { setIsFetchingCep(false); }
    };
    
    const renderUserDataStep = () => (
        <div className="bg-white p-6 rounded-lg shadow-md border">
            <form onSubmit={handleUserSubmit(onUserDataSubmit)} className="space-y-4">
                 <div><label>Nome Completo</label><input {...registerUser('fullName')} className="w-full p-2 border rounded" />{userErrors.fullName && <p className="text-red-500 text-xs">{userErrors.fullName.message}</p>}</div>
                 <div><label>Email</label><input {...registerUser('email')} className="w-full p-2 border rounded" />{userErrors.email && <p className="text-red-500 text-xs">{userErrors.email.message}</p>}</div>
                 <div><label>CPF</label><input {...registerUser('cpf')} className="w-full p-2 border rounded" />{userErrors.cpf && <p className="text-red-500 text-xs">{userErrors.cpf.message}</p>}</div>
                <div className="flex justify-end"><Button type="submit">Continuar para Entrega</Button></div>
            </form>
        </div>
    );
    const renderShippingStep = () => (
        <div className="bg-white p-6 rounded-lg shadow-md border space-y-6">
            <div>
                <h3 className="text-xl font-semibold mb-3">1. Endereço de Entrega</h3>
                {!showAddressForm && addresses.map(addr => (
                    <div key={addr.id} className={`p-3 border rounded mb-2 ${checkoutData.address?.id === addr.id ? 'border-brand-primary' : ''}`}>
                        <p>{addr.street}, {addr.number} - {addr.neighborhood}</p>
                        <Button size="sm" onClick={() => handleSelectAddress(addr)}>Entregar aqui</Button>
                    </div>
                ))}
                {!showAddressForm && <Button variant="outline" onClick={() => { resetAddressForm(); setShowAddressForm(true); }}><PlusCircleIcon className="w-5 h-5 mr-2" />Adicionar novo endereço</Button>}
                {showAddressForm && (
                    <form onSubmit={handleAddressSubmit(onAddressFormSubmit)} className="space-y-3">
                        {/* Address Form Inputs */}
                        <div><label>CEP</label><input {...registerAddress('cep')} onBlur={handleCepBlur} className="w-full p-2 border rounded" />{addressErrors.cep && <p className="text-red-500 text-xs">{addressErrors.cep.message}</p>}</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2"><label>Rua</label><input {...registerAddress('street')} className="w-full p-2 border rounded" /></div>
                          <div><label>Nº</label><input {...registerAddress('number')} className="w-full p-2 border rounded" /></div>
                        </div>
                        <div><label>Bairro</label><input {...registerAddress('neighborhood')} className="w-full p-2 border rounded" /></div>
                        <div className="grid grid-cols-2 gap-2">
                           <div><label>Cidade</label><input {...registerAddress('city')} className="w-full p-2 border rounded" /></div>
                           <div><label>UF</label><input {...registerAddress('state')} maxLength={2} className="w-full p-2 border rounded" /></div>
                        </div>
                        <div><label>Complemento</label><input {...registerAddress('complement')} className="w-full p-2 border rounded" /></div>
                        <div><input type="checkbox" {...registerAddress('saveAddress')} id="saveAddr" /><label htmlFor="saveAddr"> Salvar este endereço</label></div>
                        <div className="flex gap-2">
                           <Button type="submit">Usar este endereço</Button>
                           {addresses.length > 0 && <Button variant="outline" onClick={() => setShowAddressForm(false)}>Voltar</Button>}
                        </div>
                    </form>
                )}
            </div>
            {checkoutData.address && (
                <div>
                     <h3 className="text-xl font-semibold mb-3">2. Opções de Frete</h3>
                     {shippingOptions.map(opt => (
                         <div key={opt.type} className={`p-3 border rounded mb-2 flex justify-between items-center ${checkoutData.shippingOption?.type === opt.type ? 'border-brand-primary' : ''}`}>
                             <div><p>{opt.type} - {opt.days}</p><p>R$ {opt.cost.toFixed(2)}</p></div>
                             <Button size="sm" onClick={() => handleSelectShipping(opt)}>Selecionar</Button>
                         </div>
                     ))}
                      <div className={`p-3 border rounded mb-2 flex justify-between items-center ${checkoutData.shippingOption?.type === 'Retirada' ? 'border-brand-primary' : ''}`}>
                        <div><p><BuildingOfficeIcon className="w-5 h-5 inline-block mr-2"/> Retirada na Loja</p><p>Grátis - Pronto em até 2 horas úteis</p></div>
                        <Button size="sm" onClick={() => handleSelectShipping({type: 'Retirada', cost: 0, days: 'imediato'})}>Selecionar</Button>
                      </div>
                </div>
            )}
             <div className="flex justify-between mt-6"><Button variant="outline" onClick={() => setCurrentStep('userData')}>Voltar</Button><Button onClick={() => setCurrentStep('payment')} disabled={!checkoutData.shippingOption}>Continuar para Pagamento</Button></div>
        </div>
    );
    const renderPaymentStep = () => (
        <div className="bg-white p-6 rounded-lg shadow-md border">
             <h3 className="text-xl font-semibold mb-3">3. Forma de Pagamento</h3>
             <div className="flex border-b mb-4">
                 {/* Payment Method Tabs */}
                 <button onClick={() => setPaymentMethod('CREDIT_CARD')} className={`p-3 ${paymentMethod === 'CREDIT_CARD' ? 'border-b-2 border-brand-primary' : ''}`}><CreditCardIcon className="w-5 h-5 mr-2 inline"/>Cartão</button>
                 <button onClick={() => setPaymentMethod('PIX')} className={`p-3 ${paymentMethod === 'PIX' ? 'border-b-2 border-brand-primary' : ''}`}><IconPix className="w-5 h-5 mr-2 inline"/>PIX</button>
                 <button onClick={() => setPaymentMethod('BOLETO')} className={`p-3 ${paymentMethod === 'BOLETO' ? 'border-b-2 border-brand-primary' : ''}`}><BoletoIcon className="w-5 h-5 mr-2 inline"/>Boleto</button>
             </div>
             {paymentMethod === 'CREDIT_CARD' && (
                 <div className="space-y-4">
                     {!showNewCardForm && savedCards.map(card => (
                         <div key={card.id} className={`p-3 border rounded cursor-pointer ${selectedCard?.id === card.id ? 'border-brand-primary' : ''}`} onClick={() => setSelectedCard(card)}>
                           <p>{card.brand} **** **** **** {card.last4}</p>
                         </div>
                     ))}
                     {selectedCard && !showNewCardForm && <div><label>CVV</label><input type="text" value={cvv} onChange={(e)=>setCvv(e.target.value)} maxLength={4} className="w-20 p-2 border rounded"/></div>}
                     {!showNewCardForm && <Button variant="outline" onClick={() => { setSelectedCard(null); setShowNewCardForm(true); }}><PlusCircleIcon className="w-5 h-5 mr-2" />Pagar com outro cartão</Button>}
                     {showNewCardForm && (
                         <form id="cardForm" onSubmit={handleCardSubmit(onFinalSubmit)} className="space-y-3">
                             <div><label>Nome no Cartão</label><input {...registerCard('holderName')} className="w-full p-2 border rounded"/>{cardErrors.holderName && <p className="text-red-500 text-xs">{cardErrors.holderName.message}</p>}</div>
                             <div><label>Número do Cartão</label><input {...registerCard('number')} className="w-full p-2 border rounded"/>{cardErrors.number && <p className="text-red-500 text-xs">{cardErrors.number.message}</p>}</div>
                             <div className="grid grid-cols-3 gap-2">
                               <div><label>Mês (MM)</label><input {...registerCard('expiryMonth')} placeholder="MM" maxLength={2} className="w-full p-2 border rounded"/></div>
                               <div><label>Ano (AAAA)</label><input {...registerCard('expiryYear')} placeholder="AAAA" maxLength={4} className="w-full p-2 border rounded"/></div>
                               <div><label>CVV</label><input {...registerCard('ccv')} maxLength={4} className="w-full p-2 border rounded"/></div>
                             </div>
                             <div className="flex items-center">
                                <input type="checkbox" {...registerCard('saveCard')} id="save-card-checkout" className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"/>
                                <label htmlFor="save-card-checkout" className="ml-2 block text-sm text-gray-900">Salvar este cartão para compras futuras</label>
                             </div>
                             {savedCards.length > 0 && <Button variant="outline" onClick={() => setShowNewCardForm(false)}>Usar cartão salvo</Button>}
                         </form>
                     )}
                 </div>
             )}
             {error && <p className="text-red-500 bg-red-100 p-2 rounded mt-4">{error}</p>}
             <div className="flex justify-between mt-6">
                 <Button variant="outline" onClick={() => setCurrentStep('shipping')}>Voltar</Button>
                 <Button onClick={() => paymentMethod === 'CREDIT_CARD' && showNewCardForm ? handleCardSubmit(onFinalSubmit)() : onFinalSubmit()} disabled={isProcessing}>
                     {isProcessing ? 'Processando...' : `Finalizar Compra - R$ ${finalTotal.toFixed(2)}`}
                 </Button>
             </div>
        </div>
    );
    
    const renderStepContent = () => {
        switch (currentStep) {
            case 'userData': return renderUserDataStep();
            case 'shipping': return renderShippingStep();
            case 'payment': return renderPaymentStep();
            default: return null;
        }
    };

    if (isLoading) return <div className="text-center py-12">Carregando checkout...</div>;
    
     if (currentStep === 'confirmation') {
        return (
             <div className="py-8">
                <SectionTitle title="Compra Finalizada!" />
                 <div className="max-w-md mx-auto bg-background-card p-8 rounded-xl shadow-lg border">
                    {paymentResult.billingType === 'PIX' && (
                        <div className="text-center">
                            <IconPix className="h-16 w-16 text-brand-primary mx-auto mb-3" />
                            <h3 className="text-2xl font-semibold mb-4">Pague com PIX para confirmar</h3>
                            <div className="p-2 bg-white inline-block rounded-lg my-4"><QRCode value={paymentResult.pixQrCode.payload} size={220} /></div>
                            <textarea readOnly value={paymentResult.pixQrCode.payload} className="w-full p-2 text-xs rounded-md bg-gray-100 border text-text-muted" rows={3} onClick={e => (e.target as HTMLTextAreaElement).select()} />
                            <Button variant="outline" className="w-full mt-2" onClick={() => navigator.clipboard.writeText(paymentResult.pixQrCode.payload).then(() => addToast("Chave PIX copiada!", "success"))}>Copiar Chave</Button>
                        </div>
                    )}
                    {paymentResult.billingType === 'BOLETO' && (
                         <div className="text-center">
                            <BoletoIcon className="h-16 w-16 text-brand-primary mx-auto mb-3" />
                            <h3 className="text-2xl font-semibold mb-4">Boleto Gerado</h3>
                            <p className="text-text-muted mb-6">Clique no botão abaixo para visualizar. O pagamento pode levar até 2 dias úteis para ser confirmado.</p>
                            <a href={paymentResult.bankSlipUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="primary" size="lg" className="w-full flex items-center justify-center">
                                    <DocumentArrowDownIcon className="w-5 h-5 mr-2" /> Visualizar Boleto
                                </Button>
                            </a>
                        </div>
                    )}
                     {paymentResult.billingType === 'CREDIT_CARD' && (
                        <div className="text-center">
                             <h3 className="text-2xl font-semibold mb-4">Pagamento Aprovado!</h3>
                            <p className="text-text-muted mb-6">Seu pedido foi confirmado com sucesso. Você receberá um e-mail com os detalhes.</p>
                        </div>
                     )}
                </div>
            </div>
        );
     }

    const currentStepIndex = steps.findIndex(step => step.id === currentStep);

    return (
        <div className="py-8">
            <SectionTitle title="Finalizar Compra" />
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                <main className="lg:col-span-2 space-y-6">
                    <nav aria-label="Progress">
                        <ol role="list" className="flex items-center">
                            {steps.map((step, stepIdx) => (
                                <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                                {stepIdx < currentStepIndex ? (
                                    <>
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="h-0.5 w-full bg-brand-primary" />
                                    </div>
                                    <span className="relative flex h-8 w-8 items-center justify-center bg-brand-primary rounded-full text-white">✓</span>
                                    </>
                                ) : stepIdx === currentStepIndex ? (
                                    <>
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="h-0.5 w-full bg-gray-200" />
                                    </div>
                                    <span className="relative flex h-8 w-8 items-center justify-center bg-white border-2 border-brand-primary rounded-full">
                                        <span className="text-brand-primary">{stepIdx + 1}</span>
                                    </span>
                                    </>
                                ) : (
                                    <>
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="h-0.5 w-full bg-gray-200" />
                                    </div>
                                    <span className="relative flex h-8 w-8 items-center justify-center bg-white border-2 border-gray-300 rounded-full">
                                        <span className="text-gray-500">{stepIdx + 1}</span>
                                    </span>
                                    </>
                                )}
                                </li>
                            ))}
                        </ol>
                    </nav>

                    <div className="mt-8">
                       {renderStepContent()}
                    </div>
                </main>
                <aside className="lg:col-span-1">
                    <div className="lg:sticky lg:top-28 bg-background-card p-6 rounded-xl shadow-lg border">
                        <h3 className="text-xl font-semibold border-b pb-3 mb-4">Resumo do Pedido</h3>
                        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                            {cartItems.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                    <span className="text-text-body">{item.name} x {item.quantity}</span>
                                    <span className="text-text-headings font-medium">R$ {(item.price * item.quantity).toFixed(2).replace('.',',')}</span>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2 border-t pt-4">
                             <div className="flex justify-between text-sm">
                                <span className="text-text-muted">Subtotal</span>
                                <span className="text-text-headings">R$ {subTotal.toFixed(2).replace('.',',')}</span>
                            </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-text-muted">Frete</span>
                                <span className="text-text-headings">{checkoutData.shippingOption ? `R$ ${checkoutData.shippingOption.cost.toFixed(2).replace('.',',')}` : 'A calcular'}</span>
                            </div>
                             <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                <span className="text-text-headings">Total</span>
                                <span className="text-brand-primary">R$ {finalTotal.toFixed(2).replace('.',',')}</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CheckoutPage;