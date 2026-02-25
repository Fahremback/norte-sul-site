
const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// GET all purchase requests (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const requests = await prisma.purchaseRequest.findMany({
            orderBy: { createdAt: 'desc' },
            include: { items: true, user: { select: { name: true } } },
        });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch purchase requests.' });
    }
});

// POST a new purchase request
router.post('/', authMiddleware, async (req, res) => {
    const { items, globalNotes } = req.body;
    try {
        const newRequest = await prisma.purchaseRequest.create({
            data: {
                userId: req.user.id,
                globalNotes,
                status: 'Pendente',
                items: {
                    create: items.map((item) => ({
                        itemName: item.itemName,
                        quantity: item.quantity,
                    })),
                },
            },
            include: { items: true },
        });
        res.status(201).json(newRequest);
    } catch (error) {
        console.error("Error creating purchase request:", error);
        res.status(500).json({ message: 'Failed to create purchase request.' });
    }
});

// PUT (update) a purchase request (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    const { status, globalNotes } = req.body;
    try {
        const updatedRequest = await prisma.purchaseRequest.update({
            where: { id },
            data: {
                status,
                globalNotes,
            },
            include: { items: true },
        });
        res.json(updatedRequest);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Purchase request not found.' });
        }
        res.status(500).json({ message: 'Failed to update purchase request.' });
    }
});

// DELETE a purchase request (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.purchaseRequest.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Purchase request not found.' });
        }
        res.status(500).json({ message: 'Failed to delete purchase request.' });
    }
});

module.exports = router;
