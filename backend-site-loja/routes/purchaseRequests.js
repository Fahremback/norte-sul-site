const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// GET all purchase requests (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const requests = await prisma.purchaseRequest.findMany({
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Falha ao buscar requisições de compra.' });
    }
});

// POST a new purchase request
router.post('/', authMiddleware, async (req, res) => {
    const { items, globalNotes } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Uma requisição de compra deve ter pelo menos um item.' });
    }

    try {
        const newRequest = await prisma.purchaseRequest.create({
            data: {
                userId: req.user.id,
                globalNotes,
                status: 'Pendente',
                items: {
                    create: items.map(item => ({
                        itemName: item.itemName,
                        quantity: item.quantity,
                    }))
                }
            },
            include: { items: true }
        });
        res.status(201).json(newRequest);
    } catch (error) {
        console.error("Error creating purchase request:", error);
        res.status(400).json({ message: 'Não foi possível criar a requisição de compra.' });
    }
});

// PUT update a purchase request status (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    const { status, globalNotes } = req.body;

    try {
        const updatedRequest = await prisma.purchaseRequest.update({
            where: { id },
            data: { status, globalNotes },
            include: { items: true }
        });
        res.json(updatedRequest);
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Requisição não encontrada.' });
        res.status(400).json({ message: 'Falha ao atualizar requisição.' });
    }
});

// DELETE a purchase request (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await prisma.$transaction(async (tx) => {
            await tx.purchaseRequestItem.deleteMany({ where: { purchaseRequestId: req.params.id } });
            await tx.purchaseRequest.delete({ where: { id: req.params.id } });
        });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Requisição não encontrada.' });
        res.status(500).json({ message: 'Falha ao deletar requisição.' });
    }
});


module.exports = router;
