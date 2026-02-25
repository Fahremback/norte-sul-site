// backend/middleware/errorHandler.js
const { ZodError } = require('zod');
const { Prisma } = require('@prisma/client');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  console.error("--- ERROR HANDLER ---");
  // Check for Axios error and log the detailed response data from the external API
  if (err.isAxiosError && err.response) {
      console.error("Axios Response Error:", JSON.stringify(err.response.data, null, 2));
  } else {
      console.error(err); // Log other errors as before
  }
  console.error("--- END ERROR ---");


  if (err instanceof ZodError) {
    return res.status(400).json({ 
      message: 'Erro de validação.', 
      errors: err.errors.map(e => ({ path: e.path, message: e.message }))
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: `Conflito: o registro com o campo '${err.meta.target.join(', ')}' já existe.` });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Recurso não encontrado.' });
    }
    if (err.code === 'P2022') {
      return res.status(500).json({ 
        message: `Erro de banco de dados: A coluna '${err.meta.column}' não existe.`,
        details: "Isso geralmente significa que o esquema do banco de dados está desatualizado. Você precisa executar uma migração de banco de dados. Tente executar 'npx prisma migrate dev' no terminal do backend."
      });
    }
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Gracefully handle Axios errors by forwarding a cleaner message
  if (err.isAxiosError && err.response) {
    const asaasError = err.response.data?.errors?.[0]?.description || 'Erro na comunicação com o serviço de pagamento.';
    // Use 400 for client-side errors from Asaas, otherwise default to 500
    const statusCode = err.response.status >= 400 && err.response.status < 500 ? 400 : 500;
    return res.status(statusCode).json({ message: asaasError });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Ocorreu um erro interno no servidor.';

  res.status(statusCode).json({ message });
};

module.exports = errorHandler;
