export interface ChatMsg { role: 'system' | 'user' | 'assistant'; content: string }

export interface ProviderResult {
  ok: boolean;
  content?: string;
  error?: string;
}

const TIMEOUT_MS = 45_000;
const MAX_ERROR_DETAIL = 200;

export async function callProvider(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  messages: ChatMsg[];
}): Promise<ProviderResult> {
  if (!opts.baseUrl || !opts.apiKey) {
    return { ok: false, error: 'Proveedor no configurado' };
  }

  const url = `${opts.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model,
        temperature: opts.temperature,
        messages: opts.messages,
      }),
      signal: controller.signal,
    });
  } catch {
    // Aborts fall into the same bucket: the provider never answered in time.
    return { ok: false, error: 'No se pudo conectar con el proveedor de IA' };
  } finally {
    clearTimeout(timer);
  }

  if (res.status < 200 || res.status >= 300) {
    let detail = '';
    try {
      const text = await res.text();
      detail = text.slice(0, MAX_ERROR_DETAIL);
    } catch {
      detail = '';
    }
    const suffix = detail ? `: ${detail}` : '';
    return { ok: false, error: `Proveedor respondió ${res.status}${suffix}` };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: 'Respuesta vacía del proveedor' };
  }

  const choices = (data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices;
  const content = choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.length === 0) {
    return { ok: false, error: 'Respuesta vacía del proveedor' };
  }

  return { ok: true, content };
}
