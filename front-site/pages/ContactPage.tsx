import React, { useState } from 'react';
import SectionTitle from '../components/SectionTitle';
import Button from '../components/Button';
import ChatBubbleLeftRightIcon from '../components/icons/ChatBubbleLeftRightIcon';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { createTicket } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const ContactPage: React.FC = () => {
  const { settings, isLoading } = useSiteSettings();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
        await createTicket(formData);
        addToast("Obrigado pelo seu contato! Responderemos em breve.", 'success');
        setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
        addToast(error instanceof Error ? error.message : "Falha ao enviar mensagem.", 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8">
      <SectionTitle 
        title="Fale Conosco" 
        subtitle="Tem alguma dúvida, sugestão ou precisa de ajuda? Entre em contato!" 
      />
      <div className="max-w-4xl mx-auto bg-background-card p-8 sm:p-12 rounded-xl shadow-lg border border-border-light">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <h3 className="text-2xl font-semibold text-brand-primary mb-6">Nossos Canais</h3>
            {isLoading ? (
              <p className="text-text-muted">Carregando informações de contato...</p>
            ) : (
              <div className="space-y-6 text-text-body">
                {settings?.contactPhone && (
                  <div>
                    <h4 className="text-lg font-medium text-text-headings">Telefone:</h4>
                    <a href={`tel:${settings.contactPhone.replace(/\D/g, '')}`} className="hover:text-brand-primary transition-colors">{settings.contactPhone}</a>
                  </div>
                )}
                {settings?.contactPhone && (
                  <div>
                    <h4 className="text-lg font-medium text-text-headings">WhatsApp:</h4>
                    <a href={`https://wa.me/55${settings.contactPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary transition-colors">{settings.contactPhone}</a>
                  </div>
                )}
                {settings?.contactEmail && (
                  <div>
                    <h4 className="text-lg font-medium text-text-headings">E-mail:</h4>
                    <a href={`mailto:${settings.contactEmail}`} className="hover:text-brand-primary transition-colors">{settings.contactEmail}</a>
                  </div>
                )}
                {settings?.storeHours && (
                  <div>
                    <h4 className="text-lg font-medium text-text-headings">Horário de Atendimento:</h4>
                    <p className="whitespace-pre-line">{settings.storeHours}</p>
                  </div>
                )}
                {settings?.storeAddress && (
                     <div>
                        <h4 className="text-lg font-medium text-text-headings">Endereço:</h4>
                        <p className="whitespace-pre-line">{settings.storeAddress}</p>
                        <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.storeAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-brand-primary hover:underline mt-1 inline-block"
                        >
                            Ver no mapa
                        </a>
                    </div>
                )}
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-2xl font-semibold text-brand-primary mb-6">Envie uma Mensagem</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-body mb-1">Nome Completo</label>
                <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange}
                       className="w-full p-3 rounded-md bg-gray-50 text-text-body border border-border-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none placeholder-text-muted" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-body mb-1">Seu Melhor E-mail</label>
                <input type="email" name="email" id="email" required value={formData.email} onChange={handleChange}
                       className="w-full p-3 rounded-md bg-gray-50 text-text-body border border-border-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none placeholder-text-muted" />
              </div>
               <div>
                <label htmlFor="phone" className="block text-sm font-medium text-text-body mb-1">Telefone (Opcional)</label>
                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange}
                       className="w-full p-3 rounded-md bg-gray-50 text-text-body border border-border-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none placeholder-text-muted" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-text-body mb-1">Sua Mensagem</label>
                <textarea name="message" id="message" rows={5} required value={formData.message} onChange={handleChange}
                          className="w-full p-3 rounded-md bg-gray-50 text-text-body border border-border-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none placeholder-text-muted"></textarea>
              </div>
              <div>
                <Button type="submit" variant="primary" size="lg" className="w-full flex items-center justify-center" disabled={isSubmitting}>
                  <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;