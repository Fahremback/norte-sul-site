
const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

// POST a new question
router.post('/:productId', authMiddleware, async (req, res, next) => {
    const { productId } = req.params;
    const { question } = req.body;
    const userId = req.user.id;

    if (!question || question.trim() === '') {
        return res.status(400).json({ message: 'A pergunta não pode estar vazia.' });
    }

    try {
        const newQuestion = await prisma.productQuestion.create({
            data: {
                question,
                productId,
                userId,
            },
        });
        res.status(201).json(newQuestion);
    } catch (error) {
        next(error);
    }
});

// POST an answer to a question (admin only)
router.post('/:questionId/answer', authMiddleware, adminMiddleware, async (req, res, next) => {
    const { questionId } = req.params;
    const { answer } = req.body;

     if (!answer || answer.trim() === '') {
        return res.status(400).json({ message: 'A resposta não pode estar vazia.' });
    }

    try {
        const updatedQuestion = await prisma.productQuestion.update({
            where: { id: questionId },
            data: {
                answer,
                answeredAt: new Date(),
            },
        });
        res.json(updatedQuestion);
    } catch (error) {
        next(error);
    }
});


module.exports = router;
