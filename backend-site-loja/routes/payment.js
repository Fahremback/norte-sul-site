
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getConfig } = require('../lib/config');
const ApiError = require('../utils/ApiError');

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
                 await prisma.user.update({
                    where: { id: user.id },
                    data: { asaasCustomerId: customerId }
                });
                return customerId;
            }
        }
        console.error("Asaas customer creation/fetch error:", error.response ? error.response.data : error.message);
        throw new Error('Falha na comunicação com o provedor de pagamento para registrar o cliente.');
    }
}

router.post('/initiate', authMiddleware, async (req, res, next) => {
    const { cartItems, totalAmount, paymentMethod, address, buyerInfo, creditCard, creditCardHolderInfo } = req.body;
    const userId = req.user.id;

    if (!cartItems || cartItems.length === 0 || !totalAmount || !paymentMethod || !address || !buyerInfo) {
        return next(new ApiError(400, 'Dados do pedido, endereço ou comprador inválidos.'));
    }
    
    try {
        const config = getConfig();
        const asaasApiKey = config.asaasApiKey;

        if (!asaasApiKey) {
            return next(new ApiError(500, 'Chave da API de pagamento não configurada no servidor.'));
        }
        
        const userWithData = await prisma.user.findUnique({ where: { id: userId } });
        if(!userWithData) throw new ApiError(404, "Usuário não encontrado.");
        
        const customerDataForAsaas = { id: userWithData.id, asaasCustomerId: userWithData.asaasCustomerId, name: buyerInfo.name, email: buyerInfo.email, cpfCnpj: buyerInfo.cpfCnpj };
        const customerId = await findOrCreateAsaasCustomer(customerDataForAsaas, asaasApiKey);

        const newOrder = await prisma.$transaction(async (tx) => {
            for (const item of cartItems) {
                if (item.itemType === 'PRODUCT') {
                    const product = await tx.product.findUnique({ where: { id: item.id } });
                    if (!product || product.stock < item.quantity) {
                        throw new ApiError(400, `Estoque insuficiente para ${item.name}. Disponível: ${product?.stock || 0}`);
                    }
                    await tx.product.update({
                        where: { id: item.id },
                        data: { stock: { decrement: item.quantity } },
                    });
                }
            }

            const createdOrder = await tx.order.create({
                data: {
                    userId, totalAmount, status: 'PENDING', paymentMethod,
                    customerName: buyerInfo.name, customerEmail: buyerInfo.email, customerCpfCnpj: buyerInfo.cpfCnpj,
                    shippingAddress: `${address.street}, ${address.number} ${address.complement || ''}`,
                    shippingCity: address.city, shippingState: address.state, shippingPostalCode: address.cep,
                    items: {
                        create: cartItems.map(item => ({
                            productId: item.itemType === 'PRODUCT' ? item.id : undefined,
                            courseId: item.itemType === 'COURSE' ? item.id : undefined,
                            quantity: item.quantity, price: item.price,
                        })),
                    },
                },
            });

            return createdOrder;
        });


        const now = new Date();
        let dueDate;
        
        if (paymentMethod === 'BOLETO') {
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            dueDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
        } else {
            dueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        }

        const paymentPayload = {
            customer: customerId,
            billingType: paymentMethod,
            value: totalAmount,
            dueDate: dueDate,
            description: `Pedido #${newOrder.id} - ${config.siteName || 'Norte Sul Informática'}`,
            externalReference: newOrder.id,
        };
        
        if (paymentMethod === 'CREDIT_CARD') {
            paymentPayload.creditCard = { holderName: creditCard.holderName, number: creditCard.number.replace(/\s/g, ''), expiryMonth: creditCard.expiryMonth, expiryYear: creditCard.expiryYear, ccv: creditCard.ccv };
            paymentPayload.creditCardHolderInfo = { name: creditCardHolderInfo.name, email: creditCardHolderInfo.email, cpfCnpj: creditCardHolderInfo.cpfCnpj, postalCode: creditCardHolderInfo.postalCode, addressNumber: creditCardHolderInfo.addressNumber, phone: creditCardHolderInfo.phone };
        }

        const paymentResponse = await axios.post('https://www.asaas.com/api/v3/payments', paymentPayload, { headers: { 'access_token': asaasApiKey } });
        const paymentData = paymentResponse.data;
        
        await prisma.order.update({ where: { id: newOrder.id }, data: { paymentId: paymentData.id, status: paymentData.status } });

        res.json(paymentData);

    } catch (error) {
        next(error);
    }
});

router.get('/:paymentId/details', authMiddleware, async (req, res, next) => {
    const { paymentId } = req.params;
    const { user } = req;

    try {
        const { asaasApiKey } = getConfig();
        if (!asaasApiKey) return next(new ApiError(500, 'Chave da API de pagamento não configurada.'));

        const order = await prisma.order.findFirst({ where: { paymentId, userId: user.id } });
        if (!order) return next(new ApiError(404, 'Detalhes de pagamento não encontrados ou acesso não permitido.'));

        const response = await axios.get(`https://www.asaas.com/api/v3/payments/${paymentId}`, { headers: { 'access_token': asaasApiKey } });
        res.json(response.data);
    } catch (error) {
        next(error);
    }
});

router.post('/webhook/asaas-confirmation', async (req, res) => {
    const { event, payment, subscription } = req.body;
    if (!event || (!payment && !subscription)) return res.status(400).send('Corpo do webhook inválido.');

    const entity = payment || subscription;
    const asaasId = entity.id;

    try {
        if(payment) {
            const orderId = entity.externalReference;
            if (!orderId) return res.status(400).send('Referência externa não encontrada no webhook.');
            
            const order = await prisma.order.findUnique({ where: { id: orderId } });
            if (!order) return res.status(404).send('Pedido não encontrado.');
            if (order.status === 'PAID') return res.status(200).send('Pedido já processado.');
            
            let newStatus = order.status;
            if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') newStatus = 'PAID';
            else if (['PAYMENT_OVERDUE', 'PAYMENT_DELETED'].includes(event)) newStatus = 'CANCELED';
            
            if (newStatus !== order.status) {
                await prisma.order.update({ where: { id: orderId }, data: { status: newStatus } });
            }
        } else if (subscription) {
             const sub = await prisma.subscription.findFirst({ where: { asaasSubscriptionId: asaasId } });
             if (sub) await prisma.subscription.update({ where: { id: sub.id }, data: { status: entity.status, nextDueDate: new Date(entity.nextDueDate) } });
        }
        res.status(200).send('Webhook processado.');
    } catch (error) {
        console.error('Erro ao processar webhook do Asaas:', error);
        res.status(500).send('Erro interno ao processar webhook.');
    }
});

module.exports = router;
