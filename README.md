# 🛒 Norte Sul Informática — E-Commerce Platform

> Full-stack e-commerce platform built for a real IT services company, handling products, subscriptions, courses, payments, and customer management.

## ✨ Features

### 🖥️ Frontend (React + Vite)
- Responsive product catalog with search, filters, and categories
- Shopping cart with CEP-based shipping calculation
- PIX and boleto payment via Asaas gateway
- Subscription plans for IT support services
- Course marketplace with enrollment
- Customer account management
- Real-time notifications

### ⚙️ Backend (Node.js + Express + Prisma)
- RESTful API with JWT authentication
- PostgreSQL database with Prisma ORM
- Asaas payment gateway integration (PIX, boleto, credit card)
- Shipping calculation via MelhorEnvio API
- Admin panel with full CRUD for products, orders, users
- Email verification and password reset (SMTP)
- Rate limiting, CORS, Helmet security headers
- Audit logging middleware
- AI-powered features via Gemini API
- Webhook handling for payment confirmations

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, TypeScript |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Payments | Asaas (PIX, Boleto, Credit Card) |
| Shipping | MelhorEnvio API |
| Auth | JWT + bcrypt |
| Security | Helmet, Rate Limiting, CORS, Audit Logs |

## 🚀 Getting Started

```bash
# Backend
cd backend-site-loja
npm install
cp .env.example .env  # Configure your database and API keys
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend
cd front-site
npm install
npm run dev
```

## 📄 License

Proprietary — Norte Sul Informática.
