
const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

// POST a new review
router.post('/:productId', authMiddleware, async (req, res, next) => {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'A avaliação deve ser um número entre 1 e 5.' });
    }
     if (!title || !comment) {
        return res.status(400).json({ message: 'Título e comentário são obrigatórios.' });
    }

    try {
        // 1. Check if user has purchased this product
        const hasPurchased = await prisma.order.count({
            where: {
                userId,
                status: 'PAID', // Or other completed statuses like 'DELIVERED'
                items: {
                    some: {
                        productId,
                    },
                },
            },
        });

        if (hasPurchased === 0) {
            return res.status(403).json({ message: 'Você precisa ter comprado este produto para avaliá-lo.' });
        }

        // 2. Create the review
        const newReview = await prisma.productReview.create({
            data: {
                rating: parseInt(rating, 10),
                title,
                comment,
                productId,
                userId,
            },
        });

        res.status(201).json(newReview);
    } catch (error) {
        if (error.code === 'P2002') {
             return res.status(409).json({ message: 'Você já avaliou este produto.' });
        }
        next(error);
    }
});

module.exports = router;
