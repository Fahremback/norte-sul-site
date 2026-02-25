
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const axios = require('axios');

const prisma = new PrismaClient();
const router = express.Router();

// Helper to serialize Decimal fields to Number to avoid JSON issues
const serializeOrder = (order) => {
    if (!order) return null;
    return {
        ...order,
        totalAmount: Number(order.totalAmount),
        items: order.items?.map(item => ({
            ...item,
            price: Number(item.price)
        })) || []
    };
};

// GET: Rota para buscar TODOS os pedidos (apenas admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { name: true, email: true, phone: true } // Adicionado 'phone'
                },
                items: {
                    include: {
                        product: {
                            select: { name: true }
                        },
                        course: {
                           select: { title: true }
                        }
                    }
                }
            }
        });
        // A serialização já acontece, vamos garantir que o user seja passado corretamente
        const serializedOrders = orders.map(order => ({
            ...serializeOrder(order),
            user: order.user // Garante que o objeto user com telefone seja mantido
        }));
        res.json(serializedOrders);
    } catch (error) {
        console.error("Erro ao buscar todos os pedidos:", error);
        res.status(500).json({ message: 'Falha ao buscar pedidos.' });
    }
});

// GET: Rota para o usuário buscar seus próprios pedidos
router.get('/my-orders', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    try {
        const orders = await prisma.order.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: {
                        product: {
                            select: { name: true, imageUrls: true }
                        },
                        course: {
                           select: { title: true, imageUrl: true }
                        }
                    }
                }
            }
        });

        const serializedOrders = orders.map(order => ({
            id: order.id,
            createdAt: order.createdAt,
            status: order.status,
            totalAmount: Number(order.totalAmount),
            paymentMethod: order.paymentMethod,
            paymentId: order.paymentId, 
            customerName: order.customerName,
            shippingAddress: order.shippingAddress,
            shippingCity: order.shippingCity,
            shippingState: order.shippingState,
            shippingPostalCode: order.shippingPostalCode,
            trackingCode: order.trackingCode,
            trackingUrl: order.trackingUrl,
            items: order.items.map(item => {
                const newItem = { ...item, price: Number(item.price) };
                if (newItem.product && newItem.product.imageUrls) {
                    // Create a new product object to avoid modifying the original from prisma result
                    newItem.product = {
                        name: newItem.product.name,
                        imageUrl: newItem.product.imageUrls[0] || null
                    };
                }
                return newItem;
            })
        }));

        res.json(serializedOrders);
    } catch (error) {
        console.error(`Erro ao buscar pedidos para o usuário ${userId}:`, error);
        res.status(500).json({ message: 'Falha ao buscar seus pedidos.' });
    }
});

// GET: Check if user has purchased a specific product
router.get('/my-orders/has-purchased/:productId', authMiddleware, async (req, res, next) => {
    const { productId } = req.params;
    const userId = req.user.id;

    try {
        const purchaseCount = await prisma.order.count({
            where: {
                userId,
                status: 'PAID', // Or other completed statuses
                items: {
                    some: {
                        productId,
                    },
                },
            },
        });
        res.json({ hasPurchased: purchaseCount > 0 });
    } catch (error) {
        next(error);
    }
});


// POST: Rota para o usuário cancelar seu próprio pedido
router.post('/:id/cancel', authMiddleware, async (req, res) => {
    const { id: orderId } = req.params;
    const { id: userId } = req.user;

    try {
        const order = await prisma.order.findFirst({
            where: { id: orderId, userId: userId }
        });
        
        if (!order) {
            return res.status(404).json({ message: 'Pedido não encontrado ou não pertence a este usuário.' });
        }
        
        if (order.status !== 'PENDING') {
            return res.status(400).json({ message: 'Apenas pedidos pendentes podem ser cancelados.' });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: 'CANCELED' }
        });

        res.json({ message: 'Pedido cancelado com sucesso.', order: updatedOrder });

    } catch (error) {
        console.error(`Erro ao cancelar pedido ${orderId}:`, error);
        res.status(500).json({ message: 'Falha ao cancelar o pedido.' });
    }
});

// PATCH: Rota para admin adicionar/atualizar código de rastreio
router.patch('/:id/tracking', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    const { trackingCode } = req.body;

    if (!trackingCode) {
        return res.status(400).json({ message: 'Código de rastreio é obrigatório.' });
    }

    try {
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
                trackingCode: trackingCode,
                trackingUrl: `https://www2.correios.com.br/sistemas/rastreamento/resultado_semcontent.cfm?objetos=${trackingCode}`
            }
        });
        res.json(serializeOrder(updatedOrder));
    } catch (error) {
        console.error(`Erro ao atualizar rastreio do pedido ${id}:`, error);
        res.status(500).json({ message: 'Falha ao atualizar o rastreamento.' });
    }
});

