// backend-site-loja/utils/emailSender.js
const nodemailer = require('nodemailer');
const { getConfig } = require('../lib/config');

const createHtmlTemplate = (title, body, siteName) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f7f9fc; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .header { background-color: #22C55E; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 32px; color: #2d3748; line-height: 1.6; }
        .content p { margin: 0 0 16px; }
        .button { display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: #22C55E; border-radius: 6px; text-decoration: none; }
        .footer { background-color: #f7f9fc; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>${title}</h1></div>
        <div class="content">${body}</div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${siteName}. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
`;

async function sendEmail(mailOptions) {
    const config = getConfig();
    if (!config.emailHost || !config.emailUser || !config.emailPass) {
        console.error("ERRO: As configurações de e-mail (host, usuário, senha) não estão definidas. O e-mail não será enviado.");
        throw new Error("Serviço de e-mail não configurado no servidor.");
    }
    
    const transporter = nodemailer.createTransport({
        host: config.emailHost,
        port: parseInt(config.emailPort || '587', 10),
        secure: config.emailPort === 465 || config.emailPort === '465',
        auth: {
            user: config.emailUser,
            pass: config.emailPass,
        },
    });

    await transporter.sendMail(mailOptions);
}


async function sendVerificationEmail(email, token) {
  const config = getConfig();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${frontendUrl}/#/verify-email?token=${token}`;
  
  const title = `Confirme seu E-mail - ${config.siteName}`;
  const body = `
    <p>Olá,</p>
    <p>Obrigado por se cadastrar na ${config.siteName}! Por favor, clique no botão abaixo para verificar seu endereço de e-mail e ativar sua conta.</p>
    <p style="text-align: center; margin: 32px 0;"><a href="${verificationLink}" class="button">Verificar meu E-mail</a></p>
    <p>Se você não consegue clicar, copie e cole o link: <a href="${verificationLink}">${verificationLink}</a></p>
    <p>Se você não se cadastrou, por favor, ignore este e-mail.</p>
  `;

  await sendEmail({
    from: config.emailFrom || `"${config.siteName}" <no-reply@example.com>`,
    to: email,
    subject: 'Verifique seu endereço de e-mail',
    html: createHtmlTemplate(title, body, config.siteName),
  });
}

async function sendPasswordResetEmail(email, token) {
  const config = getConfig();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/#/reset-password?token=${token}`;

  const title = "Redefinição de Senha";
  const body = `
    <p>Olá,</p>
    <p>Recebemos uma solicitação para redefinir a senha da sua conta. Se foi você, clique no botão abaixo para criar uma nova senha:</p>
    <p style="text-align: center; margin: 32px 0;"><a href="${resetLink}" class="button">Redefinir Senha</a></p>
    <p>Se você não consegue clicar, copie e cole o link: <a href="${resetLink}">${resetLink}</a></p>
    <p>Este link expirará em 1 hora. Se você não solicitou, nenhuma ação é necessária.</p>
  `;

  await sendEmail({
    from: config.emailFrom || `"${config.siteName}" <no-reply@example.com>`,
    to: email,
    subject: 'Redefinição de Senha',
    html: createHtmlTemplate(title, body, config.siteName),
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
