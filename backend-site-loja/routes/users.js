

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { sendVerificationEmail } = require('../utils/emailSender');
const { transformUserForFrontend } = require('../utils/userUtils');

const prisma = new PrismaClient();
const router = express.Router();

// GET: Rota para buscar TODOS os usuários (apenas admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            // Seleciona todos os campos necessários para a transformação
            select: { 
                id: true, 
                name: true, 
                email: true, 
                cpfCnpj: true, 
                isAdmin: true,
                emailVerified: true, 
                createdAt: true 
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(users.map(transformUserForFrontend));
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ message: 'Falha ao buscar usuários.' });
    }
});

// GET: Rota para o usuário logado buscar seu próprio perfil completo
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userProfile = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        addresses: {
            orderBy: {
                createdAt: 'desc'
            }
        }
      }
    });

    if (!userProfile) {
      return res.status(404).json({ message: 'Perfil do usuário não encontrado.' });
    }
    
    res.json(transformUserForFrontend(userProfile));
  } catch (error) {
    console.error(`Erro ao buscar perfil do usuário ${req.user.id}:`, error);
    res.status(500).json({ message: 'Falha ao buscar o perfil do usuário.' });
  }
});

// PUT: Rota para o usuário logado atualizar seu próprio perfil
router.put('/me', authMiddleware, async (req, res) => {
    const { id, email: currentEmail } = req.user;
    const { 
        name, 
        email, // Novo e-mail pode estar presente
        cpfCnpj, 
        phone
    } = req.body;

    const dataToUpdate = { name, cpfCnpj, phone };
    const emailChanged = email && email.toLowerCase() !== currentEmail;

    if (emailChanged) {
        const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existingUser) {
            return res.status(409).json({ message: 'Este e-mail já está em uso por outra conta.' });
        }
        dataToUpdate.email = email.toLowerCase();
        dataToUpdate.emailVerified = false;
        dataToUpdate.verificationToken = crypto.randomBytes(32).toString('hex');
        dataToUpdate.verificationTokenExpires = new Date(Date.now() + 3600000); // 1 hora
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
        });

        if (emailChanged) {
            await sendVerificationEmail(updatedUser.email, dataToUpdate.verificationToken);
        }

        res.json(transformUserForFrontend(updatedUser));
    } catch (error) {
        console.error(`Erro ao atualizar perfil do usuário ${id}:`, error);
        res.status(500).json({ message: "Falha ao atualizar perfil." });
    }
});


module.exports = router;
