

const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { saveImageFromBase64 } = require('../utils/imageUtils');

const router = express.Router();

// GET all pending services
router.get('/', authMiddleware, async (req, res) => {
    try {
        const services = await prisma.pendingService.findMany({
            orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        });
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch pending services.' });
    }
});

// POST a new pending service
router.post('/', authMiddleware, async (req, res) => {
    const { customerName, customerPhone, itemDescription, serviceNotes, status, priority, imageUrl, imageBase64 } = req.body;
    try {
        let finalImageUrl = imageUrl;
        if (imageBase64) {
            finalImageUrl = await saveImageFromBase64(imageBase64);
        }

        const newService = await prisma.pendingService.create({
            data: {
                customerName,
                customerPhone,
                itemDescription,
                serviceNotes,
                status,
                priority: Number(priority),
                imageUrl: finalImageUrl,
                userId: req.user.id,
            },
        });
        res.status(201).json(newService);
    } catch (error) {
        console.error("Error creating pending service:", error);
        res.status(500).json({ message: 'Failed to create pending service.' });
    }
});

// PUT (update) a pending service
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { customerName, customerPhone, itemDescription, serviceNotes, status, priority, imageUrl, imageBase64 } = req.body;
    try {
        let finalImageUrl = imageUrl;
        if (imageBase64) {
            finalImageUrl = await saveImageFromBase64(imageBase64);
        } else if (imageUrl === null) {
            finalImageUrl = null;
        }

        const updatedService = await prisma.pendingService.update({
            where: { id },
            data: {
                customerName,
                customerPhone,
                itemDescription,
                serviceNotes,
                status,
                priority: Number(priority),
                imageUrl: finalImageUrl,
            },
        });
        res.json(updatedService);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Service not found.' });
        }
        res.status(500).json({ message: 'Failed to update pending service.' });
    }
});

// DELETE a pending service
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.pendingService.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Service not found.' });
        }
        res.status(500).json({ message: 'Failed to delete pending service.' });
    }
});

module.exports = router;