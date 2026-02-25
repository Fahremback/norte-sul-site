
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/config/gemini-key - Rota removida
// A chave da API Gemini agora é gerenciada exclusivamente via variável de ambiente no servidor (`process.env.API_KEY`).
// Isso melhora a segurança e segue as melhores práticas, evitando que a chave seja exposta ou armazenada no banco de dados.

// PUT /api/config/gemini-key - Rota removida
// A funcionalidade de atualizar a chave da API pelo painel foi removida.
// A configuração deve ser feita diretamente no ambiente do servidor.

module.exports = router;
