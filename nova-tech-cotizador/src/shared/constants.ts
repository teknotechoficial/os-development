export const COMPANY = {
  name: 'TeknoTech Services',
  previousName: 'Nova Tech',
  logo: '/assets/logo-color.png',
  paymentAlias: 'belo.arg.usd',
  paymentTitular: 'TeknoTech Services',
  phone: '+5493754476761',
  email: 'contacto@teknotech.com',
  website: 'https://teknotech.com',
  colors: {
    primary: '#0066CC',
    dark: '#003366',
    bg: '#F5F5F5',
    text: '#191919',
    accent: '#0099FF',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
  fonts: {
    montserrat: ['Montserrat', 'sans-serif'],
    openSans: ['Open Sans', 'sans-serif'],
  },
} as const;

/* Minimum sale price (USD): total below this is charged at this floor */
export const MINIMUM_MARGIN = 250;
export const MIN_TOTAL_MESSAGE = 'El mínimo de venta es de $250 USD';

export const PRODUCT_NAMES: Record<string, string> = {
  web: 'Página Web',
  store: 'Tienda Online',
  app: 'App Móvil',
  custom: 'Sistema a Medida',
  maintenance: 'Mantenimiento Web',
  seo: 'SEO / Marketing',
} as const;

export const STATUS_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  pagada: 'Pagada',
};

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'CEO',
  gerente: 'Gerente General',
  vendedor: 'Vendedor',
  closer: 'Closer de Ventas',
  desarrollador: 'Desarrollador',
};

export const STATUS_COLORS: Record<string, string> = {
  borrador: 'bg-gray-200 text-gray-800',
  enviada: 'bg-blue-100 text-blue-800',
  aceptada: 'bg-green-100 text-green-800',
  rechazada: 'bg-red-100 text-red-800',
  pagada: 'bg-purple-100 text-purple-800',
};

export const AVAILABILITY_COLORS: Record<string, string> = {
  disponible: 'bg-green-500',
  ocupado: 'bg-yellow-500',
  no_disponible: 'bg-red-500',
};

export const AVAILABILITY_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  ocupado: 'Ocupado',
  no_disponible: 'No Disponible',
};
