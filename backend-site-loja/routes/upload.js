

const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const geminiService = require('../services/geminiService');

const router = express.Router();

// Configuração do Multer para armazenar a imagem em memória
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Formato de arquivo não suportado! Por favor, envie uma imagem.'), false);
        }
    }
});

// Endpoint para upload de imagem sem processamento de IA
router.post('/image-only', authMiddleware, adminMiddleware, upload.single('image'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo de imagem foi enviado.' });
    }

    try {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const originalName = path.parse(req.file.originalname).name;
        const filename = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9]/g, '-')}.webp`;
        const filepath = path.join(uploadsDir, filename);

        await sharp(req.file.buffer)
            .resize({
                width: 1024,
                height: 1024,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toFile(filepath);
        
        const imageUrl = `/uploads/${filename}`;
        
        res.status(200).json({ 
            imageUrl
        });
    } catch (error) {
        next(error);
    }
});


// Endpoint para upload e processamento de imagem de produto
router.post('/image', authMiddleware, adminMiddleware, upload.single('image'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo de imagem foi enviado.' });
    }

    try {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        // Garante que o diretório de uploads exista
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const originalName = path.parse(req.file.originalname).name;
        const filename = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9]/g, '-')}.webp`;
        const filepath = path.join(uploadsDir, filename);

        const processedImageBuffer = await sharp(req.file.buffer)
            .resize({
                width: 1024,
                height: 1024,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toBuffer();
        
        await fs.promises.writeFile(filepath, processedImageBuffer);

        const imageUrl = `/uploads/${filename}`;
        
        // Processamento com IA
        const base64Image = processedImageBuffer.toString('base64');
        const mimeType = 'image/webp';
        const aiData = await geminiService.processProductImage(base64Image, mimeType);

        res.status(200).json({ 
            imageUrl,
            ...aiData 
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;