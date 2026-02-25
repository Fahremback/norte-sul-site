
const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

const getOrCreateCart = async (userId, tx) => {
  const prismaClient = tx || prisma;
  let cart = await prismaClient.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prismaClient.cart.create({ data: { userId } });
  }
  return cart;
};

const getFormattedCart = async (userId) => {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, price: true, imageUrls: true, stock: true } },
            course: { select: { id: true, title: true, price: true, imageUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) {
        return [];
    }
    
    return cart.items.map(item => {
        const isProduct = !!item.product;
        const sourceItem = isProduct ? item.product : item.course;
        
        return {
            id: sourceItem.id,
            itemType: isProduct ? 'PRODUCT' : 'COURSE',
            name: isProduct ? sourceItem.name : sourceItem.title,
            price: Number(sourceItem.price),
            imageUrl: isProduct ? (sourceItem.imageUrls?.[0] || '') : (sourceItem.imageUrl || ''),
            quantity: item.quantity,
            stock: isProduct ? sourceItem.stock : undefined,
        };
    });
}

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const formattedCartItems = await getFormattedCart(req.user.id);
    res.json(formattedCartItems);
  } catch (error) {
    next(error);
  }
});

router.post('/sync', authMiddleware, async (req, res, next) => {
    const clientCartItems = req.body;

    if (!Array.isArray(clientCartItems)) {
        return res.status(400).json({ message: 'Formato de carrinho inválido.' });
    }

    try {
        await prisma.$transaction(async (tx) => {
            const cart = await getOrCreateCart(req.user.id, tx);

            await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

            if (clientCartItems.length > 0) {
                const itemsToCreate = clientCartItems.map(item => {
                    if (!item.id || !item.itemType || !item.quantity) {
                        throw new Error('Estrutura de item inválida no payload de sincronização.');
                    }
                    return {
                        cartId: cart.id,
                        productId: item.itemType === 'PRODUCT' ? item.id : undefined,
                        courseId: item.itemType === 'COURSE' ? item.id : undefined,
                        quantity: item.quantity,
                    };
                });
                
                await tx.cartItem.createMany({
                    data: itemsToCreate,
                });
            }
        });
        
        const updatedCartItems = await getFormattedCart(req.user.id);
        res.status(200).json(updatedCartItems);

    } catch (error) {
        next(error);
    }
});

module.exports = router;
