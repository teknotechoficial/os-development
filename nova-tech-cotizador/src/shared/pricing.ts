import { MINIMUM_MARGIN, PERCENTAGE_MARGIN_RATE } from './constants';

type ProductType = string;
type QuoteConfig = any;

const PRICES: Record<string, any> = {
  web: {
    base: 150,
    perPage: 50,
    features: {
      blog: 80,
      forms: 40,
      gallery: 60,
      map: 30,
      chat: 70,
      social: 25,
      analytics: 30,
    },
    design: { basico: 0, profesional: 150, premium: 300 },
    urgency: 1.5,
  },
  store: {
    base: 300,
    products: { small: 0, medium: 200, large: 400, xlarge: 600 },
    features: {
      payment: 100,
      shipping: 80,
      inventory: 60,
      coupons: 40,
      reviews: 50,
      wishlist: 45,
    },
    design: { basico: 0, profesional: 200, premium: 400 },
    urgency: 1.4,
  },
  app: {
    base: 500,
    platform: { android: 1, ios: 1, both: 1.5 },
    screens: { small: 0, medium: 300, large: 600, xlarge: 1000 },
    features: {
      camera: 100,
      gps: 80,
      notifications: 60,
      payments: 200,
      offline: 120,
      login: 80,
      chat: 150,
    },
    complexity: { basico: 0, profesional: 400, premium: 800 },
    urgency: 1.5,
  },
  custom: {
    base: 400,
    modules: { small: 0, medium: 300, large: 600 },
    users: { small: 0, medium: 200, large: 500 },
    features: {
      reports: 150,
      api: 200,
      crm: 250,
      inventory: 180,
      invoicing: 200,
      multiUser: 150,
    },
    urgency: 1.4,
  },
  maintenance: {
    plans: {
      basico: { monthly: 30, quarterly: 80, annual: 280 },
      avanzado: { monthly: 75, quarterly: 200, annual: 700 },
      priority: { monthly: 150, quarterly: 400, annual: 1400 },
    },
  },
  seo: {
    base: 100,
    scope: { local: 0, nacional: 100, global: 250 },
    services: {
      seo: 50,
      social: 40,
      campaigns: 80,
      email: 30,
      content: 60,
      ads: 70,
    },
    duration: { monthly: 1, quarterly: 2.7, semestral: 5 },
  },
};

export function calculateBasePrice(productType: ProductType, config: QuoteConfig): number {
  const product = PRICES[productType];
  if (!product) return 0;

  let price = product.base;

  switch (productType) {
    case 'web':
      price += ((config.pages || 5) - 1) * product.perPage;
      if (config.features) {
        config.features.forEach(f => {
          if (product.features[f]) price += product.features[f];
        });
      }
      price += product.design[config.design || 'basico'] || 0;
      if (config.urgency === 'urgente') price *= product.urgency;
      break;

    case 'store':
      price += product.products[config.products || 'small'] || 0;
      if (config.features) {
        config.features.forEach(f => {
          if (product.features[f]) price += product.features[f];
        });
      }
      price += product.design[config.design || 'basico'] || 0;
      if (config.urgency === 'urgente') price *= product.urgency;
      break;

    case 'app':
      price *= product.platform[config.platform || 'android'] || 1;
      price += product.screens[config.screens || 'small'] || 0;
      if (config.features) {
        config.features.forEach(f => {
          if (product.features[f]) price += product.features[f];
        });
      }
      price += product.complexity[config.complexity || 'basico'] || 0;
      if (config.urgency === 'urgente') price *= product.urgency;
      break;

    case 'custom':
      price += product.modules[config.modules || 'small'] || 0;
      price += product.users[config.users || 'small'] || 0;
      if (config.features) {
        config.features.forEach(f => {
          if (product.features[f]) price += product.features[f];
        });
      }
      if (config.urgency === 'urgente') price *= product.urgency;
      break;

    case 'maintenance': {
      const plan = product.plans[config.level || 'basico'] || product.plans.basico;
      price = plan[config.frequency || 'monthly'] || plan.monthly;
      break;
    }

    case 'seo':
      price += product.scope[config.scope || 'local'] || 0;
      if (config.services) {
        config.services.forEach(s => {
          if (product.services[s]) price += product.services[s];
        });
      }
      price *= product.duration[config.duration || 'monthly'] || 1;
      break;
  }

  return Math.round(price);
}

export function calculateFinalPrice(basePrice: number, margin?: number): number {
  const applied = typeof margin === 'number' && isFinite(margin) ? Math.round(margin) : Math.max(MINIMUM_MARGIN, basePrice * PERCENTAGE_MARGIN_RATE);
  return Math.round(basePrice + applied);
}
export function calculateSuggestedMargin(basePrice: number): number {
  return Math.round(Math.max(MINIMUM_MARGIN, basePrice * PERCENTAGE_MARGIN_RATE));
}
export function isValidMargin(margin: number): boolean {
  return isFinite(margin) && margin >= MINIMUM_MARGIN;
}

export function getProductDetails(productType: ProductType, config: QuoteConfig): string[] {
  const details: string[] = [];
  const product = PRICES[productType];
  if (!product) return details;

  switch (productType) {
    case 'web':
      details.push(`Páginas: ${config.pages || 5}`);
      if (config.features?.length) details.push(`Features: ${config.features.join(', ')}`);
      details.push(`Diseño: ${config.design || 'basico'}`);
      break;
    case 'store':
      details.push(`Productos: ${config.products || 'small'}`);
      if (config.features?.length) details.push(`Features: ${config.features.join(', ')}`);
      details.push(`Diseño: ${config.design || 'basico'}`);
      break;
    case 'app':
      details.push(`Plataforma: ${config.platform || 'android'}`);
      details.push(`Pantallas: ${config.screens || 'small'}`);
      if (config.features?.length) details.push(`Features: ${config.features.join(', ')}`);
      details.push(`Complejidad: ${config.complexity || 'basico'}`);
      break;
    case 'custom':
      details.push(`Módulos: ${config.modules || 'small'}`);
      details.push(`Usuarios: ${config.users || 'small'}`);
      if (config.features?.length) details.push(`Features: ${config.features.join(', ')}`);
      break;
    case 'maintenance':
      details.push(`Tipo: ${config.type || 'web'}`);
      details.push(`Frecuencia: ${config.frequency || 'monthly'}`);
      details.push(`Nivel: ${config.level || 'basico'}`);
      break;
    case 'seo':
      details.push(`Alcance: ${config.scope || 'local'}`);
      if (config.services?.length) details.push(`Servicios: ${config.services.join(', ')}`);
      details.push(`Duración: ${config.duration || 'monthly'}`);
      break;
  }

  return details;
}
