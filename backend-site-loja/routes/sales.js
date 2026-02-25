const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { SaleItemType } = require('@prisma/client');

const router = express.Router();

// GET /api/sales
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const sales = await prisma.saleTransaction.findMany({
      orderBy: { date: 'desc' },
    });
    res.json(sales.map(s => ({...s, pricePerItem: Number(s.pricePerItem), totalAmount: Number(s.totalAmount)})));
  } catch (error) {
    next(error);
  }
});

// POST /api/sales
router.post('/', authMiddleware, async (req, res, next) => {
  const { itemId, itemType, itemName, quantitySold, pricePerItem, totalAmount, date } = req.body;
  
  try {
    const sale = await prisma.$transaction(async (tx) => {
      if (itemType === SaleItemType.PRODUCT) {
        const product = await tx.product.findUnique({
          where: { id: itemId },
        });
        if (!product || product.stock < quantitySold) {
          throw new Error('Estoque insuficiente para o produto.');
        }
        await tx.product.update({
          where: { id: itemId },
          data: { stock: { decrement: quantitySold } },
        });
      }
      
      const newSale = await tx.saleTransaction.create({
        data: {
          itemId, itemType, itemName, quantitySold, pricePerItem, totalAmount, date,
          userId: req.user.id,
        },
      });
      return newSale;
    });

    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
});

// PUT /api/sales/:id
router.put('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { itemName, quantitySold, pricePerItem } = req.body;

  try {
    const originalSale = await prisma.saleTransaction.findUnique({ where: { id } });
    if (!originalSale) return res.status(404).json({ message: 'Venda não encontrada' });
    
    const updatedSale = await prisma.$transaction(async (tx) => {
      if (originalSale.itemType === SaleItemType.PRODUCT) {
        await tx.product.update({
          where: { id: originalSale.itemId },
          data: { stock: { increment: originalSale.quantitySold } }
        });
      }

      if (originalSale.itemType === SaleItemType.PRODUCT) {
        const product = await tx.product.findUnique({ where: { id: originalSale.itemId } });
        if (!product || product.stock < quantitySold) {
          throw new Error('Estoque insuficiente para a quantidade atualizada.');
        }
        await tx.product.update({
          where: { id: originalSale.itemId },
          data: { stock: { decrement: quantitySold } }
        });
      }

      return tx.saleTransaction.update({
        where: { id },
        data: {
          itemName,
          quantitySold: parseInt(quantitySold),
          pricePerItem: parseFloat(pricePerItem),
          totalAmount: parseInt(quantitySold) * parseFloat(pricePerItem)
        }
      });
    });

    res.json(updatedSale);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/sales/:id
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
    const { id } = req.params;
    try {
        await prisma.$transaction(async (tx) => {
            const saleToDelete = await tx.saleTransaction.findUnique({ where: { id } });
            if (!saleToDelete) throw new Error('Venda não encontrada.');

            if (saleToDelete.itemType === SaleItemType.PRODUCT) {
                await tx.product.updateMany({
                    where: { id: saleToDelete.itemId },
                    data: { stock: { increment: saleToDelete.quantitySold } }
                });
            }
            
            await tx.saleTransaction.delete({ where: { id } });
        });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

module.exports = router;
