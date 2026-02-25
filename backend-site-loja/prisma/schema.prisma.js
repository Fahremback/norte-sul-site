// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum CourseType {
  PRESENCIAL
  GRAVADO
}

model User {
  id                         String                 @id @default(cuid())
  email                      String                 @unique
  username                   String                 @unique
  name                       String
  password                   String
  emailVerified              Boolean                @default(false)
  verificationToken          String?                @unique
  verificationTokenExpires   DateTime?
  passwordResetToken         String?                @unique
  passwordResetTokenExpires  DateTime?
  cpfCnpj                    String?                @unique
  phone                      String?
  addresses                  Address[]
  asaasCustomerId            String?                @unique
  isAdmin                    Boolean                @default(false)
  createdAt                  DateTime               @default(now())
  updatedAt                  DateTime               @updatedAt
  orders                     Order[]
  subscriptions              Subscription[]
  courseAccessRequests       CourseAccessRequest[]
  approvedCourseAccesses     ApprovedCourseAccess[]
  pendingServices            PendingService[]
  purchaseRequests           PurchaseRequest[]
  questions                  ProductQuestion[]
  reviews                    ProductReview[]
  services                   Service[]
  sales                      SaleTransaction[]
  expenses                   Expense[]
  cart                       Cart?
}

model Address {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  cep          String
  street       String
  number       String
  complement   String?
  neighborhood String
  city         String
  state        String
  isPrimary    Boolean  @default(false)
  type         String // "Casa" or "Trabalho"
  contactName  String
  contactPhone String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Product {
  id          String      @id @default(cuid())
  name        String
  description String      @db.Text
  price       Decimal
  storePrice  Decimal?
  imageUrls   String[]
  stock       Int         @default(0)
  status      String      @default("pending_details") // Can be 'pending_details' or 'active'
  category    String?
  sku         String?     @unique
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  orderItems  OrderItem[]
  cartItems   CartItem[]
  
  // New fields for characteristics
  brand         String?
  model         String?
  color         String?
  dimensions    String? // e.g. "15cm x 7cm x 1cm"
  weight        String? // e.g. "200g"
  power         String? // e.g. "25W"
  material      String?
  compatibility String?
  otherSpecs    String?

  // Relations to new models
  questions   ProductQuestion[]
  reviews     ProductReview[]
}

model Course {
  id               String                 @id @default(cuid())
  title            String
  description      String
  instructor       String
  duration         String
  level            String?
  price            Decimal
  imageUrl         String?
  type             CourseType             @default(PRESENCIAL)
  createdAt        DateTime               @default(now())
  updatedAt        DateTime               @updatedAt
  orderItems       OrderItem[]
  accessRequests   CourseAccessRequest[]
  approvedAccesses ApprovedCourseAccess[]
  cartItems        CartItem[]
}

model CourseAccessRequest {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  courseId  String
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  status    String   @default("PENDING") // PENDING, APPROVED, REJECTED
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, courseId]) // Um usuário só pode solicitar acesso a um curso uma vez
}

model ApprovedCourseAccess {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  courseId  String
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, courseId])
}

model Plan {
  id            String         @id @default(cuid())
  name          String
  description   String
  price         Decimal
  frequency     String // Ex: MONTHLY, YEARLY, WEEKLY
  features      String[]
  isActive      Boolean        @default(true)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @default(now()) @updatedAt
  subscriptions Subscription[]
}

model Subscription {
  id                  String   @id @default(cuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id])
  planId              String? // Can be null for custom plans
  plan                Plan?    @relation(fields: [planId], references: [id])
  customPlanDetails   Json? // Store details of the custom plan from questionnaire
  asaasSubscriptionId String   @unique
  status              String // Ex: ACTIVE, PENDING, OVERDUE, CANCELED
  billingType         String // Ex: CREDIT_CARD, BOLETO, PIX
  nextDueDate         DateTime
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model Order {
  id                 String      @id @default(cuid())
  userId             String
  user               User        @relation(fields: [userId], references: [id])
  createdAt          DateTime    @default(now())
  status             String      @default("PENDING")
  totalAmount        Decimal
  paymentMethod      String // PIX, CREDIT_CARD ou BOLETO
  paymentProvider    String?
  paymentId          String?     @unique
  items              OrderItem[]
  customerName       String
  customerEmail      String
  customerCpfCnpj    String
  shippingAddress    String
  shippingCity       String
  shippingState      String
  shippingPostalCode String
  trackingCode       String?
  trackingUrl        String?
}

