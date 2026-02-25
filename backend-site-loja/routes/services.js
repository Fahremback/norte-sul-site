const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/services
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(services.map(s => ({...s, price: Number(s.price)})));
  } catch (error) {
    next(error);
  }
});

// POST /api/services - Admin
router.post('/', authMiddleware, adminMiddleware, async (req, res, next) => {
    const { name, description, price } = req.body;
    try {
        const newService = await prisma.service.create({
            data: { name, description, price, userId: req.user.id }
        });
        res.status(201).json(newService);
    } catch(error) {
        next(error);
    }
});

module.exports = router;
