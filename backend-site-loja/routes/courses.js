

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const router = express.Router();

const convertPriceToNumber = (item) => {
    if (item && item.price) return { ...item, price: Number(item.price) };
    return item;
};

// GET: Rota para buscar todos os cursos
router.get('/', async (req, res) => {
    try {
        let userId = null;
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.userId;
            } catch (e) { /* Token inválido ou expirado, ignora */ }
        }

        const courses = await prisma.course.findMany({ orderBy: { createdAt: 'desc' } });
        
        if (userId) {
            const approvedAccesses = await prisma.approvedCourseAccess.findMany({ where: { userId }});
            const approvedCourseIds = new Set(approvedAccesses.map(a => a.courseId));
            const coursesWithAccess = courses.map(course => ({
                ...course,
                hasAccess: course.type === 'PRESENCIAL' || approvedCourseIds.has(course.id),
            }));
            return res.json(coursesWithAccess.map(convertPriceToNumber));
        }

        res.json(courses.map(course => ({...course, hasAccess: course.type === 'PRESENCIAL'})).map(convertPriceToNumber));
    } catch (error) {
        res.status(500).json({ message: 'Não foi possível buscar os cursos.' });
    }
});


// Rotas para Course Access (Aprovação) - MOVIDAS PARA CIMA PARA CORRIGIR PRIORIDADE DE ROTA
router.get('/access-requests', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const requests = await prisma.courseAccessRequest.findMany({
            where: { status: 'PENDING' },
            include: { user: { select: { id: true, name: true, email: true } }, course: { select: { id: true, title: true } } },
            orderBy: { createdAt: 'asc' },
        });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Falha ao buscar solicitações.' });
    }
});

router.post('/access-requests/:requestId/approve', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await prisma.courseAccessRequest.update({
            where: { id: requestId },
            data: { status: 'APPROVED' },
        });
        await prisma.approvedCourseAccess.create({
            data: { userId: request.userId, courseId: request.courseId },
        });
        res.status(200).json({ message: 'Acesso aprovado.' });
    } catch (error) {
        res.status(500).json({ message: 'Falha ao aprovar acesso.' });
    }
});

// GET: Rota para buscar um curso por ID
router.get('/:id', async (req, res) => {
    try {
        let userId = null;
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.userId;
            } catch (e) { /* ignora */ }
        }

        const course = await prisma.course.findUnique({ where: { id: req.params.id } });
        
        if (!course) return res.status(404).json({ message: 'Curso não encontrado.' });

        let hasAccess = course.type === 'PRESENCIAL';
        if (userId && course.type === 'GRAVADO') {
            const approved = await prisma.approvedCourseAccess.findUnique({ where: { userId_courseId: { userId, courseId: course.id } } });
            if (approved) hasAccess = true;
        }

        res.json(convertPriceToNumber({ ...course, hasAccess }));
    } catch (error) {
        res.status(500).json({ message: 'Falha ao buscar o curso.' });
    }
});

// POST: Criar um novo curso (admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { title, description, instructor, duration, level, price, imageUrl, type } = req.body;
        const newCourse = await prisma.course.create({
            data: { title, description, instructor, duration, level, price: parseFloat(price), imageUrl, type },
        });
        res.status(201).json(convertPriceToNumber(newCourse));
    } catch (error) {
        res.status(400).json({ message: 'Não foi possível criar o curso.' });
    }
});

// PUT: Atualizar um curso (admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { title, description, instructor, duration, level, price, imageUrl, type } = req.body;
        const updatedCourse = await prisma.course.update({
            where: { id: req.params.id },
            data: { title, description, instructor, duration, level, price: parseFloat(price), imageUrl, type },
        });
        res.json(convertPriceToNumber(updatedCourse));
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Curso não encontrado.' });
        res.status(400).json({ message: 'Dados inválidos.' });
    }
});

// DELETE: Deletar um curso (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await prisma.course.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Curso não encontrado.' });
        res.status(500).json({ message: 'Falha ao deletar.' });
    }
});

router.post('/:id/request-access', authMiddleware, async (req, res) => {
    const { id: courseId } = req.params;
    const { id: userId } = req.user;
    try {
        await prisma.courseAccessRequest.create({ data: { userId, courseId } });
        res.status(201).json({ message: 'Solicitação enviada com sucesso.' });
    } catch (error) {
        if (error.code === 'P2002') return res.status(409).json({ message: 'Você já solicitou acesso a este curso.' });
        res.status(500).json({ message: 'Falha ao solicitar acesso.' });
    }
});

// Rotas /bulk permanecem as mesmas
router.post('/bulk', authMiddleware, adminMiddleware, async (req, res) => {
    const courses = req.body;
    const dataToCreate = courses.map(c => ({
        title: c.title || '',
        instructor: c.instructor || '',
        description: c.description || '',
        price: parseFloat(String(c.price)) || 0,
        imageUrl: c.imageUrl || null,
        duration: c.duration || '',
        level: c.level || 'Iniciante',
        type: ['PRESENCIAL', 'GRAVADO'].includes(c.type?.toUpperCase()) ? c.type.toUpperCase() : 'PRESENCIAL',
    }));
    try {
        const result = await prisma.course.createMany({ data: dataToCreate, skipDuplicates: true });
        res.status(201).json({ message: `${result.count} cursos adicionados.`, count: result.count });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar cursos em lote.' });
    }
});

router.delete('/bulk', authMiddleware, adminMiddleware, async (req, res) => {
    const { ids } = req.body;
    try {
        const result = await prisma.course.deleteMany({ where: { id: { in: ids } } });
        res.status(200).json({ message: `${result.count} cursos deletados.`, count: result.count });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar cursos em lote.' });
    }
});


module.exports = router;