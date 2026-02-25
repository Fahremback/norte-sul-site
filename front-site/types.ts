

import React from 'react';

// Tipos para Produtos, Usuários, etc.
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  category: string | null;
  stock?: number;
  sku?: string; 
  error?: string;
  createdAt: string;
  
  // New optional characteristic fields
  brand?: string;
  model?: string;
  color?: string;
  dimensions?: string; // e.g. "15cm x 7cm x 1cm"
  weight?: string; // e.g. "200g"
  power?: string; // e.g. "25W"
  material?: string;
  compatibility?: string;
  otherSpecs?: string;

  // Relational data
  reviews?: ProductReview[];
  questions?: ProductQuestion[];
}

export interface ProductReview {
  id: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  user: {
    name: string;
  };
}

export interface ProductQuestion {
  id: string;
  question: string;
  answer?: string;
  createdAt: string;
  answeredAt?: string;
  user: {
    name: string;
  };
}


export type CourseType = 'PRESENCIAL' | 'GRAVADO';

export interface Course {
  id: string;
  title: string;
  instructor: string;
  description: string;
  price: number;
  imageUrl: string | null;
  duration: string;
  level?: 'Iniciante' | 'Intermediário' | 'Avançado';
  type: CourseType;
  createdAt: string; 
  updatedAt: string; 
  hasAccess?: boolean;
}

export type CourseCreationData = Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'hasAccess'>;

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  frequency: 'MONTHLY' | 'YEARLY' | 'WEEKLY';
  features: string[];
  isActive: boolean;
}

export interface Subscription {
  id: string;
  planId?: string;
  plan?: Plan;
  customPlanDetails?: any;
  status: string;
  billingType: string;
  nextDueDate: string;
}

export interface NavLinkItem {
  label: string;
  path: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  initial: string;
  isAdmin: boolean;
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: string;
  passwordResetToken?: string;
  passwordResetTokenExpires?: string;
  cpfCnpj?: string;
  phone?: string;
  addresses?: Address[];
}

export interface Address {
  id: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isPrimary?: boolean;
  type: 'Casa' | 'Trabalho';
  contactName: string;
  contactPhone: string;
}

export type AddressFormData = Omit<Address, 'id' | 'isPrimary'>;


export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  login: (emailInput: string, passwordInput: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface CartItem {
  id: string;
  itemType: 'PRODUCT' | 'COURSE';
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stock?: number;
}

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Product | Course, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

export interface SiteSettings {
  id?: string;
  siteName: string;
  siteDescription: string;
  logoUrl?: string;
  faviconUrl: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string; // Campo do DB
  storeAddress?: string; // Campo do Frontend
  storeHours?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  maintenanceMode: boolean;
  asaasApiKey?: string;
  asaasWebhookSecret?: string;
  jwtSecret?: string;
  emailHost?: string;
  emailPort?: number;
  emailUser?: string;
  emailPass?: string;
  emailFrom?: string;
  geminiApiKey?: string;
}

export interface CreditCardData {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
}

export interface PaymentPayload {
    cartItems: CartItem[];
    totalAmount: number;
    paymentMethod: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
    address: Address;
    buyerInfo: { name: string; email: string; cpfCnpj: string; phone: string; };
    creditCard?: CreditCardData;
    creditCardHolderInfo?: { name: string; email: string; cpfCnpj: string; postalCode: string; addressNumber: string; phone: string; };
    saveCard?: boolean;
}

export interface RetryPaymentPayload {
    paymentMethod: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
    creditCard?: CreditCardData;
}


export interface Order {
  id: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  items: OrderItem[];
  customerName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  trackingCode?: string;
  trackingUrl?: string;
  user?: { name: string; email: string; phone?: string; };
  paymentId?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  order: Order;
  productId?: string;
  product?: { name: string; imageUrl?: string; }
  courseId?: string;
  course?: { title: string; imageUrl?: string; }
  quantity: number;
  price: number;
}

export interface PlanQuestionOption {
    value: string;
    label: string;
    description?: string;
    icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface PlanQuestion {
  id: keyof PlanAnswers;
  type: 'radio' | 'number_input';
  title: string;
  description: string;
  helperText?: string;
  options?: PlanQuestionOption[];
  inputMin?: number;
  inputMax?: number;
  inputStep?: number;
  placeholder?: string;
  condition?: (answers: PlanAnswers) => boolean;
}

export interface PlanAnswers {
  preferentialLocation?: 'home' | 'store' | 'remote_first';
  personalizedHours?: number;
  simpleDoubts?: 'yes' | 'no';
  storeDiscounts?: 'yes' | 'no';
  prioritySupport?: 'yes' | 'no';
}

export interface CourseAccessRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  user: { id: string; name: string; email: string; };
  course: { id: string; title: string; };
  createdAt: string;
}

export interface Ticket {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  onChange: (data: { imageUrl: string } & Partial<Product>) => void;
}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;