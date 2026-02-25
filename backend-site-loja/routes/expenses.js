const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/expenses
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
    });
    res.json(expenses.map(e => ({...e, amount: Number(e.amount)})));
  } catch (error) {
    next(error);
  }
});

// POST /api/expenses
router.post('/', authMiddleware, async (req, res, next) => {
  const { description, amount, date, category } = req.body;
  try {
    const newExpense = await prisma.expense.create({
      data: {
        description,
        amount,
        date,
        category,
        userId: req.user.id,
      },
    });
    res.status(201).json(newExpense);
  } catch (error) {
    next(error);
  }
});

// PUT /api/expenses/:id
router.put('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
    const { id } = req.params;
    const { description, amount, date, category } = req.body;
    try {
        const updatedExpense = await prisma.expense.update({
            where: { id },
            data: { description, amount: parseFloat(amount), date, category }
        });
        res.json(updatedExpense);
    } catch(error) {
        next(error);
    }
});

// DELETE /api/expenses/:id
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
    const { id } = req.params;
    try {
        await prisma.expense.delete({ where: { id } });
        res.status(204).send();
    } catch(error) {
        next(error);
    }
});

module.exports = router;
