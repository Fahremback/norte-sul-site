const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getConfig } = require('../lib/config');

const prisma = new PrismaClient();
const router = express.Router();

async function findOrCreateAsaasCustomer(user, asaasApiKey) {
    if (user.asaasCustomerId) {
        try {
            const response = await axios.get(`https://www.asaas.com/api/v3/customers/${user.asaasCustomerId}`, { headers: { 'access_token': asaasApiKey } });
            return response.data.id;
        } catch (error) {
            console.warn(`Asaas customer ID ${user.asaasCustomerId} not found. Creating a new one.`);
        }
    }

    try {
        const response = await axios.post('https://www.asaas.com/api/v3/customers', {
            name: user.name,
            email: user.email,
            cpfCnpj: user.cpfCnpj,
            externalReference: user.id
        }, { headers: { 'access_token': asaasApiKey } });
        
        await prisma.user.update({
            where: { id: user.id },
            data: { asaasCustomerId: response.data.id }
        });
        return response.data.id;
    } catch (error) {
        if (error.response?.data?.errors?.some(e => e.code === 'invalid_cpfCnpj')) {
            const searchResponse = await axios.get(`https://www.asaas.com/api/v3/customers?cpfCnpj=${user.cpfCnpj}`, { headers: { 'access_token': asaasApiKey }});
            if (searchResponse.data?.data?.length > 0) {
                const customerId = searchResponse.data.data[0].id;
                await prisma.user.update({ where: { id: user.id }, data: { asaasCustomerId: customerId } });
                return customerId;
            }
        }
        throw new Error(`Falha ao registrar cliente no Asaas: ${JSON.stringify(error.response?.data)}`);
    }
}

router.post('/custom', authMiddleware, async (req, res) => {
    const { planDetails, paymentInfo } = req.body;
    const { creditCard, holderInfo } = paymentInfo;
    const { user } = req;

    if (!planDetails || !creditCard || !holderInfo) {
        return res.status(400).json({ message: 'Dados do plano ou de pagamento incompletos.' });
    }

    try {
        const { asaasApiKey } = getConfig();
        if (!asaasApiKey) {
            return res.status(500).json({ message: 'Chave da API de pagamento não configurada.' });
        }

        const customerId = await findOrCreateAsaasCustomer(user, asaasApiKey);

        const subscriptionPayload = {
            customer: customerId,
            billingType: 'CREDIT_CARD',
            nextDueDate: new Date().toISOString().split('T')[0],
            value: planDetails.price,
            cycle: 'MONTHLY',
            description: `Assinatura - ${planDetails.name}`,
            creditCard: {
                holderName: creditCard.holderName,
                number: creditCard.number.replace(/\s/g, ''),
                expiryMonth: creditCard.expiryMonth,
                expiryYear: creditCard.expiryYear,
                ccv: creditCard.ccv,
            },
            creditCardHolderInfo: {
                name: holderInfo.name,
                email: holderInfo.email,
                cpfCnpj: holderInfo.cpfCnpj,
                postalCode: holderInfo.postalCode,
                addressNumber: holderInfo.addressNumber,
                phone: holderInfo.phone,
            }
        };

        const asaasResponse = await axios.post('https://www.asaas.com/api/v3/subscriptions', subscriptionPayload, { headers: { 'access_token': asaasApiKey } });
        const asaasSub = asaasResponse.data;

        const newSubscription = await prisma.subscription.create({
            data: {
                userId: user.id,
                customPlanDetails: planDetails.answers,
                asaasSubscriptionId: asaasSub.id,
                status: asaasSub.status,
                billingType: asaasSub.billingType,
                nextDueDate: new Date(asaasSub.nextDueDate),
            },
        });

        res.status(201).json(newSubscription);

    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error('Erro ao criar assinatura:', errorMessage);
        res.status(500).json({ message: `Falha ao criar assinatura. Detalhes: ${errorMessage}` });
    }
});

module.exports = router;
