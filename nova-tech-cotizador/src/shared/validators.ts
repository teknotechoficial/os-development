export function generateId(): string {
  return crypto.randomUUID();
}

export function generateCode(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export function validateQuote(productType: string, config: any, clientName: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!clientName || clientName.trim().length < 2) errors.push('El nombre del cliente debe tener al menos 2 caracteres');
  if (!productType) errors.push('Debe seleccionar un tipo de producto');
  if (!config || Object.keys(config).length === 0) errors.push('Debe completar la configuración del proyecto');
  return { valid: errors.length === 0, errors };
}

/* Display currency comes from settings.currency, synced into nt_prefs.currency by AppLayout.
   Falls back to USD ($) when unavailable (e.g. server-side or first run). */
const CURRENCY_INFO: Record<string, { symbol: string; locale: string }> = {
  USD: { symbol: '$', locale: 'es-AR' },
  EUR: { symbol: '€', locale: 'es-ES' },
  ARS: { symbol: 'AR$', locale: 'es-AR' },
  GBP: { symbol: '£', locale: 'en-GB' },
};

export function formatCurrency(amount: number): string {
  let info = CURRENCY_INFO.USD;
  try {
    const storage = (globalThis as { localStorage?: { getItem: (key: string) => string | null } })
      .localStorage;
    if (storage) {
      const raw = storage.getItem('nt_prefs');
      if (raw) {
        const parsed = JSON.parse(raw);
        const code = parsed && typeof parsed.currency === 'string' ? parsed.currency : '';
        if (code && CURRENCY_INFO[code]) info = CURRENCY_INFO[code];
      }
    }
  } catch {
    /* sin localStorage: se usa USD */
  }
  return `${info.symbol}${Math.round(amount).toLocaleString(info.locale)}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR');
}
