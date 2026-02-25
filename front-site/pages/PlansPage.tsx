
import React, { useState, useMemo } from 'react';
import { PlanAnswers, PlanQuestion, CreditCardData } from '../types'; 
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import Button from '../components/Button';

// Ícones
const HomeServiceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>
);
const StoreServiceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h2.14M12 13.5v2.25m0-11.25V12m0-2.25V6.75M12 4.5v2.25m0 0V3.75M12 3.75c0-1.036-.84-1.875-1.875-1.875H6.375A1.875 1.875 0 004.5 3.75v16.5c0 1.036.84 1.875 1.875 1.875h3.75M12 3.75c0 1.036.84 1.875 1.875 1.875h3.75A1.875 1.875 0 0119.5 3.75v16.5c0-1.036-.84-1.875-1.875-1.875h-3.75" /></svg>
);
const RemoteFirstIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( 
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.978 11.978 0 0112 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 003 12c0 .778.099 1.533.284 2.253m0 0V12m-9 4.5h4.5m0-12.75v3.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V8.25M9 16.5v3.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V16.5M3 8.25h1.5m0 0H3m1.5 0V6.75m0 0H3m1.5 0V5.25m0 0H3m1.5 0V3.75M3 3.75H1.5m14.25 0H18m0 0h1.5m-1.5 0V6.75m0 0h1.5m-1.5 0V5.25m0 0h1.5m-1.5 0V3.75m0 0h1.5M12 12.75a3 3 0 110-6 3 3 0 010 6z" /></svg>
);
const DiscountIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h3m-3 0h-3m0 0h5.25M3 12l3-3m0 0l3-3m-3 3l3 3m-3-3v6m11.25-9l3-3m0 0l3-3m-3 3l3 3m-3-3v6M9.75 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm11.25 0a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" /></svg>
);
const PriorityIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l3.75-3.75M3.75 13.5L0 17.25m3.75-3.75L0 13.5m3.75 0L7.5 9.75M20.25 13.5l-3.75-3.75m3.75 3.75L24 17.25m-3.75-3.75L24 13.5m-3.75 0L16.5 9.75m-9 6l3-3m-3 3l-3 3m3-3l-3-3m3 3h6M9 3.75L12 3m0 0L15 3.75M12 3v5.25" /></svg>
);
const HelpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
 <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
);


const QUESTIONS: PlanQuestion[] = [
  {
    id: 'preferentialLocation',
    type: 'radio',
    title: 'Onde você prefere o atendimento principal?',
    description: 'Escolha como você gostaria de receber nosso suporte técnico e/ou aulas de informática.',
    options: [
      { value: 'home', label: 'Em Casa', description: 'Comodidade total, vamos até você!', icon: HomeServiceIcon },
      { value: 'store', label: 'Na Loja', description: 'Visite nosso espaço!', icon: StoreServiceIcon },
      { value: 'remote_first', label: 'Principalmente Remoto', description: 'Eficiência e rapidez à distância.', icon: RemoteFirstIcon },
    ],
  },
  {
    id: 'personalizedHours',
    type: 'number_input',
    title: 'Horas de Atendimento Personalizado',
    description: 'Quantas horas de atendimento (suporte/aulas) você estima precisar por mês?',
    helperText: "Pode ser uma estimativa. Se não precisar, deixe em 0.",
    inputMin: 0,
    inputMax: 20,
    inputStep: 1,
    placeholder: 'Ex: 2',
  },
  {
    id: 'simpleDoubts',
    type: 'radio',
    title: 'Ajuda com Dúvidas Rápidas',
    description: "Gostaria de um canal para tirar dúvidas simples do dia a dia?",
    options: [
      { value: 'yes', label: 'Sim, quero essa ajuda!', icon: HelpIcon },
      { value: 'no', label: 'Não preciso' },
    ],
  },
  {
    id: 'storeDiscounts',
    type: 'radio',
    title: 'Economize em Produtos e Serviços!',
    description: 'Gostaria de ter 20% de desconto em películas, capinhas e manutenções?',
    options: [
      { value: 'yes', label: 'Sim! Quero os descontos!', icon: DiscountIcon },
      { value: 'no', label: 'Não tenho interesse' },
    ],
  },
  {
    id: 'prioritySupport',
    type: 'radio',
    title: 'Atendimento Prioritário VIP',
    description: 'Que tal ter seu atendimento priorizado, passando na frente?',
    options: [
      { value: 'yes', label: 'Sim, quero ser VIP!', icon: PriorityIcon },
      { value: 'no', label: 'Atendimento padrão é suficiente' },
    ],
  },
];

