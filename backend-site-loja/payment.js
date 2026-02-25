
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { authMiddleware } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// Função para obter ou criar um cliente no Asaas.
async function findOrCreateAsaasCustomer(user, asaasApiKey) {
    if (user.asaasCustomerId) {
        try {
            // Verifica se o cliente ainda existe no Asaas
            const response = await axios.get(`https://www.asaas.com/api/v3/customers/${user.asaasCustomerId}`, { headers: { 'access_token': asaasApiKey } });
            return response.data.id;
        } catch (error) {
            // Se não encontrou, o ID pode ser inválido, então criaremos um novo.
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
        
        // Salva o novo ID do cliente Asaas no nosso banco
        await prisma.user.update({
            where: { id: user.id },
            data: { asaasCustomerId: response.data.id }
        });
        
        return response.data.id;
    } catch (error) {
        // Se o cliente já existe com o mesmo CPF/CNPJ
        if (error.response && error.response.data && error.response.data.errors) {
            const cpfError = error.response.data.errors.find(e => e.code === 'invalid_cpfCnpj');
            if (cpfError) {
                // Tenta buscar o cliente pelo CPF/CNPJ
                const searchResponse = await axios.get(`https://www.asaas.com/api/v3/customers?cpfCnpj=${user.cpfCnpj}`, { headers: { 'access_token': asaasApiKey }});
                if (searchResponse.data && searchResponse.data.data.length > 0) {
                    const customerId = searchResponse.data.data[0].id;
                     await prisma.user.update({
                        where: { id: user.id },
                        data: { asaasCustomerId: customerId }
                    });
                    return customerId;
                }
            }
        }
        console.error("Asaas customer creation/fetch error:", error.response ? error.response.data : error.message);
        throw new Error('Falha na comunicação com o provedor de pagamento para registrar o cliente.');
    }
}


// Rota unificada para iniciar pagamentos
router.post('/initiate', authMiddleware, async (req, res) => {
    const { 
        cartItems, 
        totalAmount, 
        paymentMethod,
        customerName,
        customerEmail,
        customerCpfCnpj,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingPostalCode,
        saveInfo,
        creditCard,
        creditCardHolderInfo
    } = req.body;
    const userId = req.user.id;

    if (!cartItems || cartItems.length === 0 || !totalAmount || !paymentMethod) {
        return res.status(400).json({ message: 'Dados do pedido inválidos.' });
    }
    
    try {
        const settings = await prisma.siteSettings.findFirst();
        const asaasApiKey = settings?.asaasApiKey || process.env.ASAAS_API_KEY;

        if (!asaasApiKey || asaasApiKey.includes('SUA_CHAVE')) {
            return res.status(500).json({ message: 'Chave da API de pagamento não configurada no servidor.' });
        }
        
        // Atualiza perfil do usuário se `saveInfo` for true
        if (saveInfo) {
            const addressParts = shippingAddress.split(',');
            await prisma.user.update({
                where: { id: userId },
                data: {
                    name: customerName,
                    cpfCnpj: customerCpfCnpj,
                    addressStreet: addressParts[0].trim(),
                    addressNumber: addressParts.length > 1 ? addressParts[1].trim() : 's/n',
                    addressCity: shippingCity,
                    addressState: shippingState,
                    addressPostalCode: shippingPostalCode
                }
            });
        }
        
        const userWithData = await prisma.user.findUnique({ where: { id: userId } });
        if(!userWithData) throw new Error("Usuário não encontrado.");
        
        const customerId = await findOrCreateAsaasCustomer({ ...userWithData, cpfCnpj: customerCpfCnpj, name: customerName, email: customerEmail }, asaasApiKey);

        const order = await prisma.order.create({
            data: {
                userId,
                totalAmount,
                status: 'PENDING',
                paymentMethod,
                customerName, customerEmail, customerCpfCnpj,
                shippingAddress, shippingCity, shippingState, shippingPostalCode,
                items: {
                    create: cartItems.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                },
            },
        });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const paymentPayload = {
            customer: customerId,
            billingType: paymentMethod,
            value: totalAmount,
            dueDate: tomorrow.toISOString().split('T')[0],
            description: `Pedido #${order.id} - ${settings?.siteName || 'Norte Sul Informática'}`,
            externalReference: order.id,
        };
        
        if (paymentMethod === 'CREDIT_CARD') {
            paymentPayload.creditCard = {
                holderName: creditCard.holderName,
                number: creditCard.number.replace(/\s/g, ''),
                expiryMonth: creditCard.expiryMonth,
                expiryYear: creditCard.expiryYear,
                ccv: creditCard.ccv,
            };
             paymentPayload.creditCardHolderInfo = {
                name: creditCardHolderInfo.name,
                email: creditCardHolderInfo.email,
                cpfCnpj: creditCardHolderInfo.cpfCnpj,
                postalCode: creditCardHolderInfo.postalCode,
                addressNumber: creditCardHolderInfo.addressNumber,
                phone: creditCardHolderInfo.phone,
            };
        }

        const paymentResponse = await axios.post('https://www.asaas.com/api/v3/payments', paymentPayload, { headers: { 'access_token': asaasApiKey } });
        const paymentData = paymentResponse.data;
        
        await prisma.order.update({ where: { id: order.id }, data: { paymentId: paymentData.id } });

        const responsePayload = { orderId: order.id, message: `Cobrança via ${paymentMethod} gerada com sucesso.`};
        if (paymentMethod === 'PIX') {
            responsePayload.pixQrCode = paymentData.qrCodeData.payload;
            responsePayload.pixCopiaCola = paymentData.pixCopyAndPaste;
        } else if (paymentMethod === 'BOLETO') {
            responsePayload.boletoUrl = paymentData.bankSlipUrl;
            responsePayload.boletoBarcode = paymentData.identificationField;
        }

        res.json(responsePayload);

    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error('Erro ao criar pagamento:', errorMessage);
        res.status(500).json({ message: `Falha ao criar cobrança. Detalhes: ${errorMessage}` });
    }
});


// Rota para receber Webhook do Asaas (a lógica de verificação está no server.js)
router.post('/webhook/asaas-confirmation', async (req, res) => {
    console.log('Webhook do Asaas recebido!');

    // A verificação de assinatura (req.headers['asaas-signature']) deve acontecer em um middleware
    // ou no início do server.js, usando o corpo bruto da requisição.
    // Aqui, assumimos que a requisição é válida.

    const { event, payment, subscription } = req.body;

    if (!event || (!payment && !subscription)) {
        console.warn('Webhook recebido com corpo inválido:', req.body);
        return res.status(400).send('Corpo do webhook inválido.');
    }

    const entity = payment || subscription;
    const orderId = entity.externalReference;
    const asaasId = entity.id;

    if (!orderId && !asaasId) {
        return res.status(400).send('Referência externa ou ID de assinatura não encontrado no webhook.');
    }
    
    console.log(`Evento: ${event}, Ref: ${orderId || asaasId}, Status Asaas: ${entity.status}`);
    
    try {
        if(payment) { // É um webhook de pagamento único
            const order = await prisma.order.findUnique({ where: { id: orderId } });
            if (!order) return res.status(404).send('Pedido não encontrado.');
            if (order.status === 'PAID') return res.status(200).send('Pedido já processado.');
            
            let newStatus = order.status;
            if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') newStatus = 'PAID';
            else if (['PAYMENT_OVERDUE', 'PAYMENT_DELETED'].includes(event)) newStatus = 'CANCELED';
            
            if (newStatus !== order.status) {
                await prisma.order.update({ where: { id: orderId }, data: { status: newStatus } });
                console.log(`Status do pedido ${orderId} atualizado para ${newStatus}.`);
            }
        } else if (subscription) { // É um webhook de assinatura
             const sub = await prisma.subscription.findUnique({ where: { asaasSubscriptionId: asaasId } });
             if (!sub) return res.status(404).send('Assinatura não encontrada.');

             // Aqui você atualizaria o status da assinatura no seu banco de dados
             // Ex: await prisma.subscription.update({ where: { id: sub.id }, data: { status: entity.status, nextDueDate: entity.nextDueDate } });
             console.log(`Webhook de assinatura para ${asaasId} recebido. Lógica de atualização a ser implementada.`);
        }
        
        res.status(200).send('Webhook processado com sucesso.');

    } catch (error) {
        console.error('Erro ao processar webhook do Asaas:', error);
        res.status(500).send('Erro interno ao processar webhook.');
    }
});


module.exports = router;
