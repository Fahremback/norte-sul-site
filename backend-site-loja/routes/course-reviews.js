const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

// POST a new course review
router.post('/:courseId', authMiddleware, async (req, res, next) => {
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'A avaliação deve ser um número entre 1 e 5.' });
    }
    if (!comment || comment.trim() === '') {
        return res.status(400).json({ message: 'O comentário é obrigatório.' });
    }

    try {
        // Check if user has access to this course (either by purchase or admin approval)
        const hasAccess = await prisma.approvedCourseAccess.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        });

        if (!hasAccess) {
            return res.status(403).json({ message: 'Você precisa ter acesso a este curso para avaliá-lo.' });
        }

        // Create the review
        const newReview = await prisma.courseReview.create({
            data: {
                rating: parseInt(rating, 10),
                comment,
                courseId,
                userId,
            },
        });

        res.status(201).json(newReview);
    } catch (error) {
        if (error.code === 'P2002') { // Unique constraint failed
             return res.status(409).json({ message: 'Você já avaliou este curso.' });
        }
        next(error);
    }
});

module.exports = router;
