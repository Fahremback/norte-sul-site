// backend-site-loja/lib/config.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let configCache = null;

// Carrega a configuração do banco de dados para o cache
async function loadConfig() {
    try {
        const dbSettings = await prisma.siteSettings.findUnique({
            where: { id: 'singleton' },
        });

        if (!dbSettings) {
            console.warn("Nenhuma configuração encontrada no banco de dados. Usando fallbacks de ambiente.");
            configCache = { ...process.env };
            return;
        }

        // Configurações do DB têm prioridade sobre ENV, exceto para DATABASE_URL e PORT
        configCache = {
            ...process.env, // Fallback
            ...dbSettings,  // Valores do DB
        };
        
        console.log("Configurações da aplicação carregadas do banco de dados.");

    } catch (error) {
        console.error("ERRO FATAL: Não foi possível carregar as configurações do banco de dados. Verifique a conexão e as migrações.", error);
        // Em caso de falha, usa apenas ENV para tentar manter o servidor no ar
        configCache = { ...process.env };
    }
}

// Recarrega a configuração (usado após salvar no painel de admin)
async function reloadConfig() {
    await loadConfig();
}

// Obtém a configuração cacheada
function getConfig() {
    if (!configCache) {
        throw new Error("A configuração não foi carregada. Chame loadConfig() na inicialização do servidor.");
    }
    return configCache;
}

module.exports = {
    loadConfig,
    reloadConfig,
    getConfig,
};
