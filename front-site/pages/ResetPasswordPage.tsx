
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/Button';
import SectionTitle from '../components/SectionTitle';

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [token, setToken] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (!urlToken) {
            setError('Token de redefinição inválido ou ausente. Por favor, solicite um novo link.');
            addToast('Token de redefinição inválido.', 'error');
            navigate('/');
        }
        setToken(urlToken);
    }, [searchParams, navigate, addToast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!password || !confirmPassword) {
            setError('Por favor, preencha ambos os campos.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        
        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        if (!token) {
            setError('Token inválido. Não é possível continuar.');
            return;
        }
        
        setIsLoading(true);
        try {
            await resetPassword(token, password);
            setIsSuccess(true);
            addToast('Senha redefinida com sucesso!', 'success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao redefinir a senha.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="py-12 text-center">
                <SectionTitle title="Senha Redefinida!" />
                <div className="max-w-md mx-auto bg-background-card p-8 rounded-xl shadow-lg border border-border-light">
                    <p className="text-text-body mb-6">Sua senha foi alterada com sucesso. Você já pode fazer o login com suas novas credenciais.</p>
                    <Button variant="primary" size="lg" onClick={() => navigate('/')}>
                        Ir para Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="py-12">
            <SectionTitle title="Redefinir Senha" subtitle="Crie uma nova senha para sua conta." />
            <div className="max-w-md mx-auto bg-background-card p-8 rounded-xl shadow-lg border border-border-light">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-text-body mb-1">Nova Senha</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-3 rounded-md bg-gray-50 text-text-body border border-border-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                            placeholder="Digite sua nova senha"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-body mb-1">Confirmar Nova Senha</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full p-3 rounded-md bg-gray-50 text-text-body border border-border-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                            placeholder="Confirme sua nova senha"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
                    <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading || !token}>
                        {isLoading ? 'Salvando...' : 'Redefinir Senha'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;