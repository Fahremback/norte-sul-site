
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// POST /api/tickets - Create a new ticket (public)
router.post('/', async (req, res) => {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Nome, e-mail e mensagem são obrigatórios.' });
    }
    try {
        const ticket = await prisma.ticket.create({
            data: { name, email, phone, message, status: 'OPEN' },
        });
        res.status(201).json(ticket);
    } catch (error) {
        console.error('Erro ao criar ticket:', error);
        res.status(500).json({ message: 'Falha ao enviar sua mensagem.' });
    }
});

// GET /api/tickets - Get all tickets (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(tickets);
    } catch (error) {
        console.error('Erro ao buscar tickets:', error);
        res.status(500).json({ message: 'Falha ao buscar os tickets.' });
    }
});

// PATCH /api/tickets/:id/status - Update a ticket status (admin only)
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['OPEN', 'CLOSED'].includes(status)) {
        return res.status(400).json({ message: 'Status inválido. Use "OPEN" ou "CLOSED".' });
    }
    try {
        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: { status },
        });
        res.json(updatedTicket);
    } catch (error) {
        console.error(`Erro ao atualizar ticket ${id}:`, error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Ticket não encontrado.' });
        }
        res.status(500).json({ message: 'Falha ao atualizar o ticket.' });
    }
});

// DELETE /api/tickets/:id - Delete a ticket (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.ticket.delete({
            where: { id },
        });
        res.status(204).send();
    } catch (error) {
        console.error(`Erro ao deletar ticket ${id}:`, error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Ticket não encontrado.' });
        }
        res.status(500).json({ message: 'Falha ao deletar o ticket.' });
    }
});

module.exports = router;
