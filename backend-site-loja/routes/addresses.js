const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// GET all addresses for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const addresses = await prisma.address.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json(addresses);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ message: 'Failed to fetch addresses.' });
    }
});

// POST a new address for the logged-in user
router.post('/', authMiddleware, async (req, res) => {
    const { cep, street, number, complement, neighborhood, city, state, type, contactName, contactPhone } = req.body;
    try {
        const newAddress = await prisma.address.create({
            data: {
                userId: req.user.id,
                cep,
                street,
                number,
                complement,
                neighborhood,
                city,
                state,
                type,
                contactName,
                contactPhone
            }
        });
        res.status(201).json(newAddress);
    } catch (error) {
        console.error('Error creating address:', error);
        res.status(500).json({ message: 'Failed to create address.' });
    }
});

module.exports = router;