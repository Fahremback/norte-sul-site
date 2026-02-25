
const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../utils/passwordUtils');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Apagar dados existentes em ordem de dependência para evitar erros de chave estrangeira
  console.log('Deleting old data...');
  await prisma.orderItem.deleteMany().catch(e => console.log("No order items to delete or error:", e.message));
  await prisma.order.deleteMany().catch(e => console.log("No orders to delete or error:", e.message));
  await prisma.subscription.deleteMany().catch(e => console.log("No subscriptions to delete or error:", e.message));
  await prisma.course.deleteMany().catch(e => console.log("No courses to delete or error:", e.message));
  await prisma.product.deleteMany().catch(e => console.log("No products to delete or error:", e.message));
  await prisma.plan.deleteMany().catch(e => console.log("No plans to delete or error:", e.message));
  await prisma.user.deleteMany().catch(e => console.log("No users to delete or error:", e.message));
  await prisma.siteSettings.deleteMany().catch(e => console.log("No site settings to delete or error:", e.message));
  console.log('Old data deleted.');

  // Criar Usuário Admin
  console.log('Creating admin user...');
  try {
    const adminPass = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    const hashedPassword = await hashPassword(adminPass);
    const adminUser = await prisma.user.create({
      data: {
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        username: 'admin',
        name: 'Admin da Loja',
        password: hashedPassword,
        isAdmin: true,
        emailVerified: true, // Admin user is pre-verified
      },
    });
    console.log(`✅ SUCCESS: Created admin user: ${adminUser.email}`);
  } catch (err) {
    if (err.code === 'P2002') { // Prisma unique constraint violation
      console.error('❌ ERROR: Admin user already exists. Skipping creation.');
    } else {
      console.error('❌ CRITICAL ERROR creating admin user:', err);
      throw err; // Re-throw to make the seed script fail loudly
    }
  }

  // Criar Configurações Iniciais do Site
  console.log('Creating default site settings...');
  await prisma.siteSettings.create({
    data: {
      id: 'singleton', // Garante que só haverá uma linha
      siteName: "Norte Sul Informática",
      siteDescription: "Norte Sul Informática: Produtos, planos de assessoria, cursos e contato.",
      logoUrl: '',
      faviconUrl: '/favicon.ico',
      contactPhone: '(48) 99638-1223',
      contactEmail: 'nortesulinformaticaloja@gmail.com',
      address: 'Av. Atílio Pedro Pagani, 855 - Pagani, Palhoça - SC, 88132-149 (Dentro do Supermercado Giassi)',
      storeHours: 'Segunda a Sexta: 8:30h às 12h - 13h às 18h. Sábados: 9h - 13h',
      facebookUrl: '',
      instagramUrl: 'https://www.instagram.com/nortesulinformatica.palhoca/',
      maintenanceMode: false,
      // Os campos abaixo são configurados via painel admin, inicializados como nulos.
      asaasApiKey: null,
      asaasWebhookSecret: null,
      jwtSecret: null,
      emailHost: null,
      emailPort: null,
      emailUser: null,
      emailPass: null,
      emailFrom: null,
    }
  });
  console.log('Created default site settings.');

  // Criar Planos de Assinatura
  console.log('Creating subscription plans...');
  const plans = [
    {
      name: 'Plano Essencial',
      description: 'Suporte remoto e ajuda com dúvidas rápidas.',
      price: 49.90,
      frequency: 'MONTHLY',
      features: ['Suporte remoto ilimitado para dúvidas rápidas', '1 hora de suporte técnico remoto por mês', 'Canal de atendimento via WhatsApp'],
      isActive: true,
    },
    {
      name: 'Plano Completo',
      description: 'Suporte completo, presencial ou remoto, e descontos exclusivos.',
      price: 99.90,
      frequency: 'MONTHLY',
      features: ['Todos os benefícios do Plano Essencial', '2 horas de suporte técnico (remoto ou presencial)', 'Atendimento prioritário (VIP)', '20% de desconto em serviços e acessórios na loja'],
      isActive: true,
    },
    {
      name: 'Plano Anual Completo',
      description: 'Todos os benefícios com um grande desconto no pagamento anual.',
      price: 999.00,
      frequency: 'YEARLY',
      features: ['Todos os benefícios do Plano Completo', '12 meses de cobertura pelo preço de 10', 'Consultoria anual de setup de equipamentos'],
      isActive: true,
    },
  ];
  await prisma.plan.createMany({ data: plans });
  console.log('Created subscription plans.');

  // Criar Cursos
  console.log('Creating courses...');
  const courses = [
    {
      title: 'Curso de Manutenção de Computadores',
      instructor: 'Prof. Silva',
      duration: '40 horas',
      level: 'Iniciante',
      description: 'Aprenda a montar, configurar e consertar computadores do zero.',
      price: 450.00,
      imageUrl: 'https://images.unsplash.com/photo-1579820010410-c10418a99995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    },
    {
      title: 'Programação com JavaScript Moderno',
      instructor: 'Prof. André',
      duration: '80 horas',
      level: 'Avançado',
      description: 'Aprenda ES6+, React, Node.js e construa aplicações completas.',
      price: 890.00,
      imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    },
  ];
  await prisma.course.createMany({ data: courses });
  console.log('Created courses.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
