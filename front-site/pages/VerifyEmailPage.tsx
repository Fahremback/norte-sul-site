
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../services/api';
import Button from '../components/Button';
import SectionTitle from '../components/SectionTitle';
import { useToast } from '../contexts/ToastContext';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import ExclamationTriangleIcon from '../components/icons/ExclamationTriangleIcon';


const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verificando seu e-mail...');
    const { addToast } = useToast();

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token de verificação não encontrado. Por favor, use o link enviado para o seu e-mail.');
            return;
        }

        const doVerification = async () => {
            try {
                const response = await verifyEmail(token);
                if (response && response.token) {
                    localStorage.setItem('authToken', response.token);
                    setStatus('success');
                    setMessage('Seu e-mail foi verificado com sucesso! A página será atualizada.');
                    addToast('E-mail verificado com sucesso!', 'success');
                    
                    setTimeout(() => {
                        window.location.hash = '/settings';
                        window.location.reload();
                    }, 2500);

                } else {
                    throw new Error("A resposta da verificação foi inválida.");
                }
            } catch (error) {
                setStatus('error');
                setMessage(error instanceof Error ? error.message : 'Ocorreu um erro ao verificar seu e-mail. O link pode ter expirado ou ser inválido.');
            }
        };

        const timer = setTimeout(() => {
            doVerification();
        }, 500); // Small delay to show loading state

        return () => clearTimeout(timer);

    }, [token, addToast]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                        <p className="text-lg text-text-body">{message}</p>
                    </>
                );
            case 'success':
                return (
                    <>
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-lg font-medium text-green-700">{message}</p>
                        <div className="mt-6">
                            <Link to="/settings">
                                <Button variant="primary" size="lg">Ir para Minha Conta</Button>
                            </Link>
                        </div>
                    </>
                );
            case 'error':
                return (
                    <>
                        <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <p className="text-lg font-medium text-red-700">{message}</p>
                         <div className="mt-6">
                            <Link to="/">
                                <Button variant="primary" size="lg">Voltar ao Início</Button>
                            </Link>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="py-12">
            <SectionTitle title="Verificação de E-mail" />
            <div className="max-w-md mx-auto text-center bg-background-card p-8 rounded-xl shadow-lg border border-border-light min-h-[250px] flex flex-col justify-center">
                {renderContent()}
            </div>
        </div>
    );
};

export default VerifyEmailPage;