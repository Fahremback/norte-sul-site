





const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
// FIX: Import utility to handle base64 image saving, which is used in other parts of the backend.
const { saveImageFromBase64 } = require('../utils/imageUtils');

const prisma = new PrismaClient();
const router = express.Router();

// Helper to convert Prisma Decimal to Number for JSON response
const convertPriceToNumber = (item) => {
    if (item && item.price) {
        const newItem = { ...item, price: Number(item.price) };
        if (item.storePrice != null) {
            newItem.storePrice = Number(item.storePrice);
        }
        return newItem;
    }
    return item;
};

// GET all products (public)
router.get('/', async (req, res, next) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(products.map(convertPriceToNumber));
    } catch (error) {
        next(error);
    }
});

// GET a single product by ID (public)
router.get('/:id', async (req, res, next) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: {
                reviews: {
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { name: true } } }
                },
                questions: {
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { name: true } } }
                }
            }
        });
        if (product) {
            res.json(convertPriceToNumber(product));
        } else {
            res.status(404).json({ message: 'Produto não encontrado.' });
        }
    } catch (error) {
        next(error);
    }
});

// POST a new product (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const { name, description, price, imageUrls, category, stock, sku, brand, model, color, power, dimensions, weight, material, compatibility, otherSpecs, imageBase64 } = req.body;
        
        if (!name || price === undefined) {
            return res.status(400).json({ message: 'Nome e preço são campos obrigatórios.' });
        }
        
        // FIX: Handle base64 image upload by saving it and adding the URL to imageUrls.
        let finalImageUrls = imageUrls || [];
        if (imageBase64) {
            const newUrl = await saveImageFromBase64(imageBase64);
            if (newUrl) {
                finalImageUrls = [newUrl]; // Overwrite with the new image
            }
        }

        const newProduct = await prisma.product.create({
            data: {
                name,
                description: description || '',
                price: parseFloat(String(price || 0)),
                imageUrls: finalImageUrls,
                category,
                stock: parseInt(String(stock), 10) || 0,
                sku: sku || null,
                brand, model, color, power, dimensions, weight, material, compatibility, otherSpecs
            },
        });
        res.status(201).json(convertPriceToNumber(newProduct));
    } catch (error) {
        next(error);
    }
});

// PUT (update) a product (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const { name, description, price, imageUrls, category, stock, sku, brand, model, color, power, dimensions, weight, material, compatibility, otherSpecs, imageBase64 } = req.body;
        
        // FIX: Handle base64 image upload during update.
        let finalImageUrls = imageUrls;
        if (imageBase64) {
            const newUrl = await saveImageFromBase64(imageBase64);
            if (newUrl) {
                finalImageUrls = [newUrl]; // Replace current images with the new one.
            }
        }

        const dataToUpdate = {
            name, description, price: parseFloat(String(price)), imageUrls: finalImageUrls, category, stock: parseInt(String(stock), 10), sku, brand, model, color, power, dimensions, weight, material, compatibility, otherSpecs
        };

        const updatedProduct = await prisma.product.update({
            where: { id: req.params.id },
            data: dataToUpdate,
        });
        res.json(convertPriceToNumber(updatedProduct));
    } catch (error) {
        next(error);
    }
});

// DELETE a product (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
    const productId = req.params.id;
    try {
        await prisma.$transaction(async (tx) => {
            // Cascade delete related items manually if relations are not set to cascade
            await tx.productQuestion.deleteMany({ where: { productId } });
            await tx.productReview.deleteMany({ where: { productId } });
            await tx.orderItem.deleteMany({ where: { productId } });
            await tx.product.delete({ where: { id: productId } });
        });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// POST multiple products (admin only)
router.post('/bulk', authMiddleware, adminMiddleware, async (req, res, next) => {
    const products = req.body;
    try {
        const dataToCreate = products.map(p => ({
            name: p.name,
            description: p.description || '',
            price: parseFloat(String(p.price)) || 0,
            imageUrls: p.imageUrls || (p.imageUrl ? [p.imageUrl] : []),
            category: p.category || 'Geral',
            stock: p.stock !== undefined ? parseInt(String(p.stock), 10) : 0,
            sku: p.sku || null
        }));

        const result = await prisma.product.createMany({
            data: dataToCreate,
            skipDuplicates: true,
        });
        res.status(201).json({ message: `${result.count} produtos adicionados.`, count: result.count });
    } catch (error) {
        next(error);
    }
});

// DELETE multiple products (admin only)
router.delete('/bulk', authMiddleware, adminMiddleware, async (req, res, next) => {
    const { ids } = req.body;
    try {
        const result = await prisma.product.deleteMany({ where: { id: { in: ids } } });
        res.status(200).json({ message: `${result.count} produtos deletados.`, count: result.count });
    } catch (error) {
        next(error);
    }
});

module.exports = router;