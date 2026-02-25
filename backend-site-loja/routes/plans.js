const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// GET: Rota pública para buscar todos os planos ativos
router.get('/', async (req, res) => {
    try {
        const plans = await prisma.plan.findMany({
            where: { isActive: true },
            orderBy: { price: 'asc' },
        });
        res.json(plans.map(p => ({...p, price: Number(p.price) })));
    } catch (error) {
        console.error("Erro ao buscar planos:", error);
        res.status(500).json({ message: 'Falha ao buscar planos.' });
    }
});

// POST: Criar um novo plano (admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    const { name, description, price, frequency, features, isActive } = req.body;
    try {
        const newPlan = await prisma.plan.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                frequency,
                features,
                isActive,
            },
        });
        res.status(201).json({...newPlan, price: Number(newPlan.price)});
    } catch (error) {
        console.error("Erro ao criar plano:", error);
        res.status(400).json({ message: 'Não foi possível criar o plano. Verifique os dados.' });
    }
});

// PUT: Atualizar um plano (admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name, description, price, frequency, features, isActive } = req.body;
    try {
        const updatedPlan = await prisma.plan.update({
            where: { id },
            data: {
                name,
                description,
                price: parseFloat(price),
                frequency,
                features,
                isActive,
            },
        });
        res.json({...updatedPlan, price: Number(updatedPlan.price)});
    } catch (error) {
        console.error(`Erro ao atualizar plano ${id}:`, error);
        res.status(400).json({ message: 'Não foi possível atualizar o plano.' });
    }
});

module.exports = router;
