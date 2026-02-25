const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// GET all pending services
router.get('/', authMiddleware, async (req, res) => {
    try {
        const services = await prisma.pendingService.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: 'Falha ao buscar serviços pendentes.' });
    }
});

// POST a new pending service
router.post('/', authMiddleware, async (req, res) => {
    const { customerName, itemDescription, serviceNotes, status, priority } = req.body;
    if (!customerName || !itemDescription) {
        return res.status(400).json({ message: 'Nome do cliente e descrição do item são obrigatórios.' });
    }

    try {
        const newService = await prisma.pendingService.create({
            data: {
                ...req.body,
                userId: req.user.id,
            },
        });
        res.status(201).json(newService);
    } catch (error) {
        res.status(400).json({ message: 'Falha ao criar serviço pendente.' });
    }
});

// PUT update a pending service
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { customerName, itemDescription, serviceNotes, status, priority } = req.body;

    try {
        const updatedService = await prisma.pendingService.update({
            where: { id },
            data: { customerName, itemDescription, serviceNotes, status, priority },
        });
        res.json(updatedService);
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Serviço não encontrado.' });
        res.status(400).json({ message: 'Falha ao atualizar serviço.' });
    }
});

// DELETE a pending service
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await prisma.pendingService.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Serviço não encontrado.' });
        res.status(500).json({ message: 'Falha ao deletar serviço.' });
    }
});

module.exports = router;
