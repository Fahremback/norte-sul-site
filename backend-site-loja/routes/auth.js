const express = require('express');
const { z } = require('zod');
const authService = require('../services/authService');
const validate = require('../middleware/validationMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

const registerSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Nome é obrigatório."}).min(1, "Nome não pode ser vazio."),
        email: z.string({ required_error: "Email é obrigatório."}).email("Email inválido."),
        password: z.string({ required_error: "Senha é obrigatória."}).min(6, "A senha deve ter no mínimo 6 caracteres."),
        cpfCnpj: z.string().optional(),
        isAdmin: z.boolean().optional(),
    }),
});

const loginSchema = z.object({
    body: z.object({
        emailOrCpf: z.string({ required_error: "Email/CPF é obrigatório."}),
        password: z.string({ required_error: "Senha é obrigatória."}),
    }),
});

const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email("Email inválido."),
    }),
});

const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string(),
        password: z.string().min(6),
    }),
});

const verifyEmailSchema = z.object({
    body: z.object({
        token: z.string(),
    }),
});


router.post('/register', validate(registerSchema), async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
    try {
        const { emailOrCpf, password } = req.body;
        const result = await authService.login(emailOrCpf, password);
        res.json(result);
    } catch (error) {
        next(error);
    }
});


router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res, next) => {
    try {
        const { email } = req.body;
        const result = await authService.forgotPassword(email);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/reset-password', validate(resetPasswordSchema), async (req, res, next) => {
    try {
        const { token, password } = req.body;
        const result = await authService.resetPassword(token, password);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/verify-email', validate(verifyEmailSchema), async (req, res, next) => {
    try {
        const { token } = req.body;
        const result = await authService.verifyEmail(token);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/resend-verification', authMiddleware, async (req, res, next) => {
    try {
        const result = await authService.resendVerificationEmail(req.user);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
