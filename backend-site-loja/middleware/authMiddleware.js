const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { getConfig } = require('../lib/config');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    const config = getConfig();
    const jwtSecret = config.jwtSecret || process.env.JWT_SECRET; // Fallback para .env

    if (!jwtSecret) {
        return res.status(500).json({ message: 'Chave de segurança do servidor não configurada.' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user) {
            return res.status(401).json({ message: 'Token inválido - usuário não encontrado.' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        return res.status(403).json({ message: 'Acesso negado. Requer privilégios de administrador.' });
    }
};

module.exports = { authMiddleware, adminMiddleware };
