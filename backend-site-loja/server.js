
require('dotenv').config();
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const axios = require('axios'); // Adicionado para a rota de CEP
const { loadConfig } = require('./lib/config');
const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./utils/passwordUtils');
const errorHandler = require('./middleware/errorHandler');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const prisma = new PrismaClient();

// --- Self-healing mechanism for admin user ---
async function ensureAdminUserExists() {
    const adminEmail = 'nortesulinformaticaloja@gmail.com';
    try {
        const adminUser = await prisma.user.findUnique({
            where: { email: adminEmail },
        });

        if (!adminUser) {
            console.log('Admin user not found. Creating default admin user...');
            const adminPass = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
            const hashedPassword = await hashPassword(adminPass);
            await prisma.user.create({
                data: {
                    email: adminEmail,
                    username: 'admin',
                    name: 'Admin da Loja',
                    password: hashedPassword,
                    isAdmin: true,
                    emailVerified: true, // Pre-verify the default admin
                },
            });
            console.log('✅ Default admin user created successfully.');
        } else {
            console.log('✅ Default admin user already exists.');
        }
    } catch (error) {
        console.error('❌ CRITICAL ERROR: Could not ensure admin user exists.', error);
    }
}


// Rotas
const productRoutes = require('./routes/products');
const courseRoutes = require('./routes/courses');
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const paymentRoutes = require('./routes/payment');
const planRoutes = require('./routes/plans');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const subscriptionRoutes = require('./routes/subscriptions');
const addressRoutes = require('./routes/addresses');
const ticketRoutes = require('./routes/tickets');
const uploadRoutes = require('./routes/upload');
const cartRoutes = require('./routes/cart'); // Rota do carrinho
const pendingServiceRoutes = require('./routes/pending-services');
const purchaseRequestRoutes = require('./routes/purchase-requests');
const configRoutes = require('./routes/config');
const reviewRoutes = require('./routes/reviews');
const questionRoutes = require('./routes/questions');
const salesRoutes = require('./routes/sales');
const expensesRoutes = require('./routes/expenses');
const servicesRoutes = require('./routes/services');

const app = express();

const startServer = async () => {
    await loadConfig();
    await ensureAdminUserExists();

    const PORT = process.env.PORT || 8443;

    // --- Middlewares ---
    app.set('trust proxy', 1);
    app.use(
        helmet.contentSecurityPolicy({
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                'connect-src': ["'self'"],
                'script-src': ["'self'", "'unsafe-inline'", "https://esm.sh"],
                'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                'font-src': ["'self'", "https://fonts.gstatic.com"],
                'img-src': ["'self'", 'blob:', 'data:', 'https:', 'https://placehold.co', 'https://via.placeholder.com'],
            },
        })
    );
    app.use(cors());
    app.use('/api/payment/webhook/asaas-confirmation', express.raw({ type: 'application/json' }), paymentRoutes);
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Muitas requisições desta origem, por favor tente novamente em 15 minutos.' }
    });

    app.use('/api/auth', apiLimiter);
    app.use('/api/tickets', apiLimiter);

    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // --- Rota de Proxy para CEP ---
    app.get('/api/cep/:cep', async (req, res) => {
        const { cep } = req.params;
        const cleanedCep = (cep || '').replace(/\D/g, '');

        if (cleanedCep.length !== 8) {
            return res.status(400).json({ message: 'CEP inválido.' });
        }

        try {
            const response = await axios.get(`https://viacep.com.br/ws/${cleanedCep}/json/`);
            if (response.data.erro) {
                return res.status(404).json({ message: 'CEP não encontrado.' });
            }
            res.json(response.data);
        } catch (error) {
            console.error(`Falha ao consultar o serviço de CEP para ${cleanedCep}:`, error.message);
            res.status(502).json({ message: 'Falha ao consultar o serviço de CEP externo.' });
        }
    });

    // Usar as Rotas da API
    app.use('/api/products', productRoutes);
    app.use('/api/courses', courseRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/settings', settingsRoutes);
    app.use('/api/payment', paymentRoutes);
    app.use('/api/plans', planRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/subscriptions', subscriptionRoutes);
    app.use('/api/addresses', addressRoutes);
    app.use('/api/tickets', ticketRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/pending-services', pendingServiceRoutes);
    app.use('/api/purchase-requests', purchaseRequestRoutes);
    app.use('/api/config', configRoutes);
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/questions', questionRoutes);
    app.use('/api/sales', salesRoutes);
    app.use('/api/expenses', expensesRoutes);
    app.use('/api/services', servicesRoutes);

    // --- Servir o Frontend em Produção ---
    const frontendDistPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(frontendDistPath));
    app.get('*', (req, res) => {
        const indexPath = path.join(frontendDistPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send(`
                <h1>Frontend build not found</h1>
                <p>The frontend build directory was not found at: <strong>${frontendDistPath}</strong></p>
                <p>Please ensure you have run <strong>npm run build</strong> in the frontend project root.</p>
            `);
        }
    });

    app.use(errorHandler);

    // --- Iniciar Servidor (HTTPS ou HTTP) ---
    const certPath = path.join(__dirname, 'ssl', 'cert.pem');
    const keyPath = path.join(__dirname, 'ssl', 'key.pem');

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        const sslOptions = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        };
        https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Servidor Backend HTTPS rodando na porta ${PORT} em todas as interfaces de rede (0.0.0.0).`);
        });
    } else {
        http.createServer(app).listen(PORT, '0.0.0.0', () => {
            console.warn(`
            ==================================================================================
            ⚠️ AVISO: Certificados SSL não encontrados em 'backend-site-loja/ssl/'.
            Servidor rodando em modo HTTP inseguro.
            Para habilitar HTTPS, coloque 'key.pem' e 'cert.pem' na pasta 'ssl'.
            ==================================================================================
            `);
            console.log(`✅ Servidor Backend HTTP rodando na porta ${PORT} em todas as interfaces de rede (0.0.0.0).`);
        });
    }
};

startServer().catch(error => {
    console.error("Falha ao iniciar o servidor:", error);
    process.exit(1);
});