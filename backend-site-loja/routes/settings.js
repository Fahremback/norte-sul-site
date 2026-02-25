const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { reloadConfig, getConfig } = require('../lib/config');

const prisma = new PrismaClient();
const router = express.Router();

const getOrCreateSettings = async () => {
    let settings = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } });
    if (!settings) {
        settings = await prisma.siteSettings.create({
            data: { id: 'singleton', siteName: 'Norte Sul Informática' },
        });
    }
    return settings;
};

// GET /api/settings - Rota pública
router.get('/', async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        // Retorna apenas dados públicos, mascarando chaves sensíveis
        res.json({
            siteName: settings.siteName,
            siteDescription: settings.siteDescription,
            logoUrl: settings.logoUrl,
            faviconUrl: settings.faviconUrl,
            contactPhone: settings.contactPhone,
            contactEmail: settings.contactEmail,
            storeAddress: settings.address,
            storeHours: settings.storeHours,
            facebookUrl: settings.facebookUrl,
            instagramUrl: settings.instagramUrl,
            maintenanceMode: settings.maintenanceMode,
        });
    } catch (error) {
        res.status(500).json({ message: 'Falha ao carregar configurações.' });
    }
});

// GET /api/settings/admin - Rota protegida para admin
router.get('/admin', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const settings = await getOrCreateSettings();

        // Create a copy to send to the client, masking sensitive values
        const clientSettings = { ...settings };
        const SENSITIVE_PLACEHOLDER = "Já configurado.";
        
        const sensitiveKeys = [
            'asaasApiKey', 'asaasWebhookSecret', 'jwtSecret', 'emailPass',
            'geminiApiKey'
        ];

        for (const key of sensitiveKeys) {
            if (clientSettings[key] && clientSettings[key].trim() !== '') {
                clientSettings[key] = SENSITIVE_PLACEHOLDER;
            }
        }
        
        res.json(clientSettings);
    } catch (error) {
        console.error("Error loading admin settings:", error);
        res.status(500).json({ message: 'Falha ao carregar configurações de administrador.' });
    }
});

// POST /api/settings - Rota para salvar configurações (admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    const settingsData = req.body;
    
    // Mapeia o campo do frontend para o do banco de dados, se existir
    if (settingsData.storeAddress !== undefined) {
        settingsData.address = settingsData.storeAddress;
        delete settingsData.storeAddress;
    }

    // Converte a porta para número, se presente
    if(settingsData.emailPort !== undefined && settingsData.emailPort !== null) {
        settingsData.emailPort = parseInt(String(settingsData.emailPort), 10);
        if (isNaN(settingsData.emailPort)) {
            delete settingsData.emailPort; // remove if not a valid number
        }
    }

    // Remove campos que não devem ser sobrescritos se estiverem vazios
    const sensitiveKeys = [
        'asaasApiKey', 'asaasWebhookSecret', 'jwtSecret', 'emailPass',
        'geminiApiKey'
    ];
    sensitiveKeys.forEach(key => {
        if (settingsData[key] === '' || settingsData[key] === null) {
            delete settingsData[key];
        }
    });
    
    // Remove campos que não devem ser atualizados diretamente
    delete settingsData.id;
    delete settingsData.createdAt;
    delete settingsData.updatedAt;

    try {
        const updatedSettings = await prisma.siteSettings.update({
            where: { id: 'singleton' },
            data: settingsData,
        });

        // Recarrega a configuração no cache do servidor
        await reloadConfig();
        
        res.json({ message: "Configurações salvas com sucesso!", settings: updatedSettings });
    } catch (error) {
        console.error("Erro ao salvar configurações:", error);
        res.status(500).json({ message: 'Falha ao salvar as configurações.' });
    }
});

module.exports = router;
