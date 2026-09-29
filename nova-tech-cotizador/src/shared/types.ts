export interface User {
  id: string;
  email: string;
  name: string;
  code: string;
  role: 'super_admin' | 'gerente' | 'vendedor' | 'closer' | 'desarrollador';
  isActive: boolean;
  createdAt: string;
  avatar?: string | null;
  hasCredentials?: boolean;
}

export interface Quote {
  id: string;
  clientName: string;
  clientType: 'empresa' | 'marca_personal';
  productType: string;
  config: Record<string, any>;
  basePrice: number;
  margin: number;
  finalPrice: number;
  status: 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'pagada';
  sellerId: string;
  developerId?: string;
  assignedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeveloperAvailability {
  developerId: string;
  status: 'disponible' | 'ocupado' | 'no_disponible';
  activeQuotes: number;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'quote_delegated' | 'quote_reassigned' | 'quote_accepted' | 'quote_rejected';
  title: string;
  message: string;
  quoteId?: string;
  read: boolean;
  createdAt: string;
}

export interface AppSettings {
  companyName: string;
  companyLogo: string | null;
  paymentAlias: string;
  paymentTitular: string;
  phone: string;
  email: string;
  marginMinimum: number;
  updatedAt: string;
}

export type ProductType = 'web' | 'store' | 'app' | 'custom' | 'maintenance' | 'seo';

export interface QuoteConfig {
  pages?: number;
  features?: string[];
  design?: string;
  urgency?: string;
  products?: string;
  platform?: string;
  screens?: string;
  complexity?: string;
  modules?: string;
  users?: string;
  type?: string;
  frequency?: string;
  level?: string;
  scope?: string;
  services?: string[];
  duration?: string;
  notes?: string;
}
