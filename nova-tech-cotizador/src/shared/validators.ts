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

export function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString('es-AR')}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR');
}
