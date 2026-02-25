import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { resendVerificationEmail } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import Button from './Button';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';

const VerificationWarning: React.FC = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    if (!currentUser || currentUser.emailVerified) {
        return null;
    }

    const handleResend = async () => {
        setIsLoading(true);
        try {
            await resendVerificationEmail();
            addToast('Um novo e-mail de verificação foi enviado.', 'success');
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Falha ao reenviar e-mail.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-yellow-100 border-b-2 border-yellow-300 text-yellow-800 p-3 text-center text-sm print:hidden mb-6">
            <div className="container mx-auto flex items-center justify-center gap-4 flex-wrap">
                <ExclamationTriangleIcon className="w-5 h-5 hidden sm:inline-block shrink-0" />
                <span className="font-medium">Seu e-mail ainda não foi verificado.</span>
                <Button 
                    variant="outline"
                    size="sm"
                    className="border-yellow-600 text-yellow-800 hover:bg-yellow-600 hover:text-white focus:ring-yellow-500"
                    onClick={handleResend}
                    disabled={isLoading}
                >
                    {isLoading ? 'Enviando...' : 'Reenviar E-mail de Verificação'}
                </Button>
            </div>
        </div>
    );
};

export default VerificationWarning;