// PATCH: Rota para admin atualizar status do pedido
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status é obrigatório.' });
    }

    try {
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status },
        });
        res.json(serializeOrder(updatedOrder));
    } catch (error) {
        console.error(`Erro ao atualizar status do pedido ${id}:`, error);
        res.status(500).json({ message: 'Falha ao atualizar o status.' });
    }
});


// POST: Rota para tentar um novo pagamento para um pedido pendente
router.post('/:id/retry-payment', authMiddleware, async (req, res) => {
    const { id: orderId } = req.params;
    const { id: userId } = req.user;
    const { paymentMethod, creditCard } = req.body;

    try {
        const order = await prisma.order.findFirst({
            where: { id: orderId, userId: userId },
        });

        if (!order) {
            return res.status(404).json({ message: 'Pedido não encontrado ou acesso não permitido.' });
        }
        if (order.status !== 'PENDING' && order.status !== 'CANCELED') {
            return res.status(400).json({ message: 'Este pedido não está pendente ou cancelado.' });
        }

        const settings = await prisma.siteSettings.findFirst();
        const asaasApiKey = settings?.asaasApiKey || process.env.ASAAS_API_KEY;
        
        if (!asaasApiKey || asaasApiKey.includes('SUA_CHAVE')) {
            return res.status(500).json({ message: 'Chave da API de pagamento não configurada.' });
        }

        const userProfile = await prisma.user.findUnique({
            where: { id: userId },
            include: { addresses: { orderBy: { createdAt: 'desc' }, take: 1 } }
        });
        
        if (!userProfile?.asaasCustomerId) {
             return res.status(400).json({ message: 'Cliente não encontrado no provedor de pagamento. Tente atualizar seu perfil.' });
        }

        await axios.post(`https://www.asaas.com/api/v3/customers/${userProfile.asaasCustomerId}`, {
            name: order.customerName,
            cpfCnpj: order.customerCpfCnpj,
        }, { headers: { 'access_token': asaasApiKey } }).catch(err => {
            console.warn("Aviso: Falha ao tentar atualizar cliente no Asaas (pode ser ignorado):", err.response?.data || err.message);
        });
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const paymentPayload = {
            customer: userProfile.asaasCustomerId,
            billingType: paymentMethod,
            value: Number(order.totalAmount),
            dueDate: tomorrow.toISOString().split('T')[0],
            description: `Pagamento Pedido #${order.id.substring(0,8)} - ${settings?.siteName || 'Norte Sul Informática'}`,
            externalReference: order.id,
        };

        if (paymentMethod === 'CREDIT_CARD' && creditCard) {
            paymentPayload.creditCard = {
                holderName: creditCard.holderName,
                number: creditCard.number.replace(/\s/g, ''),
                expiryMonth: creditCard.expiryMonth,
                expiryYear: creditCard.expiryYear,
                ccv: creditCard.ccv,
            };
            paymentPayload.creditCardHolderInfo = {
                name: userProfile.name,
                email: userProfile.email,
                cpfCnpj: userProfile.cpfCnpj,
                postalCode: userProfile.addresses[0]?.cep || order.shippingPostalCode,
                addressNumber: userProfile.addresses[0]?.number || '',
                phone: userProfile.phone,
            };
        }

        const paymentResponse = await axios.post('https://www.asaas.com/api/v3/payments', paymentPayload, { headers: { 'access_token': asaasApiKey } });
        const paymentData = paymentResponse.data;
        
        await prisma.order.update({ 
            where: { id: order.id }, 
            data: { 
                paymentId: paymentData.id, 
                status: paymentData.status
            } 
        });

        const responsePayload = { status: paymentData.status, message: 'Nova cobrança gerada com sucesso.'};
        if (paymentMethod === 'PIX') {
            responsePayload.pixCopiaCola = paymentData.pixQrCode.payload;
        } else if (paymentMethod === 'BOLETO') {
            responsePayload.boletoUrl = paymentData.bankSlipUrl;
        }

        res.json(responsePayload);

    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`Erro ao tentar novo pagamento para pedido ${orderId}:`, errorMessage);
        res.status(500).json({ message: `Falha ao tentar novo pagamento. Detalhes: ${errorMessage}` });
    }
});


module.exports = router;
