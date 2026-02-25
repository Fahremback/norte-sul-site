const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { comparePassword, hashPassword } = require('../utils/passwordUtils');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailSender');
const { getConfig } = require('../lib/config');
const ApiError = require('../utils/ApiError');
const { transformUserForFrontend } = require('../utils/userUtils');

const signToken = (payload) => {
    const config = getConfig();
    const jwtSecret = config.jwtSecret || process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new ApiError(500, "Chave JWT não configurada no servidor.");
    }
    // Only include essential, non-sensitive info in the token
    return jwt.sign({ userId: payload.userId, isAdmin: payload.isAdmin }, jwtSecret, { expiresIn: '8h' });
};

const triggerVerificationEmail = async (user) => {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
        where: { id: user.id },
        data: { verificationToken, verificationTokenExpires },
    });

    await sendVerificationEmail(user.email, verificationToken);
};

const register = async (userData) => {
    const { name, email, password, cpfCnpj, isAdmin } = userData;
    
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
        throw new ApiError(409, 'Este email já está em uso.');
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await prisma.user.create({
        data: { 
            name, 
            email: email.toLowerCase(), 
            username: email.toLowerCase(), 
            password: hashedPassword, 
            cpfCnpj: cpfCnpj || null, 
            isAdmin: !!isAdmin 
        },
    });

    await triggerVerificationEmail(newUser);

    const payload = { userId: newUser.id, isAdmin: newUser.isAdmin };
    const token = signToken(payload);

    return { message: 'Cadastro realizado! Um e-mail de verificação foi enviado.', token, user: transformUserForFrontend(newUser) };
};

const login = async (emailOrCpf, password) => {
    const isEmail = String(emailOrCpf).includes('@');
    const identifier = String(emailOrCpf).toLowerCase();
    
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: isEmail ? identifier : undefined },
                { username: !isEmail ? identifier : undefined },
                { cpfCnpj: !isEmail ? identifier.replace(/\D/g, '') : undefined },
            ].filter(Boolean),
        },
    });

    if (!user) {
        throw new ApiError(401, 'Credenciais inválidas.');
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
        throw new ApiError(401, 'Credenciais inválidas.');
    }

    const payload = { userId: user.id, isAdmin: user.isAdmin };
    const token = signToken(payload);

    return { message: 'Login bem-sucedido!', token, user: transformUserForFrontend(user) };
};

const forgotPassword = async (email) => {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetTokenExpires = new Date(Date.now() + 3600000);
        
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordResetToken: resetToken, passwordResetTokenExpires },
        });
        await sendPasswordResetEmail(user.email, resetToken);
    }
    return { message: 'Se um e-mail correspondente for encontrado, um link para redefinição de senha será enviado.' };
};

const resetPassword = async (token, password) => {
    const user = await prisma.user.findFirst({
        where: { passwordResetToken: token, passwordResetTokenExpires: { gt: new Date() } },
    });

    if (!user) {
        throw new ApiError(400, 'Token de redefinição inválido ou expirado.');
    }
    
    const hashedPassword = await hashPassword(password);
    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, passwordResetToken: null, passwordResetTokenExpires: null },
    });
    
    return { message: 'Senha redefinida com sucesso!' };
};

const verifyEmail = async (token) => {
    const user = await prisma.user.findFirst({
        where: { verificationToken: token, verificationTokenExpires: { gt: new Date() } },
    });

    if (!user) {
        throw new ApiError(400, 'Token de verificação inválido ou expirado.');
    }

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, verificationToken: null, verificationTokenExpires: null },
    });
    
    const payload = { userId: updatedUser.id, isAdmin: updatedUser.isAdmin };
    const newToken = signToken(payload);

    return { 
        message: 'E-mail verificado com sucesso!', 
        token: newToken,
        user: transformUserForFrontend(updatedUser) 
    };
};

const resendVerificationEmail = async (user) => {
    if (user.emailVerified) {
        throw new ApiError(400, 'Este e-mail já foi verificado.');
    }
    await triggerVerificationEmail(user);
    return { message: 'E-mail de verificação reenviado com sucesso.' };
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
};