const calculatePriceAndFeatures = (answers: PlanAnswers) => {
  let planSubtotal = 0;
  let avulsoSubtotal = 0;
  const planFeatures: { title: string; detail: string; costInPlan: string; saving?: string; }[] = [];
  const personalizedHours = answers.personalizedHours || 0;
  
  // Taxas e preços base
  const rates = {
    home: { plan: 70, avulso: 90 },
    store: { plan: 60, avulso: 75 },
    remote_first: { plan: 60, avulso: 75 },
  };
  const simpleDoubtsRates = { plan: 50, avulso: 70 };
  const storeDiscountsRates = { plan: 20, avulso: 30 };
  const priorityFeePercent = 0.05;
  const priorityAvulsoRatePerHour = 20;

  // 1. Horas Personalizadas
  if (personalizedHours > 0 && answers.preferentialLocation) {
    const location = answers.preferentialLocation;
    const planCost = personalizedHours * rates[location].plan;
    const avulsoCost = personalizedHours * rates[location].avulso;
    const saving = avulsoCost - planCost;
    planSubtotal += planCost;
    avulsoSubtotal += avulsoCost;
    planFeatures.push({
      title: 'Atendimento Personalizado',
      detail: `${personalizedHours}h de suporte/aulas ${location === 'home' ? 'em casa' : (location === 'store' ? 'na loja' : 'remoto')}.`,
      costInPlan: `R$ ${planCost.toFixed(2).replace('.', ',')}`,
      saving: `Economia de R$ ${saving.toFixed(2).replace('.', ',')}`
    });
  }

  // 2. Dúvidas Simples
  if (answers.simpleDoubts === 'yes') {
    const planCost = simpleDoubtsRates.plan;
    const avulsoCost = simpleDoubtsRates.avulso;
    const saving = avulsoCost - planCost;
    planSubtotal += planCost;
    avulsoSubtotal += avulsoCost;
    planFeatures.push({ 
      title: 'Ajuda com Dúvidas Simples', 
      detail: 'Canal direto para perguntas rápidas.', 
      costInPlan: `R$ ${planCost.toFixed(2).replace('.', ',')}`,
      saving: `Economia de R$ ${saving.toFixed(2).replace('.', ',')}`
    });
  }

  // 3. Descontos na Loja
  if (answers.storeDiscounts === 'yes') {
    const planCost = storeDiscountsRates.plan;
    const avulsoCost = storeDiscountsRates.avulso;
    const saving = avulsoCost - planCost;
    planSubtotal += planCost;
    avulsoSubtotal += avulsoCost;
    planFeatures.push({ 
      title: 'Acesso a Descontos (20%)', 
      detail: 'Descontos em películas, capas e manutenções.', 
      costInPlan: `R$ ${planCost.toFixed(2).replace('.', ',')}`,
      saving: `Economia de R$ ${saving.toFixed(2).replace('.', ',')}`
    });
  }

  // 4. Suporte Prioritário
  if (answers.prioritySupport === 'yes' && personalizedHours > 0 && answers.preferentialLocation) {
    const hoursCostInPlan = personalizedHours * rates[answers.preferentialLocation].plan;
    const planCost = hoursCostInPlan * priorityFeePercent;
    const avulsoCost = personalizedHours * priorityAvulsoRatePerHour;
    const saving = avulsoCost - planCost;

    planSubtotal += planCost;
    avulsoSubtotal += avulsoCost;
    planFeatures.push({ 
        title: 'Atendimento Prioritário VIP', 
        detail: `Taxa de 5% sobre horas contratadas.`, 
        costInPlan: `R$ ${planCost.toFixed(2).replace('.', ',')}`,
        saving: `Economia de R$ ${saving.toFixed(2).replace('.', ',')}`
    });
  }
  
  const totalSaving = avulsoSubtotal - planSubtotal;

  return { 
    totalPrice: planSubtotal,
    totalSaving: totalSaving > 0 ? totalSaving : 0,
    features: planFeatures,
    planName: `Plano Personalizado - R$ ${planSubtotal.toFixed(2).replace('.', ',')}`
  };
};

const PlansPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<PlanAnswers>({ 
    personalizedHours: 0, 
    preferentialLocation: undefined,
    simpleDoubts: 'no',
    storeDiscounts: 'no',
    prioritySupport: 'no',
  });
  const [showSummary, setShowSummary] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleOptionSelect = (questionId: keyof PlanAnswers, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowSummary(true);
    }
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    if (showSummary) setShowSummary(false);
    else if (currentStep > 0) setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };
  
  const handleReset = () => {
    setAnswers({ personalizedHours: 0, preferentialLocation: undefined, simpleDoubts: 'no', storeDiscounts: 'no', prioritySupport: 'no' });
    setCurrentStep(0);
    setShowSummary(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { totalPrice, features, planName, totalSaving } = useMemo(() => calculatePriceAndFeatures(answers), [answers]);
  
  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
        alert("Você precisa estar logado para assinar um plano.");
        navigate('/', { state: { openLoginModal: true } });
        return;
    }
    if (totalPrice <= 0) {
        alert("Seu plano precisa ter um valor maior que R$ 0,00 para assinar.");
        return;
    }

    const planDescription = features.length > 0 ? features.map(f => f.title).join(', ') : 'Plano Personalizado';

    navigate('/subscription-checkout', { 
        state: { 
            planDetails: {
                name: planName, 
                price: totalPrice, 
                description: planDescription,
                answers 
            } 
        }
    });
  }

  const progressPercentage = showSummary ? 100 : ((currentStep + 1) / QUESTIONS.length) * 100;

  if (showSummary) {
    return (
     <>
      <div className="py-8">
        <SectionTitle title="Seu Plano Personalizado" subtitle="Confira os detalhes e a economia do plano que montamos para você:" />
        <div className="max-w-3xl mx-auto bg-background-card p-8 rounded-xl shadow-2xl border-2 border-brand-primary">
          <h3 className="text-3xl font-bold text-brand-primary mb-6 text-center">Resumo do Plano</h3>
          
          <div className="mb-8 p-6 bg-green-50 rounded-lg border border-green-200">
            <p className="text-lg text-text-body mb-1 text-center">Valor Total Mensal:</p>
            <p className="text-5xl font-extrabold text-brand-primary text-center mb-4">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </p>
            {totalSaving > 0 && (
              <div className="text-center">
                  <span className="text-base font-semibold text-green-700 bg-green-200 py-2 px-4 rounded-full inline-block">
                    🎉 Economia Total: R$ {totalSaving.toFixed(2).replace('.', ',')}
                  </span>
              </div>
            )}
             {totalPrice === 0 && (
              <p className="text-center text-text-muted mt-4">Selecione ao menos uma opção para ver um plano mais completo!</p>
            )}
          </div>

          <h4 className="text-xl font-semibold text-text-headings mt-8 mb-4">Itens Inclusos no Seu Plano:</h4>
          <ul className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <li key={index} className="p-4 rounded-lg bg-gray-50 border border-border-light">
                <div className="flex justify-between items-start gap-4">
                  <span className="font-semibold text-text-headings flex-1">{feature.title}</span>
                  <span className="font-bold text-brand-secondary ml-2 whitespace-nowrap">{feature.costInPlan}</span>
                </div>
                <div className="flex justify-between items-end mt-1.5">
                    <p className="text-xs text-text-muted">{feature.detail}</p>
                    {feature.saving && (
                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                            {feature.saving}
                        </span>
                    )}
                </div>
              </li>
            ))}
             {features.length === 0 && <p className="text-center text-text-muted p-4">Nenhum item selecionado ainda.</p>}
          </ul>
          
          <p className="text-text-muted text-sm mb-6 text-center">Este é um plano flexível! Você pode ajustá-lo a qualquer momento falando conosco.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleReset} variant="outline" size="lg">Refazer</Button>
            <Button onClick={handleProceedToCheckout} variant="primary" size="lg" className="w-full sm:w-auto" disabled={totalPrice <= 0}>
              Ir para Pagamento
            </Button>
          </div>
        </div>
      </div>
     </>
    );
  }
  
  const currentQuestion = QUESTIONS[currentStep];

  return (
    <div className="py-8">
      <SectionTitle title="Monte Seu Plano Ideal" subtitle="Responda algumas perguntas e criaremos um plano sob medida para você!" />
      
      <div className="max-w-2xl mx-auto bg-background-card p-6 sm:p-10 rounded-xl shadow-xl border border-border-light">
        <div className="mb-8">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-brand-primary">Passo {currentStep + 1} de {QUESTIONS.length}</span>
            <span className="text-sm font-medium text-brand-primary">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-border-light rounded-full h-2.5">
            <div className="bg-brand-primary h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>

        {currentQuestion && (
          <div key={currentQuestion.id}>
            <h3 className="text-2xl sm:text-3xl font-semibold text-text-headings mb-2" id={`question-title-${currentQuestion.id}`}>{currentQuestion.title}</h3>
            {currentQuestion.description && <p className="text-text-muted mb-4 text-base sm:text-lg" id={`question-desc-${currentQuestion.id}`}>{currentQuestion.description}</p>}
            
            {currentQuestion.type === 'radio' && currentQuestion.options && (
              <div 
                role="radiogroup" 
                aria-labelledby={`question-title-${currentQuestion.id}`}
                aria-describedby={currentQuestion.description ? `question-desc-${currentQuestion.id}`: undefined}
                className="space-y-4 mb-8"
              >
                {currentQuestion.options.map(option => {
                  const IconComponent = option.icon;
                  const questionKey = currentQuestion.id as keyof PlanAnswers;
                  const isSelected = answers[questionKey] === option.value;
                  return (
                    <button
                      key={option.value}
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleOptionSelect(questionKey, option.value)}
                      className={`w-full text-left p-4 sm:p-6 rounded-lg border-2 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-accent/80
                        ${isSelected ? 'bg-brand-primary/10 border-brand-primary shadow-lg' : 'bg-gray-50 hover:bg-gray-100 border-border-light hover:border-border-medium'}`}
                    >
                      <div className="flex items-center">
                        {IconComponent && <IconComponent className={`w-8 h-8 mr-4 shrink-0 ${isSelected ? 'text-brand-primary' : 'text-text-muted'}`} />}
                        <div>
                            <span className={`block font-semibold text-base sm:text-lg ${isSelected ? 'text-brand-primary' : 'text-text-headings'}`}>{option.label}</span>
                            {option.description && <span className={`block text-xs sm:text-sm ${isSelected ? 'text-brand-primary/80' : 'text-text-muted'}`}>{option.description}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'number_input' && (
              <div className="mb-8">
                <input 
                  type="number"
                  id={String(currentQuestion.id)} 
                  value={answers[currentQuestion.id as keyof PlanAnswers] as number || 0}
                  min={currentQuestion.inputMin}
                  max={currentQuestion.inputMax}
                  step={currentQuestion.inputStep}
                  placeholder={currentQuestion.placeholder}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    const questionKey = currentQuestion.id as keyof PlanAnswers;
                    handleOptionSelect(questionKey, isNaN(value) ? 0 : value);
                  }}
                  className="w-full p-4 text-lg text-center rounded-md bg-gray-50 text-text-body border-2 border-border-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none placeholder-text-muted"
                />
              </div>
            )}
            {currentQuestion.helperText && <p className="text-sm text-text-muted italic mb-6">{currentQuestion.helperText}</p>}
          </div>
        )}

        <div className="flex justify-between items-center mt-10">
          <Button onClick={handlePrevious} variant="outline" size="lg" disabled={currentStep === 0 && !showSummary}>
            {showSummary ? 'Ver Perguntas' : 'Voltar'}
          </Button>
          <Button 
            onClick={handleNext} 
            variant="primary" 
            size="lg" 
            disabled={currentQuestion?.id === 'preferentialLocation' && !answers.preferentialLocation}
          >
            {currentStep === QUESTIONS.length - 1 ? 'Ver Resumo Final' : 'Próximo'}
          </Button>
        </div>
         {currentQuestion?.id === 'preferentialLocation' && !answers.preferentialLocation && (
            <p className="text-xs text-red-500 mt-2 text-right">Por favor, selecione uma opção para continuar.</p>
        )}
      </div>
    </div>
  );
};

export default PlansPage;
