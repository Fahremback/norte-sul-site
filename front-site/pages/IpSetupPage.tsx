
import React, { useState, FormEvent } from 'react';
import { useIp } from '../contexts/IpContext';
import ServerIcon from '../components/icons/ServerIcon';

const IpSetupPage: React.FC = () => {
  const [ipInput, setIpInput] = useState('');
  const [error, setError] = useState('');
  const { setServerIp } = useIp();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedIp = ipInput.trim();
    
    if (!trimmedIp) {
      setError('O endereço IP não pode ser vazio.');
      return;
    }
    
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(trimmedIp)) {
        setError('Formato de IP inválido. Exemplo: 192.168.1.5');
        return;
    }

    setError('');
    setServerIp(trimmedIp);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-700 via-gray-900 to-black px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <ServerIcon className="h-16 w-16 text-brand-primary mx-auto mb-3" />
          <h1 className="text-3xl font-extrabold text-gray-900">
            Configurar Conexão
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Por favor, insira o endereço IP local do servidor para conectar.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="ip-address" className="block text-sm font-medium text-gray-700">
              Endereço IP do Servidor
            </label>
            <input
              id="ip-address"
              name="ip-address"
              type="text"
              required
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              className="mt-1 appearance-none rounded-md relative block w-full px-4 py-3 border border-gray-300 bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="Ex: 192.168.1.5"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Conectar ao Servidor
            </button>
          </div>
        </form>
         <p className="mt-4 text-center text-xs text-gray-500">
          Esta informação fica salva apenas no seu dispositivo.
        </p>
      </div>
    </div>
  );
};

export default IpSetupPage;