model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id])
  productId String?
  product   Product? @relation(fields: [productId], references: [id])
  courseId  String?
  course    Course?  @relation(fields: [courseId], references: [id])
  quantity  Int
  price     Decimal
}

model SiteSettings {
  id                   String   @id @default("singleton")
  siteName             String   @default("Norte Sul Informática")
  siteDescription      String?
  logoUrl              String?
  faviconUrl           String?
  contactPhone         String?
  contactEmail         String?
  address              String?
  storeHours           String?
  facebookUrl          String?
  instagramUrl         String?
  maintenanceMode      Boolean  @default(false)
  
  // Chaves de API e integrações
  asaasApiKey          String?
  asaasWebhookSecret   String?
  
  // Nova configuração de segurança
  jwtSecret            String?

  // Novas configurações de email
  emailHost            String?
  emailPort            Int?
  emailUser            String?
  emailPass            String?
  emailFrom            String?

  createdAt            DateTime @default(now())
  updatedAt            DateTime @default(now()) @updatedAt
}

model Ticket {
  id        String   @id @default(cuid())
  name      String
  email     String
  phone     String?
  message   String   @db.Text
  status    String   @default("OPEN") // OPEN, CLOSED
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model PendingService {
  id              String   @id @default(cuid())
  customerName    String
  customerPhone   String?
  itemDescription String
  serviceNotes    String?  @db.Text
  status          String   @default("Pendente")
  priority        Int      @default(2) // 1: Alta, 2: Normal, 3: Baixa
  imageUrl        String?
  userId          String?
  user            User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model PurchaseRequest {
  id           String              @id @default(cuid())
  userId       String
  user         User                @relation(fields: [userId], references: [id])
  items        PurchaseRequestItem[]
  globalNotes  String?             @db.Text
  status       String              @default("Pendente")
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt
}

model PurchaseRequestItem {
  id                String          @id @default(cuid())
  purchaseRequestId String
  purchaseRequest   PurchaseRequest @relation(fields: [purchaseRequestId], references: [id], onDelete: Cascade)
  itemName          String
  quantity          Int
  status            String          @default("Pendente")
  notes             String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}

model ProductQuestion {
  id          String   @id @default(cuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  question    String   @db.Text
  answer      String?  @db.Text
  
  createdAt   DateTime @default(now())
  answeredAt  DateTime?

  @@index([productId])
  @@index([userId])
}

model ProductReview {
  id          String   @id @default(cuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  rating      Int      // e.g., 1 to 5
  title       String
  comment     String   @db.Text
  
  createdAt   DateTime @default(now())

  @@unique([productId, userId]) // User can review a product only once
  @@index([productId])
  @@index([userId])
}

model Service {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal
  userId      String?
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum SaleItemType {
  PRODUCT
  SERVICE
}

model SaleTransaction {
  id           String       @id @default(cuid())
  itemId       String // Can be Product ID or Service ID
  itemType     SaleItemType
  itemName     String
  quantitySold Int
  pricePerItem Decimal
  totalAmount  Decimal
  date         DateTime
  userId       String
  user         User         @relation(fields: [userId], references: [id])
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

model Expense {
  id          String   @id @default(cuid())
  description String
  amount      Decimal
  date        DateTime
  category    String
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Cart {
  id        String     @id @default(cuid())
  userId    String     @unique
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String?
  product   Product? @relation(fields: [productId], references: [id], onDelete: Cascade)
  courseId  String?
  course    Course?  @relation(fields: [courseId], references: [id], onDelete: Cascade)
  quantity  Int
  createdAt DateTime @default(now())

  @@index([cartId])
}
